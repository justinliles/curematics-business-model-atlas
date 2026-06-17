import { structuredResponse } from './shared/openaiClient.mjs';
import { graphicSpecSchema } from './shared/schemas.mjs';
import { fail, ok, preflight, readJSON } from './shared/http.mjs';

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const body = await readJSON(req);
    const { canvas = {}, theme = 'curematics-dark', format = 'linkedin-square' } = body;

    const data = await structuredResponse({
      schemaName: 'graphic_spec_response',
      schema: graphicSpecSchema,
      useSearch: false,
      fast: true,
      system: `You are a creative director for Curematics. Generate visual export specifications for a business model canvas. Do not create final graphic text as an image. Return structured JSON only.`,
      user: `Create a visual export specification.

Theme: ${theme}
Format: ${format}
Canvas:
${JSON.stringify(canvas, null, 2)}

The design should feel like a premium SaaS intelligence card: dark, modern, strategic, energetic, polished, and suitable for LinkedIn or a client report.`,
      maxOutputTokens: 3500
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
