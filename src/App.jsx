import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  ChevronRight,
  Copy,
  Download,
  Globe2,
  Gauge,
  Gem,
  LayoutGrid,
  LineChart,
  Loader2,
  MapPin,
  NotebookTabs,
  Search,
  Shield,
  Sparkles,
  Target,
  Wand2,
  Zap
} from 'lucide-react';
import { AtlasAPI } from './lib/api.js';
import { copyToClipboard, downloadNodeAsPng } from './lib/export.js';
import { sampleCanvas } from './data/sample.js';

const stageOptions = ['Startup', '1-3 years', '4-6 years', '7+ years', 'Unknown'];

const emptyKnown = {
  name: '',
  website: '',
  location: 'Dallas, TX',
  vertical: 'Med Spa'
};

const emptyFinder = {
  vertical: 'Med Spa',
  location: 'Dallas, TX',
  stage: '1-3 years',
  businessType: 'local service',
  limit: 2
};

const emptyDaily = {
  vertical: 'Med Spa',
  location: 'Dallas, TX',
  includeRealWorldExamples: false
};

const canvasBlockConfig = {
  customerSegments: { title: 'Customer Segments', color: 'cyan' },
  valueProposition: { title: 'Value Proposition', color: 'violet' },
  channels: { title: 'Channels', color: 'blue' },
  customerRelationships: { title: 'Customer Relationships', color: 'pink' },
  revenueStreams: { title: 'Revenue Streams', color: 'green' },
  keyActivities: { title: 'Key Activities', color: 'gold' },
  keyResources: { title: 'Key Resources', color: 'teal' },
  keyPartners: { title: 'Key Partners', color: 'lime' },
  costStructure: { title: 'Cost Structure', color: 'orange' }
};

const strategyBlockConfig = [
  { key: 'growthLevers', title: 'Growth Levers', accent: 'green' },
  { key: 'riskPoints', title: 'Risks', accent: 'orange' },
  { key: 'kpis', title: 'KPI Stack', accent: 'cyan' },
  { key: 'seoContentPlay', title: 'SEO / Content Play', accent: 'teal' },
  { key: 'technologyOpportunities', title: 'Tech / AI Opportunities', accent: 'violet' },
  { key: 'monetizationUpgrades', title: 'Monetization Upgrades', accent: 'blue' }
];

const canvasGroups = [
  { id: 'market', title: 'Market', label: 'Market & Positioning', blocks: ['customerSegments', 'valueProposition', 'channels', 'customerRelationships'] },
  { id: 'money', title: 'Money', label: 'Revenue & Economics', blocks: ['revenueStreams', 'costStructure'] },
  { id: 'operations', title: 'Operations', label: 'Operations & Delivery', blocks: ['keyActivities', 'keyResources', 'keyPartners'] }
];

const strategyGroups = [
  { id: 'growth', title: 'Growth', label: 'Growth & Monetization', blocks: ['growthLevers', 'monetizationUpgrades'] },
  { id: 'execution', title: 'Execution', label: 'Execution Stack', blocks: ['kpis', 'technologyOpportunities'] },
  { id: 'visibility', title: 'Visibility & Risk', label: 'Visibility, Risk & Recommendation', blocks: ['seoContentPlay', 'riskPoints'], showRecommendation: true }
];

const strategyMetaByKey = Object.fromEntries(strategyBlockConfig.map((block) => [block.key, block]));

