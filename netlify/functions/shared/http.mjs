export const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

export function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

export function fail(error, status = 500) {
  return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status, headers });
}

export async function readJSON(req) {
  if (req.method === 'OPTIONS') return null;
  if (req.method !== 'POST') throw new Error('Method not allowed. Use POST.');
  const raw = await req.text();
  return raw ? JSON.parse(raw) : {};
}

export function preflight(req) {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers });
  return null;
}
