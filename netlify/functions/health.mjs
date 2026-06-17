import { ok, preflight } from './shared/http.mjs';

export default async function handler(req) {
  const pre = preflight(req);
  if (pre) return pre;
  return ok({ ok: true, app: 'Curematics Business Model Atlas' });
}
