import { getOpenAI } from './shared/openaiClient.mjs';
import { fail, ok, preflight, readJSON } from './shared/http.mjs';

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const body = await readJSON(req);
    const { vertical = 'business strategy', theme = 'curematics dark', style = 'modern abstract business intelligence graphic' } = body;
    const openai = getOpenAI();
    const image = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      prompt: `Create a text-free abstract background for Curematics Business Model Atlas. Vertical: ${vertical}. Theme: ${theme}. Style: ${style}. Dark SaaS intelligence aesthetic, subtle grid, premium strategy feel, no letters, no words, no logos.`,
      size: '1536x1024'
    });

    return ok({
      imageBase64: image.data?.[0]?.b64_json || '',
      mimeType: 'image/png'
    });
  } catch (error) {
    return fail(error);
  }
}
