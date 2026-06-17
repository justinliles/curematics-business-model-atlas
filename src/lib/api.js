export async function postJSON(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { error: text || 'Unknown response' };
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with ${response.status}`);
  }
  return data;
}

export const AtlasAPI = {
  findBusinesses: (payload) => postJSON('/api/find-businesses', payload),
  enrichBusiness: (payload) => postJSON('/api/enrich-business', payload),
  generateCanvas: (payload) => postJSON('/api/generate-canvas', payload),
  generateDailyVertical: (payload) => postJSON('/api/generate-daily-vertical', payload),
  generateGraphicSpec: (payload) => postJSON('/api/generate-graphic-spec', payload),
  generateBackground: (payload) => postJSON('/api/generate-ai-background', payload)
};
