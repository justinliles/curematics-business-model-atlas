import { structuredResponse } from './shared/openaiClient.mjs';
import { dailyVerticalSchema } from './shared/schemas.mjs';
import { fail, ok, preflight, readJSON } from './shared/http.mjs';

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const body = await readJSON(req);
    const { vertical = '', location = '', includeRealWorldExamples = true } = body;
    if (!vertical) return fail('vertical is required', 400);

    const data = await structuredResponse({
      schemaName: 'daily_vertical_atlas_response',
      schema: dailyVerticalSchema,
      useSearch: includeRealWorldExamples,
      system: `You are Curematics Business Model Atlas. Create a daily vertical business model intelligence report across four maturity stages. Use web search only to ground the vertical and examples. Do not invent exact facts about specific companies. Return structured JSON only.`,
      user: `Generate today's Curematics Business Model Atlas for this vertical.

Vertical: ${vertical}
Location / market: ${location || 'United States'}
Include real-world example logic: ${includeRealWorldExamples}

Create exactly four stages:
1. Startup
2. 1-3 years
3. 4-6 years
4. 7+ years

For each stage, generate the full Business Model Canvas, strategy layer, scores, sources, and LinkedIn post. Also include a stageComparison array comparing goals, channels, monetization, operations, technology, and risks across the stages.`,
      maxOutputTokens: 12000
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
