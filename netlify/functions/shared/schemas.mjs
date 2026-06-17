const stageEnum = ['Startup', '1-3 years', '4-6 years', '7+ years', 'Unknown'];

const stringArray = { type: 'array', items: { type: 'string' } };
const sourceArray = { type: 'array', items: { type: 'string' } };

export const businessFinderSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['query', 'candidates'],
  properties: {
    query: {
      type: 'object',
      additionalProperties: false,
      required: ['vertical', 'location', 'stage', 'businessType'],
      properties: {
        vertical: { type: 'string' },
        location: { type: 'string' },
        stage: { type: 'string' },
        businessType: { type: 'string' }
      }
    },
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'website', 'location', 'vertical', 'estimatedStage', 'confidence', 'reasonSelected', 'sourceUrls'],
        properties: {
          name: { type: 'string' },
          website: { type: 'string' },
          location: { type: 'string' },
          vertical: { type: 'string' },
          estimatedStage: { type: 'string', enum: stageEnum },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reasonSelected: { type: 'string' },
          sourceUrls: sourceArray
        }
      }
    }
  }
};

export const enrichmentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['business', 'enrichment'],
  properties: {
    business: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'website', 'location', 'vertical', 'businessType', 'estimatedStage', 'stageConfidence'],
      properties: {
        name: { type: 'string' },
        website: { type: 'string' },
        location: { type: 'string' },
        vertical: { type: 'string' },
        businessType: { type: 'string' },
        estimatedStage: { type: 'string', enum: stageEnum },
        stageConfidence: { type: 'number', minimum: 0, maximum: 1 }
      }
    },
    enrichment: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'services', 'targetCustomers', 'positioning', 'visibleChannels', 'likelyRevenueStreams', 'maturitySignals', 'riskSignals', 'seoOpportunities', 'technologyOpportunities', 'sourceUrls'],
      properties: {
        summary: { type: 'string' },
        services: stringArray,
        targetCustomers: stringArray,
        positioning: { type: 'string' },
        visibleChannels: stringArray,
        likelyRevenueStreams: stringArray,
        maturitySignals: stringArray,
        riskSignals: stringArray,
        seoOpportunities: stringArray,
        technologyOpportunities: stringArray,
        sourceUrls: sourceArray
      }
    }
  }
};

const canvasSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['customerSegments', 'valueProposition', 'channels', 'customerRelationships', 'revenueStreams', 'keyActivities', 'keyResources', 'keyPartners', 'costStructure'],
  properties: {
    customerSegments: stringArray,
    valueProposition: stringArray,
    channels: stringArray,
    customerRelationships: stringArray,
    revenueStreams: stringArray,
    keyActivities: stringArray,
    keyResources: stringArray,
    keyPartners: stringArray,
    costStructure: stringArray
  }
};

const strategySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['growthLevers', 'riskPoints', 'kpis', 'technologyOpportunities', 'seoContentPlay', 'monetizationUpgrades', 'curematicsRecommendation'],
  properties: {
    growthLevers: stringArray,
    riskPoints: stringArray,
    kpis: stringArray,
    technologyOpportunities: stringArray,
    seoContentPlay: stringArray,
    monetizationUpgrades: stringArray,
    curematicsRecommendation: { type: 'string' }
  }
};

const scoresSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['businessModelScore', 'digitalOpportunityScore', 'monetizationOpportunityScore', 'automationOpportunityScore'],
  properties: {
    businessModelScore: { type: 'number', minimum: 0, maximum: 100 },
    digitalOpportunityScore: { type: 'number', minimum: 0, maximum: 100 },
    monetizationOpportunityScore: { type: 'number', minimum: 0, maximum: 100 },
    automationOpportunityScore: { type: 'number', minimum: 0, maximum: 100 }
  }
};

export const generatedCanvasSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['canvasId', 'business', 'canvas', 'strategy', 'scores', 'sources', 'linkedinPost'],
  properties: {
    canvasId: { type: 'string' },
    business: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'website', 'vertical', 'location', 'stage'],
      properties: {
        name: { type: 'string' },
        website: { type: 'string' },
        vertical: { type: 'string' },
        location: { type: 'string' },
        stage: { type: 'string' }
      }
    },
    canvas: canvasSchema,
    strategy: strategySchema,
    scores: scoresSchema,
    sources: sourceArray,
    linkedinPost: { type: 'string' }
  }
};

export const dailyVerticalSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['vertical', 'location', 'stages', 'stageComparison', 'sources'],
  properties: {
    vertical: { type: 'string' },
    location: { type: 'string' },
    stages: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['stage', 'canvas', 'strategy', 'scores', 'linkedinPost', 'sources'],
        properties: {
          stage: { type: 'string', enum: ['Startup', '1-3 years', '4-6 years', '7+ years'] },
          canvas: canvasSchema,
          strategy: strategySchema,
          scores: scoresSchema,
          linkedinPost: { type: 'string' },
          sources: sourceArray
        }
      }
    },
    stageComparison: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'startup', 'oneToThree', 'fourToSix', 'sevenPlus'],
        properties: {
          area: { type: 'string' },
          startup: { type: 'string' },
          oneToThree: { type: 'string' },
          fourToSix: { type: 'string' },
          sevenPlus: { type: 'string' }
        }
      }
    },
    sources: sourceArray
  }
};

export const graphicSpecSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['format', 'theme', 'headline', 'subheadline', 'layout', 'visualDirection', 'highlightBlocks', 'exportCopy', 'colorMood', 'iconSuggestions'],
  properties: {
    format: { type: 'string' },
    theme: { type: 'string' },
    headline: { type: 'string' },
    subheadline: { type: 'string' },
    layout: { type: 'string' },
    visualDirection: { type: 'string' },
    highlightBlocks: stringArray,
    exportCopy: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'subtitle', 'footer'],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        footer: { type: 'string' }
      }
    },
    colorMood: stringArray,
    iconSuggestions: stringArray
  }
};
