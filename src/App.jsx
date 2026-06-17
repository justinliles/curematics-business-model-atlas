import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Building2,
  Copy,
  Download,
  Gauge,
  Globe2,
  Layers3,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Zap,
  Image as ImageIcon
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
  limit: 5
};

const emptyDaily = {
  vertical: 'Med Spa',
  location: 'Dallas, TX',
  includeRealWorldExamples: true
};

const canvasBlocks = [
  ['Customer Segments', 'customerSegments'],
  ['Value Proposition', 'valueProposition'],
  ['Channels', 'channels'],
  ['Customer Relationships', 'customerRelationships'],
  ['Revenue Streams', 'revenueStreams'],
  ['Key Activities', 'keyActivities'],
  ['Key Resources', 'keyResources'],
  ['Key Partners', 'keyPartners'],
  ['Cost Structure', 'costStructure']
];

const strategyBlocks = [
  ['Growth Levers', 'growthLevers'],
  ['Risk Points', 'riskPoints'],
  ['KPI Stack', 'kpis'],
  ['Tech / AI Opportunities', 'technologyOpportunities'],
  ['Monetization Upgrades', 'monetizationUpgrades']
];

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
  const graphicRef = useRef(null);

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
      setStatus('Canvas generated. Review the strategy card and export the graphic.');
    } catch (err) {
      setError(err.message);
      setStatus('Live generation failed. Demo canvas is still available.');
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
      setStatus((data.candidates || []).length ? 'Select a candidate to generate the canvas.' : 'No reliable candidates found. Broaden the search.');
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
      setStatus('Daily vertical atlas generated. Switch stages or export the active card.');
    } catch (err) {
      setError(err.message);
      setStatus('Daily vertical generation failed. Check API configuration.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(value, label) {
    await copyToClipboard(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1600);
  }

  async function handleExport() {
    try {
      await downloadNodeAsPng(graphicRef.current, `${safeFilename(visibleResult?.business?.name || 'curematics-atlas')}.png`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="atlas-app">
      <Hero status={status} loading={loading} />

      <main className="app-shell">
        <section className="control-panel">
          <ModeSelector mode={mode} setMode={setMode} />

          {mode === 'known' && (
            <KnownBusinessForm
              data={known}
              setData={setKnown}
              loading={loading}
              onGenerate={generateKnownCanvas}
            />
          )}

          {mode === 'finder' && (
            <FinderForm
              data={finder}
              setData={setFinder}
              loading={loading}
              onFind={findBusinesses}
            />
          )}

          {mode === 'daily' && (
            <DailyForm
              data={daily}
              setData={setDaily}
              loading={loading}
              onGenerate={generateDaily}
            />
          )}

          <div className="utility-row">
            <button className="secondary-btn" onClick={() => { setResult(sampleCanvas); setDailyResult(null); setMode('known'); setStatus('Demo atlas loaded.'); }}>
              <Sparkles size={16} /> Load demo
            </button>
            <button className="secondary-btn" onClick={() => handleCopy(visibleResult, 'JSON copied')}>
              <Copy size={16} /> Copy JSON
            </button>
          </div>

          {error && <div className="error-card">{error}</div>}
          {copied && <div className="success-card">{copied}</div>}

          {candidates.length > 0 && (
            <CandidateList candidates={candidates} onSelect={generateCandidateCanvas} loading={loading} />
          )}
        </section>

        <section className="result-panel">
          {mode === 'daily' && dailyResult?.stages?.length && (
            <StageTabs stages={dailyResult.stages} activeStage={activeStage} setActiveStage={setActiveStage} />
          )}

          <div className="top-actions">
            <div>
              <p className="eyebrow">Live Canvas Preview</p>
              <h2>{visibleResult?.business?.name || 'Business Model Atlas'}</h2>
            </div>
            <div className="action-buttons">
              <button className="secondary-btn" onClick={() => handleCopy(visibleResult?.linkedinPost || buildLinkedInPost(visibleResult), 'Post copied')}>
                <Copy size={16} /> LinkedIn copy
              </button>
              <button className="primary-btn" onClick={handleExport}>
                <Download size={16} /> Export PNG
              </button>
            </div>
          </div>

          <AtlasGraphic result={visibleResult} refProp={graphicRef} />
          <CanvasDetails result={visibleResult} />
        </section>
      </main>
    </div>
  );
}

function Hero({ status, loading }) {
  return (
    <header className="hero">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <nav className="nav">
        <div className="brand-mark"><Layers3 size={22} /></div>
        <div>
          <strong>Curematics</strong>
          <span>Business Model Atlas</span>
        </div>
      </nav>
      <div className="hero-grid">
        <div>
          <p className="eyebrow">OpenAI-powered business model intelligence</p>
          <h1>Find a business. Generate the canvas. Export the strategy graphic.</h1>
          <p className="hero-copy">
            A next-level Curematics app for turning real-world businesses and verticals into structured business model canvases, growth recommendations, and shareable visual strategy cards.
          </p>
          <div className="hero-badges">
            <span><Brain size={14} /> AI business finder</span>
            <span><Gauge size={14} /> Opportunity scoring</span>
            <span><ImageIcon size={14} /> PNG canvas export</span>
          </div>
        </div>
        <div className="status-console">
          <div className="console-dot-row"><i /><i /><i /></div>
          <p>{loading ? <Loader2 className="spin" size={16} /> : <Zap size={16} />} Atlas Status</p>
          <strong>{status}</strong>
          <div className="signal-bars"><i /><i /><i /><i /><i /></div>
        </div>
      </div>
    </header>
  );
}

function ModeSelector({ mode, setMode }) {
  const modes = [
    ['known', Building2, 'Known Business', 'Enter a business and generate its canvas.'],
    ['finder', Search, 'AI Business Finder', 'Find examples by vertical, market, and stage.'],
    ['daily', Globe2, 'Daily Vertical Atlas', 'Generate staged canvases for one vertical.']
  ];
  return (
    <div className="mode-grid">
      {modes.map(([id, Icon, title, copy]) => (
        <button key={id} className={`mode-card ${mode === id ? 'active' : ''}`} onClick={() => setMode(id)}>
          <Icon size={20} />
          <strong>{title}</strong>
          <span>{copy}</span>
        </button>
      ))}
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

function KnownBusinessForm({ data, setData, loading, onGenerate }) {
  return (
    <div className="form-card">
      <h3>Known Business</h3>
      <Input label="Business Name" value={data.name} onChange={(name) => setData({ ...data, name })} placeholder="Hamm's Meat Market" />
      <Input label="Website" value={data.website} onChange={(website) => setData({ ...data, website })} placeholder="https://example.com" />
      <Input label="Location" value={data.location} onChange={(location) => setData({ ...data, location })} placeholder="Dallas, TX" />
      <Input label="Vertical" value={data.vertical} onChange={(vertical) => setData({ ...data, vertical })} placeholder="Med Spa" />
      <button className="primary-btn wide" disabled={loading || !data.name} onClick={onGenerate}>
        {loading ? <Loader2 className="spin" size={17} /> : <ArrowRight size={17} />} Generate Atlas Canvas
      </button>
    </div>
  );
}

function FinderForm({ data, setData, loading, onFind }) {
  return (
    <div className="form-card">
      <h3>AI Business Finder</h3>
      <Input label="Vertical" value={data.vertical} onChange={(vertical) => setData({ ...data, vertical })} placeholder="HVAC" />
      <Input label="Location" value={data.location} onChange={(location) => setData({ ...data, location })} placeholder="Austin, TX" />
      <Select label="Desired Stage" value={data.stage} onChange={(stage) => setData({ ...data, stage })} options={stageOptions} />
      <Input label="Business Type" value={data.businessType} onChange={(businessType) => setData({ ...data, businessType })} placeholder="local service" />
      <button className="primary-btn wide" disabled={loading || !data.vertical} onClick={onFind}>
        {loading ? <Loader2 className="spin" size={17} /> : <Search size={17} />} Find Businesses
      </button>
    </div>
  );
}

function DailyForm({ data, setData, loading, onGenerate }) {
  return (
    <div className="form-card">
      <h3>Daily Vertical Atlas</h3>
      <Input label="Vertical" value={data.vertical} onChange={(vertical) => setData({ ...data, vertical })} placeholder="Dental Offices" />
      <Input label="Location / Market" value={data.location} onChange={(location) => setData({ ...data, location })} placeholder="United States or Dallas, TX" />
      <label className="toggle-row">
        <input type="checkbox" checked={data.includeRealWorldExamples} onChange={(e) => setData({ ...data, includeRealWorldExamples: e.target.checked })} />
        <span>Include real-world example logic when reliable</span>
      </label>
      <button className="primary-btn wide" disabled={loading || !data.vertical} onClick={onGenerate}>
        {loading ? <Loader2 className="spin" size={17} /> : <Globe2 size={17} />} Generate Daily Atlas
      </button>
    </div>
  );
}

function CandidateList({ candidates, onSelect, loading }) {
  return (
    <div className="candidate-list">
      <h3>Candidate Businesses</h3>
      {candidates.map((candidate, index) => (
        <article className="candidate-card" key={`${candidate.name}-${index}`}>
          <div>
            <strong>{candidate.name}</strong>
            <span><MapPin size={13} /> {candidate.location || 'Unknown location'}</span>
            <p>{candidate.reasonSelected}</p>
          </div>
          <div className="candidate-footer">
            <span className="pill">{candidate.estimatedStage || 'Unknown'}</span>
            <span className="pill">{Math.round((candidate.confidence || 0) * 100)}% confidence</span>
            <button className="mini-btn" disabled={loading} onClick={() => onSelect(candidate)}>Generate</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function StageTabs({ stages, activeStage, setActiveStage }) {
  return (
    <div className="stage-tabs">
      {stages.map((stage, index) => (
        <button key={stage.stage || index} className={activeStage === index ? 'active' : ''} onClick={() => setActiveStage(index)}>
          {stage.stage || `Stage ${index + 1}`}
        </button>
      ))}
    </div>
  );
}

function AtlasGraphic({ result, refProp }) {
  const business = result?.business || {};
  const scores = result?.scores || {};
  const canvas = result?.canvas || {};
  const strategy = result?.strategy || {};
  const scoreValues = [
    ['Model', scores.businessModelScore],
    ['Digital', scores.digitalOpportunityScore],
    ['Money', scores.monetizationOpportunityScore],
    ['Auto', scores.automationOpportunityScore]
  ];

  return (
    <div className="graphic-wrap">
      <div className="atlas-card" ref={refProp}>
        <div className="atlas-card-bg" />
        <div className="atlas-header">
          <div>
            <p>Curematics Business Model Atlas</p>
            <h2>{business.name || 'Business Model Canvas'}</h2>
            <span>{business.vertical || 'Vertical'} • {business.location || 'Market'} • {business.stage || business.estimatedStage || 'Stage Unknown'}</span>
          </div>
          <div className="atlas-mark">C</div>
        </div>

        <div className="score-strip">
          {scoreValues.map(([label, value]) => (
            <div className="score-pill" key={label}>
              <strong>{Number.isFinite(value) ? value : '—'}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="canvas-mini-grid">
          <GraphicBlock title="Customer" items={canvas.customerSegments} />
          <GraphicBlock title="Value" items={canvas.valueProposition} featured />
          <GraphicBlock title="Revenue" items={canvas.revenueStreams} />
          <GraphicBlock title="Channels" items={canvas.channels} />
          <GraphicBlock title="Activities" items={canvas.keyActivities} />
          <GraphicBlock title="Costs" items={canvas.costStructure} />
        </div>

        <div className="strategy-row">
          <GraphicBlock title="Growth Levers" items={strategy.growthLevers} compact />
          <GraphicBlock title="Risk Points" items={strategy.riskPoints} compact />
        </div>

        <div className="recommendation-card">
          <span>Curematics Recommendation</span>
          <p>{strategy.curematicsRecommendation || 'Generate a canvas to create the strategic recommendation.'}</p>
        </div>
      </div>
    </div>
  );
}

function GraphicBlock({ title, items = [], featured = false, compact = false }) {
  const list = Array.isArray(items) ? items.slice(0, compact ? 3 : 4) : [String(items || '')].filter(Boolean);
  return (
    <div className={`graphic-block ${featured ? 'featured' : ''}`}>
      <strong>{title}</strong>
      <ul>
        {list.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function CanvasDetails({ result }) {
  if (!result) return null;
  return (
    <div className="details-grid">
      <section className="details-section">
        <h3>Full Canvas</h3>
        <div className="block-grid">
          {canvasBlocks.map(([title, key]) => <DetailBlock key={key} title={title} items={result.canvas?.[key]} />)}
        </div>
      </section>

      <section className="details-section">
        <h3>Strategy Layer</h3>
        <div className="block-grid two">
          {strategyBlocks.map(([title, key]) => <DetailBlock key={key} title={title} items={result.strategy?.[key]} />)}
          <DetailBlock title="SEO / Content Play" items={[result.strategy?.seoContentPlay].flat().filter(Boolean)} />
        </div>
      </section>

      {result.sources?.length > 0 && (
        <section className="details-section">
          <h3>Sources</h3>
          <div className="source-list">
            {result.sources.map((source, index) => {
              const url = typeof source === 'string' ? source : source.url;
              return <a key={`${url}-${index}`} href={url?.startsWith('http') ? url : undefined} target="_blank" rel="noreferrer">{url || JSON.stringify(source)}</a>;
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function DetailBlock({ title, items }) {
  const list = Array.isArray(items) ? items : [items].filter(Boolean);
  return (
    <article className="detail-block">
      <h4>{title}</h4>
      {list.length ? <ul>{list.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>Generate a live canvas to populate this block.</p>}
    </article>
  );
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
