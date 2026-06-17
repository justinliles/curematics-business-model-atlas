import { structuredResponse } from './shared/openaiClient.mjs';
import { businessFinderSchema } from './shared/schemas.mjs';
import { fail, ok, preflight, readJSON } from './shared/http.mjs';

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const body = await readJSON(req);
    const { vertical = '', location = '', stage = 'Unknown', businessType = 'business', limit = 5 } = body;
    if (!vertical) return fail('vertical is required', 400);

    const data = await structuredResponse({
      schemaName: 'business_finder_response',
      schema: businessFinderSchema,
      useSearch: true,
      system: `You are Curematics Business Model Atlas, a business discovery and strategy research assistant. Find real businesses using web search. Do not invent businesses. Prefer official websites and reputable public sources. Return structured JSON only. If evidence is weak, lower confidence or exclude the business.`,
      user: `Find up to ${limit} real-world businesses for this request.

Vertical: ${vertical}
Location: ${location || 'Any relevant market'}
Desired maturity stage: ${stage}
Business type: ${businessType}

For each candidate, return name, website, location, vertical, estimatedStage, confidence, reasonSelected, and sourceUrls. Only include candidates with public evidence and enough information to support a business model canvas.`,
      maxOutputTokens: 6500
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
