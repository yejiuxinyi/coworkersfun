import { signSession } from '../_session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD || '13579';

  if (!password || password !== expected) {
    res.status(401).json({ error: 'wrong password' });
    return;
  }

  const token = signSession();
  res.setHeader(
    'Set-Cookie',
    `admin_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=7200`
  );
  res.json({ ok: true });
}
