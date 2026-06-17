import OpenAI from 'openai';

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing. Add it in Netlify environment variables.');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function modelName(fast = false) {
  return fast
    ? (process.env.OPENAI_FAST_MODEL || process.env.OPENAI_MODEL || 'gpt-5.5')
    : (process.env.OPENAI_MODEL || 'gpt-5.5');
}

export async function structuredResponse({ schemaName, schema, system, user, useSearch = false, fast = false, maxOutputTokens = 6000 }) {
  const openai = getOpenAI();
  const payload = {
    model: modelName(fast),
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        schema,
        strict: true
      }
    },
    max_output_tokens: maxOutputTokens
  };

  if (useSearch) {
    payload.tools = [{ type: 'web_search' }];
    payload.tool_choice = 'auto';
  }

  const response = await openai.responses.create(payload);
  const text = extractText(response);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`OpenAI returned invalid JSON for ${schemaName}: ${text.slice(0, 500)}`);
  }

  return parsed;
}

function extractText(response) {
  if (response.output_text) return response.output_text;
  const pieces = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) pieces.push(content.text);
      if (content.type === 'text' && content.text) pieces.push(content.text);
    }
  }
  return pieces.join('\n').trim();
}