function App() {
  const [mode, setMode] = useState('known');
  const [known, setKnown] = useState(emptyKnown);
  const [finder, setFinder] = useState(emptyFinder);
  const [daily, setDaily] = useState(emptyDaily);
  const [status, setStatus] = useState('Ready to map a business model.');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [result, setResult] = useState(sampleCanvas);
  const [dailyResult, setDailyResult] = useState(null);
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [canvasTab, setCanvasTab] = useState('market');
  const [strategyTab, setStrategyTab] = useState('growth');
  const exportRef = useRef(null);

  const visibleResult = useMemo(() => {
    if (mode === 'daily' && dailyResult?.stages?.length) {
      return normalizeStageResult(dailyResult, activeStage);
    }
    return result;
  }, [mode, dailyResult, activeStage, result]);

  async function generateKnownCanvas() {
    setError('');
    setLoading(true);
    setCandidates([]);
    try {
      setStatus('Enriching public business information...');
      const enrichment = await AtlasAPI.enrichBusiness(known);
      setStatus('Generating Business Model Atlas canvas...');
      const canvas = await AtlasAPI.generateCanvas({
        business: enrichment.business || known,
        enrichment: enrichment.enrichment || enrichment,
        stage: enrichment.business?.estimatedStage || 'Unknown',
        includeCurematicsRecommendation: true
      });
      setResult(canvas);
      setDailyResult(null);
      setStatus('Canvas generated. Review the strategy dashboard and export the atlas.');
    } catch (err) {
      setError(err.message);
      setStatus('Live generation failed. Demo atlas is still loaded.');
    } finally {
      setLoading(false);
    }
  }

  async function findBusinesses() {
    setError('');
    setLoading(true);
    setCandidates([]);
    try {
      setStatus('Finding real businesses with OpenAI web search...');
      const data = await AtlasAPI.findBusinesses(finder);
      setCandidates(data.candidates || []);
      setStatus((data.candidates || []).length
        ? 'Select a candidate to generate the business model atlas.'
        : 'No reliable candidates found. Broaden the search.');
    } catch (err) {
      setError(err.message);
      setStatus('Business discovery failed. Check your OpenAI key and Netlify Functions.');
    } finally {
      setLoading(false);
    }
  }

  async function generateCandidateCanvas(candidate) {
    setError('');
    setLoading(true);
    try {
      setStatus(`Enriching ${candidate.name}...`);
      const enrichment = await AtlasAPI.enrichBusiness(candidate);
      setStatus('Generating selected business canvas...');
      const canvas = await AtlasAPI.generateCanvas({
        business: enrichment.business || candidate,
        enrichment: enrichment.enrichment || enrichment,
        stage: candidate.estimatedStage || enrichment.business?.estimatedStage || finder.stage,
        includeCurematicsRecommendation: true
      });
      setResult(canvas);
      setDailyResult(null);
      setMode('known');
      setStatus('Candidate canvas generated.');
    } catch (err) {
      setError(err.message);
      setStatus('Candidate generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function generateDaily() {
    setError('');
    setLoading(true);
    try {
      setStatus('Building the daily vertical atlas across maturity stages...');
      const data = await AtlasAPI.generateDailyVertical(daily);
      setDailyResult(data);
      setActiveStage(0);
      setStatus('Daily vertical atlas generated. Switch stages or export the active atlas.');
    } catch (err) {
      setError(err.message);
      setStatus('Daily vertical generation failed. Check API configuration.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(value, label) {
    await copyToClipboard(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    setCopied(label);
    setTimeout(() => setCopied(''), 1600);
  }

  async function handleExport() {
    try {
      await downloadNodeAsPng(exportRef.current, `${safeFilename(visibleResult?.business?.name || 'curematics-atlas')}.png`);
    } catch (err) {
      setError(err.message);
    }
  }

  const activeCanvasGroup = canvasGroups.find((group) => group.id === canvasTab) || canvasGroups[0];
  const activeStrategyGroup = strategyGroups.find((group) => group.id === strategyTab) || strategyGroups[0];
  const progressSteps = buildProgressSteps(status, loading);
  const radarData = getRadarData(visibleResult);
  const revenueMix = getRevenueMix(visibleResult?.canvas?.revenueStreams || []);
  const scoreCards = getScoreCards(visibleResult?.scores || {});
  const growthChart = getGrowthChart(visibleResult?.strategy?.growthLevers || []);
  const sources = visibleResult?.sources || [];

  return (
    <div className="atlas-app">
      <TopHero />

      <div className="workspace-shell">
        <aside className="sidebar-shell">
          <SidebarBrand />
          <ModeSelector mode={mode} setMode={setMode} />

          <div className="sidebar-card form-shell">
            {mode === 'known' && (
              <KnownBusinessForm data={known} setData={setKnown} loading={loading} onGenerate={generateKnownCanvas} />
            )}
            {mode === 'finder' && (
              <FinderForm data={finder} setData={setFinder} loading={loading} onFind={findBusinesses} />
            )}
            {mode === 'daily' && (
              <DailyForm data={daily} setData={setDaily} loading={loading} onGenerate={generateDaily} />
            )}

            <div className="sidebar-actions">
              <button className="ghost-btn" onClick={() => { setResult(sampleCanvas); setDailyResult(null); setMode('known'); setStatus('Demo atlas loaded.'); }}>
                <Sparkles size={16} /> Load demo atlas
              </button>
              <button className="ghost-btn" onClick={() => handleCopy(visibleResult, 'Canvas JSON copied')}>
                <Copy size={16} /> Copy JSON
              </button>
            </div>
          </div>

          <div className="sidebar-card status-shell">
            <div className="card-heading">
              <span className="card-kicker">Atlas status</span>
              <strong>{loading ? 'Generating...' : 'Operational'}</strong>
            </div>
            <p className="status-line">{status}</p>
            <div className="progress-stack">
              {progressSteps.map((step, index) => (
                <div className={`progress-item ${step.state}`} key={`${step.label}-${index}`}>
                  <i />
                  <div>
                    <strong>{step.label}</strong>
                    <span>{step.copy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="notice-card error">{error}</div>}
          {copied && <div className="notice-card success">{copied}</div>}

          {candidates.length > 0 && (
            <CandidateList candidates={candidates} onSelect={generateCandidateCanvas} loading={loading} />
          )}
        </aside>

        <section className="dashboard-shell">
          <Toolbar
            title={visibleResult?.business?.name || 'Business Model Atlas'}
            subtitle={`${visibleResult?.business?.vertical || 'Vertical'} • ${visibleResult?.business?.location || 'Market'}`}
            onCopy={() => handleCopy(visibleResult?.linkedinPost || buildLinkedInPost(visibleResult), 'LinkedIn copy copied')}
            onExport={handleExport}
          />

          {mode === 'daily' && dailyResult?.stages?.length > 0 && (
            <StageTabs stages={dailyResult.stages} activeStage={activeStage} setActiveStage={setActiveStage} />
          )}

          <BusinessHeader business={visibleResult?.business || {}} />

          <div className="score-grid">
            {scoreCards.map((item) => (
              <ScoreCard key={item.label} item={item} />
            ))}
          </div>

          <div className="analytics-grid">
            <Panel title="Business Model Radar" kicker="Composite performance">
              <RadarChart data={radarData} />
            </Panel>
            <Panel title="Opportunity Score Comparison" kicker="Atlas scoring">
              <HorizontalBarChart items={scoreCards} />
            </Panel>
            <Panel title="Revenue Mix" kicker="Revenue model view">
              <RevenueMixChart items={revenueMix} />
            </Panel>
            <Panel title="Top Growth Levers" kicker="Priority actions">
              <GrowthLeversChart items={growthChart} />
            </Panel>
          </div>

          <div className="content-grid">
            <div className="main-column">
              <section className="canvas-section">
                <div className="section-head">
                  <div>
                    <span className="section-kicker">Business Model Canvas</span>
                    <h3>Core business structure</h3>
                  </div>
                  <span className="section-chip">9 blocks</span>
                </div>
                <GroupTabs groups={canvasGroups} activeId={canvasTab} onChange={setCanvasTab} />
                <div className={`canvas-grid compact ${activeCanvasGroup.id}`}>
                  {activeCanvasGroup.blocks.map((key) => {
                    const meta = canvasBlockConfig[key];
                    return <CanvasCard key={key} title={meta.title} items={visibleResult?.canvas?.[key]} color={meta.color} />;
                  })}
                </div>
              </section>

              <section className="strategy-section">
                <div className="section-head">
                  <div>
                    <span className="section-kicker">Strategy Layer</span>
                    <h3>Growth, risks, and execution</h3>
                  </div>
                  <span className="section-chip">Actionable</span>
                </div>
                <GroupTabs groups={strategyGroups} activeId={strategyTab} onChange={setStrategyTab} />
                <div className={`strategy-grid compact ${activeStrategyGroup.id}`}>
                  {activeStrategyGroup.blocks.map((key) => {
                    const block = strategyMetaByKey[key];
                    return (
                      <StrategyCard
                        key={block.key}
                        title={block.title}
                        items={asList(visibleResult?.strategy?.[block.key])}
                        accent={block.accent}
                      />
                    );
                  })}
                </div>
                {activeStrategyGroup.showRecommendation && <RecommendationCard text={visibleResult?.strategy?.curematicsRecommendation} />}
              </section>
            </div>

            <div className="side-column">
              <ExportPanel
                result={visibleResult}
                exportRef={exportRef}
                onExport={handleExport}
                onCopy={() => handleCopy(visibleResult?.linkedinPost || buildLinkedInPost(visibleResult), 'LinkedIn copy copied')}
              />

              <section className="side-card">
                <div className="section-head tight">
                  <div>
                    <span className="section-kicker">Sources</span>
                    <h3>Evidence & grounding</h3>
                  </div>
                </div>
                {sources.length ? (
                  <div className="source-list">
                    {sources.map((source, index) => {
                      const url = typeof source === 'string' ? source : source.url;
                      return (
                        <a key={`${url}-${index}`} href={url?.startsWith('http') ? url : undefined} target="_blank" rel="noreferrer">
                          {url || JSON.stringify(source)}
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted-copy">Generate a live canvas to load public source URLs and evidence.</p>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TopHero() {
  return (
    <header className="top-hero">
      <div className="hero-bg hero-grid-lines" />
      <div className="hero-bg hero-glow-left" />
      <div className="hero-bg hero-glow-right" />
      <div className="hero-content">
        <div className="hero-brand-line">
          <div className="brand-orb"><LayoutGrid size={20} /></div>
          <div>
            <strong>Curematics</strong>
            <span>Business Model Atlas</span>
          </div>
        </div>

        <div className="hero-copy-block">
          <div>
            <span className="hero-kicker">AI-powered business model intelligence</span>
            <h1>Turn any business into a strategic intelligence map.</h1>
            <p>
              Discover businesses, generate business model canvases, visualize growth opportunities,
              and export strategy-ready assets from one modern Curematics dashboard.
            </p>
          </div>
          <div className="hero-actions">
            <a className="hero-btn primary" href="#workspace"><Wand2 size={16} /> Generate a canvas</a>
            <a className="hero-btn secondary" href="#workspace"><NotebookTabs size={16} /> See the live atlas</a>
          </div>
          <div className="hero-badges">
            <span><Search size={14} /> Business discovery</span>
            <span><LineChart size={14} /> Charted insights</span>
            <span><Download size={14} /> Shareable exports</span>
          </div>

          <div className="feature-flash">
            <div>
              <span>New Feature</span>
              <strong>Vertical Intel Snapshot</strong>
              <p>Every generated atlas now surfaces a cleaner executive view of score trends, revenue mix, and priority growth levers.</p>
            </div>
            <div className="feature-flash-metrics">
              <b>4</b><small>score cards</small>
              <b>3</b><small>chart views</small>
              <b>9</b><small>canvas blocks</small>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function SidebarBrand() {
  return (
    <div className="sidebar-brand">
      <div className="brand-lockup">
        <div className="brand-lockup-icon"><Gem size={18} /></div>
        <div>
          <strong>Curematics</strong>
          <span>Business Model Atlas</span>
        </div>
      </div>
      <div className="brand-tag">Straightforward strategy. Modern insight.</div>
    </div>
  );
}

function ModeSelector({ mode, setMode }) {
  const modes = [
    { id: 'known', title: 'Known Business', copy: 'Enter a business and map its model.', icon: Building2 },
    { id: 'finder', title: 'Find Business', copy: 'Search for examples by market and stage.', icon: Search },
    { id: 'daily', title: 'Daily Vertical', copy: 'Generate staged models for one vertical.', icon: Globe2 }
  ];
  return (
    <div className="mode-stack">
      {modes.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={`mode-tab ${mode === item.id ? 'active' : ''}`} onClick={() => setMode(item.id)}>
            <Icon size={18} />
            <div>
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </div>
            <ChevronRight size={16} className="mode-chevron" />
          </button>
        );
      })}
    </div>
  );
}

function Toolbar({ title, subtitle, onCopy, onExport }) {
  return (
    <div className="toolbar" id="workspace">
      <div>
        <span className="section-kicker">Overview</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="toolbar-actions">
        <div className="toolbar-search"><Search size={14} /><span>Search businesses, reports, keywords...</span></div>
        <button className="toolbar-btn" onClick={onCopy}><Copy size={15} /> LinkedIn copy</button>
        <button className="toolbar-btn primary" onClick={onExport}><Download size={15} /> Export PNG</button>
      </div>
    </div>
  );
}

function BusinessHeader({ business }) {
  return (
    <section className="business-header-card">
      <div className="business-logo">{initialsFor(business.name || 'Atlas')}</div>
      <div className="business-identity">
        <h3>{business.name || 'Business Model Atlas'}</h3>
        <div className="badge-row">
          <span className="meta-badge violet">{business.vertical || 'Vertical'}</span>
          <span className="meta-badge cyan"><MapPin size={12} /> {business.location || 'Market'}</span>
          <span className="meta-badge blue">{business.stage || business.estimatedStage || 'Unknown stage'}</span>
        </div>
      </div>
      <div className="business-context">
        <div>
          <span>Status</span>
          <strong>Atlas Ready</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>Strategy Dashboard</strong>
        </div>
      </div>
    </section>
  );
}

function ScoreCard({ item }) {
  return (
    <article className="score-card">
      <div className="score-card-head">
        <span className={`icon-wrap ${item.accent}`}><item.icon size={15} /></span>
        <div>
          <span className="score-label">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      </div>
      <div className="score-card-foot">
        <span>{item.status}</span>
        <MiniSparkline value={item.value} accent={item.accent} />
      </div>
    </article>
  );
}

function Panel({ title, kicker, children }) {
  return (
    <section className="panel-card">
      <div className="panel-head">
        <div>
          <span className="section-kicker">{kicker}</span>
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function RadarChart({ data }) {
  const size = 260;
  const center = size / 2;
  const radius = 88;
  const levels = [0.25, 0.5, 0.75, 1];
  const points = data.map((item, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index / data.length);
    const pointRadius = radius * (item.value / 100);
    return {
      ...item,
      x: center + Math.cos(angle) * pointRadius,
      y: center + Math.sin(angle) * pointRadius,
      lx: center + Math.cos(angle) * (radius + 26),
      ly: center + Math.sin(angle) * (radius + 26)
    };
  });
  const polygonPoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="radar-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg" role="img" aria-label="Business model radar chart">
        {levels.map((level) => {
          const shape = data.map((_, index) => {
            const angle = (-Math.PI / 2) + (Math.PI * 2 * index / data.length);
            const x = center + Math.cos(angle) * radius * level;
            const y = center + Math.sin(angle) * radius * level;
            return `${x},${y}`;
          }).join(' ');
          return <polygon key={level} points={shape} className="radar-grid" />;
        })}
        {data.map((_, index) => {
          const angle = (-Math.PI / 2) + (Math.PI * 2 * index / data.length);
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          return <line key={index} x1={center} y1={center} x2={x} y2={y} className="radar-axis" />;
        })}
        <polygon points={polygonPoints} className="radar-area" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" className="radar-dot" />
            <text x={point.lx} y={point.ly} className="radar-label" textAnchor="middle">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HorizontalBarChart({ items }) {
  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <div className="bar-label-line">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track">
            <div className={`bar-fill ${item.accent}`} style={{ width: `${item.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueMixChart({ items }) {
  const gradient = items.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(', ');
  return (
    <div className="revenue-wrap">
      <div className="donut-shell">
        <div className="donut-chart" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="donut-core">
            <span>Revenue</span>
            <strong>Mix</strong>
          </div>
        </div>
      </div>
      <div className="legend-list">
        {items.map((item) => (
          <div className="legend-row" key={item.label}>
            <div className="legend-label"><i style={{ background: item.color }} />{item.label}</div>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrowthLeversChart({ items }) {
  return (
    <div className="growth-list">
      {items.map((item) => (
        <div className="growth-row" key={item.label}>
          <div>
            <strong>{item.label}</strong>
            <span>Priority action</span>
          </div>
          <div className="growth-metric">
            <div className="growth-bar"><div style={{ width: `${item.value}%` }} /></div>
            <b>{item.value}</b>
          </div>
        </div>
      ))}
    </div>
  );
}

function CanvasCard({ title, items, color }) {
  const list = asList(items);
  return (
    <article className={`canvas-card ${color}`}>
      <div className="canvas-card-head">
        <span className={`canvas-dot ${color}`} />
        <h4>{title}</h4>
      </div>
      {list.length ? (
        <ul>
          {list.slice(0, 5).map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      ) : (
        <p className="muted-copy">Generate a live atlas to populate this block.</p>
      )}
    </article>
  );
}

function StrategyCard({ title, items, accent }) {
  return (
    <article className={`strategy-card ${accent}`}>
      <div className="strategy-card-head">
        <span className={`canvas-dot ${accent}`} />
        <h4>{title}</h4>
      </div>
      {items.length ? (
        <ul>
          {items.slice(0, 4).map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      ) : (
        <p className="muted-copy">Generate a live atlas to populate this strategy block.</p>
      )}
    </article>
  );
}

function RecommendationCard({ text }) {
  return (
    <div className="recommendation-card-new">
      <div className="recommendation-label"><Target size={14} /> Curematics Recommendation</div>
      <p>{text || 'Generate a live atlas to surface the recommendation.'}</p>
    </div>
  );
}

function ExportPanel({ result, exportRef, onExport, onCopy }) {
  return (
    <section className="side-card export-card-shell">
      <div className="section-head tight">
        <div>
          <span className="section-kicker">Export & Share</span>
          <h3>Atlas preview</h3>
        </div>
      </div>
      <div className="preview-card-wrap">
        <MiniAtlasPreview result={result} exportRef={exportRef} />
      </div>
      <div className="export-actions">
        <button className="export-btn primary" onClick={onExport}><Download size={16} /> Download as PNG</button>
        <button className="export-btn" onClick={onCopy}><Copy size={16} /> Copy share copy</button>
      </div>
      <div className="export-foot"><Shield size={14} /> Secure • Shareable • Always up to date</div>
    </section>
  );
}

function MiniAtlasPreview({ result, exportRef }) {
  const scoreCards = getScoreCards(result?.scores || {}).slice(0, 2);
  const revenueMix = getRevenueMix(result?.canvas?.revenueStreams || []);
  return (
    <div className="mini-atlas" ref={exportRef}>
      <div className="mini-head">
        <div>
          <span>Curematics</span>
          <strong>{result?.business?.name || 'Business Model Atlas'}</strong>
        </div>
        <div className="mini-score">{result?.scores?.businessModelScore ?? '—'}</div>
      </div>
      <div className="mini-metrics">
        {scoreCards.map((card) => (
          <div key={card.label} className="mini-metric">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>
      <div className="mini-grid">
        <div className="mini-box">
          <span>Top Growth Lever</span>
          <strong>{result?.strategy?.growthLevers?.[0] || 'Generate a live atlas'}</strong>
        </div>
        <div className="mini-box donut-box">
          <span>Revenue Mix</span>
          <div className="mini-donut" style={{ background: `conic-gradient(${revenueMix.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(', ')})` }}>
            <i />
          </div>
        </div>
      </div>
      <div className="mini-footer">strategy • intelligence • growth</div>
    </div>
  );
}

function KnownBusinessForm({ data, setData, loading, onGenerate }) {
  return (
    <div>
      <div className="card-heading">
        <span className="card-kicker">Mode</span>
        <strong>Known Business</strong>
      </div>
      <Input label="Business Name" value={data.name} onChange={(name) => setData({ ...data, name })} placeholder="Hamm's Meat Market" />
      <Input label="Website" value={data.website} onChange={(website) => setData({ ...data, website })} placeholder="https://example.com" />
      <Input label="Location" value={data.location} onChange={(location) => setData({ ...data, location })} placeholder="Dallas, TX" />
      <Input label="Vertical" value={data.vertical} onChange={(vertical) => setData({ ...data, vertical })} placeholder="Med Spa" />
      <button className="action-btn primary wide" disabled={loading || !data.name} onClick={onGenerate}>
        {loading ? <Loader2 className="spin" size={16} /> : <ArrowRight size={16} />} Generate Atlas Canvas
      </button>
    </div>
  );
}

function FinderForm({ data, setData, loading, onFind }) {
  return (
    <div>
      <div className="card-heading">
        <span className="card-kicker">Mode</span>
        <strong>Find Business</strong>
      </div>
      <Input label="Vertical" value={data.vertical} onChange={(vertical) => setData({ ...data, vertical })} placeholder="HVAC" />
      <Input label="Location" value={data.location} onChange={(location) => setData({ ...data, location })} placeholder="Austin, TX" />
      <Select label="Desired Stage" value={data.stage} onChange={(stage) => setData({ ...data, stage })} options={stageOptions} />
      <Input label="Business Type" value={data.businessType} onChange={(businessType) => setData({ ...data, businessType })} placeholder="local service" />
      <button className="action-btn primary wide" disabled={loading || !data.vertical} onClick={onFind}>
        {loading ? <Loader2 className="spin" size={16} /> : <Search size={16} />} Find Businesses
      </button>
    </div>
  );
}

function DailyForm({ data, setData, loading, onGenerate }) {
  return (
    <div>
      <div className="card-heading">
        <span className="card-kicker">Mode</span>
        <strong>Daily Vertical</strong>
      </div>
      <Input label="Vertical" value={data.vertical} onChange={(vertical) => setData({ ...data, vertical })} placeholder="Dental Offices" />
      <Input label="Location / Market" value={data.location} onChange={(location) => setData({ ...data, location })} placeholder="United States or Dallas, TX" />
      <label className="toggle-row">
        <input type="checkbox" checked={data.includeRealWorldExamples} onChange={(e) => setData({ ...data, includeRealWorldExamples: e.target.checked })} />
        <span>Include real-world example logic when reliable</span>
      </label>
      <button className="action-btn primary wide" disabled={loading || !data.vertical} onClick={onGenerate}>
        {loading ? <Loader2 className="spin" size={16} /> : <Globe2 size={16} />} Generate Daily Atlas
      </button>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CandidateList({ candidates, onSelect, loading }) {
  return (
    <div className="sidebar-card candidate-shell">
      <div className="card-heading">
        <span className="card-kicker">Candidates</span>
        <strong>AI Business Finder results</strong>
      </div>
      <div className="candidate-list-new">
        {candidates.map((candidate, index) => (
          <article className="candidate-item" key={`${candidate.name}-${index}`}>
            <div>
              <strong>{candidate.name}</strong>
              <span><MapPin size={12} /> {candidate.location || 'Unknown location'}</span>
              <p>{candidate.reasonSelected}</p>
            </div>
            <div className="candidate-foot">
              <span className="meta-badge muted">{candidate.estimatedStage || 'Unknown'}</span>
              <span className="meta-badge muted">{Math.round((candidate.confidence || 0) * 100)}% confidence</span>
              <button className="action-btn slim" disabled={loading} onClick={() => onSelect(candidate)}>Generate</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function GroupTabs({ groups, activeId, onChange }) {
  return (
    <div className="group-tabs">
      {groups.map((group) => (
        <button
          key={group.id}
          type="button"
          className={activeId === group.id ? 'active' : ''}
          onClick={() => onChange(group.id)}
        >
          <strong>{group.title}</strong>
          <span>{group.label}</span>
        </button>
      ))}
    </div>
  );
}

function StageTabs({ stages, activeStage, setActiveStage }) {
  return (
    <div className="stage-tabs-new">
      {stages.map((stage, index) => (
        <button key={stage.stage || index} className={activeStage === index ? 'active' : ''} onClick={() => setActiveStage(index)}>
          {stage.stage || `Stage ${index + 1}`}
        </button>
      ))}
    </div>
  );
}

function MiniSparkline({ value, accent }) {
  const bars = [0.35, 0.55, 0.44, 0.72, 0.58].map((base, index) => {
    const adjusted = Math.min(1, Math.max(0.2, base + ((value || 0) - 60) / 220 + index * 0.02));
    return adjusted;
  });
  return (
    <div className={`mini-sparkline ${accent}`}>
      {bars.map((bar, index) => <i key={index} style={{ height: `${bar * 100}%` }} />)}
    </div>
  );
}

function buildProgressSteps(status, loading) {
  const current = String(status || '').toLowerCase();
  return [
    {
      label: 'Input received',
      copy: 'Business or vertical parameters prepared.',
      state: current.includes('ready') ? 'pending' : 'done'
    },
    {
      label: 'Discovery / enrichment',
      copy: 'Public business signals and context are analyzed.',
      state: current.includes('enrich') || current.includes('finding') ? 'active' : (current.includes('canvas generated') || current.includes('atlas generated') || current.includes('candidate canvas generated')) ? 'done' : loading ? 'pending' : 'done'
    },
    {
      label: 'Canvas generation',
      copy: 'The atlas model and strategy layers are assembled.',
      state: current.includes('generating') || current.includes('building') ? 'active' : (current.includes('generated') || current.includes('review')) ? 'done' : 'pending'
    },
    {
      label: 'Export readiness',
      copy: 'Dashboard and shareable preview are prepared.',
      state: current.includes('generated') || current.includes('review') ? 'done' : 'pending'
    }
  ];
}

function getScoreCards(scores) {
  return [
    {
      label: 'Business Model Score',
      value: clampScore(scores.businessModelScore),
      status: getScoreStatus(scores.businessModelScore),
      accent: 'blue',
      icon: Gauge
    },
    {
      label: 'Digital Opportunity',
      value: clampScore(scores.digitalOpportunityScore),
      status: getScoreStatus(scores.digitalOpportunityScore),
      accent: 'cyan',
      icon: LineChart
    },
    {
      label: 'Monetization Opportunity',
      value: clampScore(scores.monetizationOpportunityScore),
      status: getScoreStatus(scores.monetizationOpportunityScore),
      accent: 'violet',
      icon: Zap
    },
    {
      label: 'Automation Opportunity',
      value: clampScore(scores.automationOpportunityScore),
      status: getScoreStatus(scores.automationOpportunityScore),
      accent: 'gold',
      icon: Bot
    }
  ];
}

function getRadarData(result) {
  const scores = result?.scores || {};
  const canvas = result?.canvas || {};
  const weighted = (a = 0, b = 0) => Math.round((a + b) / 2);
  return [
    { label: 'Market Strength', value: weighted(clampScore(scores.businessModelScore), clampScore(scores.digitalOpportunityScore)) },
    { label: 'Offer Clarity', value: deriveListScore(canvas.valueProposition, 72) },
    { label: 'Revenue Maturity', value: clampScore(scores.monetizationOpportunityScore) },
    { label: 'Digital Presence', value: clampScore(scores.digitalOpportunityScore) },
    { label: 'Operational Efficiency', value: clampScore(scores.automationOpportunityScore) },
    { label: 'Expansion Potential', value: weighted(deriveListScore(result?.strategy?.growthLevers, 70), clampScore(scores.businessModelScore)) }
  ];
}

function getRevenueMix(revenueStreams) {
  const raw = [
    { label: 'Services', value: 48, color: '#4de7ff' },
    { label: 'Memberships', value: 22, color: '#6e8cff' },
    { label: 'Add-ons', value: 15, color: '#a478ff' },
    { label: 'Partnerships', value: 15, color: '#7affc6' }
  ];
  const list = asList(revenueStreams).map((item) => item.toLowerCase());
  list.forEach((item) => {
    if (/(membership|subscription|retainer|monthly)/.test(item)) raw[1].value += 4;
    else if (/(partner|affiliate|wholesale|corporate)/.test(item)) raw[3].value += 3;
    else if (/(add-on|upsell|bundle|retail|product)/.test(item)) raw[2].value += 3;
    else raw[0].value += 2;
  });
  const total = raw.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  return raw.map((item) => {
    const value = Math.round((item.value / total) * 100);
    const start = cursor;
    cursor += value;
    return { ...item, value, start, end: cursor };
  });
}

function getGrowthChart(items) {
  const list = asList(items).slice(0, 5);
  const fallback = ['SEO / Content', 'Membership Model', 'Pricing Optimization', 'Local Partnerships', 'Automation'];
  const labels = (list.length ? list : fallback).map((item) => String(item));
  return labels.map((label, index) => ({ label, value: Math.max(48, 84 - index * 10) }));
}

function asList(items) {
  if (Array.isArray(items)) return items.filter(Boolean);
  if (typeof items === 'string' && items.trim()) return [items];
  return [];
}

function deriveListScore(items, base = 70) {
  const count = asList(items).length;
  return clampScore(base + count * 4);
}

function getScoreStatus(value) {
  const score = clampScore(value);
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'High';
  if (score >= 60) return 'Medium-High';
  if (score >= 50) return 'Medium';
  return 'Emerging';
}

function clampScore(value) {
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function initialsFor(name) {
  return String(name || 'A').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function normalizeStageResult(dailyResult, activeStage) {
  const stage = dailyResult.stages[activeStage] || dailyResult.stages[0];
  return {
    canvasId: `daily_${dailyResult.vertical}_${stage.stage}`,
    business: {
      name: `${dailyResult.vertical} Model — ${stage.stage}`,
      vertical: dailyResult.vertical,
      location: dailyResult.location || 'Market',
      stage: stage.stage
    },
    canvas: stage.canvas || {},
    strategy: stage.strategy || {},
    scores: stage.scores || {
      businessModelScore: 78,
      digitalOpportunityScore: 82,
      monetizationOpportunityScore: 80,
      automationOpportunityScore: 75
    },
    sources: dailyResult.sources || stage.sources || [],
    linkedinPost: stage.linkedinPost || buildLinkedInPost({ business: { name: `${dailyResult.vertical} ${stage.stage}` }, strategy: stage.strategy })
  };
}

function buildLinkedInPost(result) {
  return `Business Model Atlas: ${result?.business?.name || 'New Canvas'}\n\nTop growth angle: ${result?.strategy?.growthLevers?.[0] || 'clarify the business model, revenue streams, and retention levers.'}\n\nCurematics recommendation: ${result?.strategy?.curematicsRecommendation || 'turn public business signals into a practical growth strategy.'}`;
}

function safeFilename(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'curematics-atlas';
}

export default App;
