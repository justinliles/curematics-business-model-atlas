import { structuredResponse } from './shared/openaiClient.mjs';
import { generatedCanvasSchema } from './shared/schemas.mjs';
import { fail, ok, preflight, readJSON } from './shared/http.mjs';

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const body = await readJSON(req);
    const { business = {}, enrichment = {}, stage = 'Unknown' } = body;
    if (!business.name && !business.website) return fail('business object is required', 400);

    const data = await structuredResponse({
      schemaName: 'business_model_canvas_response',
      schema: generatedCanvasSchema,
      useSearch: false,
      system: `You are Curematics Business Model Atlas, a product strategy and business model innovation engine. Generate practical, founder-friendly Business Model Canvas outputs. Use the enrichment data provided. Avoid unsupported factual claims. Strategic inference is allowed when clearly practical and based on the business context. Return structured JSON only.`,
      user: `Generate a Curematics Business Model Atlas canvas.

Business:
${JSON.stringify(business, null, 2)}

Enrichment:
${JSON.stringify(enrichment, null, 2)}

Requested or estimated stage: ${stage}

Output requirements:
- Use all nine Business Model Canvas sections.
- Include Curematics strategy layers: growth levers, risks, KPI stack, tech/AI opportunities, SEO/content play, monetization upgrades, and recommendation.
- Add directional 0-100 opportunity scores.
- Create a LinkedIn-ready post.
- Include sources from enrichment sourceUrls when available.
`,
      maxOutputTokens: 7500
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
