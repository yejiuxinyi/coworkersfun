import { createHmac, timingSafeEqual } from 'node:crypto';

const TTL_MS = 2 * 60 * 60 * 1000;

function secret() {
  return process.env.ADMIN_SECRET || 'dev-only-secret-change-me';
}

export function signSession() {
  const expiry = Date.now() + TTL_MS;
  const payload = String(expiry);
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${sig}`;
}

export function verifySession(token) {
  if (!token || !token.includes('.')) return false;
  const [b64, sig] = token.split('.');
  let payload;
  try { payload = Buffer.from(b64, 'base64').toString('utf8'); } catch { return false; }
  const expected = createHmac('sha256', secret()).update(payload).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  const expiry = Number(payload);
  return Number.isFinite(expiry) && expiry > Date.now();
}

export function parseCookie(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(s => s.trim().split('=').map(decodeURIComponent))
      .filter(p => p[0])
  );
}
