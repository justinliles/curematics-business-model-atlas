import { structuredResponse } from './shared/openaiClient.mjs';
import { enrichmentSchema } from './shared/schemas.mjs';
import { fail, ok, preflight, readJSON } from './shared/http.mjs';

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const body = await readJSON(req);
    const { name = '', website = '', location = '', vertical = '', businessType = '' } = body;
    if (!name && !website) return fail('business name or website is required', 400);

    const data = await structuredResponse({
      schemaName: 'business_enrichment_response',
      schema: enrichmentSchema,
      useSearch: true,
      system: `You are Curematics Business Model Atlas. Analyze public business information for business model strategy. Separate evidence from reasonable strategic inference. Do not invent facts. Use unknown when public evidence is not available. Return structured JSON only.`,
      user: `Analyze and enrich this business using public web information.

Business name: ${name}
Website: ${website || 'unknown'}
Location: ${location || 'unknown'}
Vertical: ${vertical || 'unknown'}
Business type: ${businessType || 'unknown'}

Return public positioning, services, target customers, visible channels, likely revenue streams, maturity signals, risk signals, SEO opportunities, technology opportunities, and source URLs. Classify the maturity stage only as Startup, 1-3 years, 4-6 years, 7+ years, or Unknown.`,
      maxOutputTokens: 6500
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
