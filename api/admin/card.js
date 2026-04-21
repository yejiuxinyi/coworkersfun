import { getSupabase, isMock, mockDb } from '../_db.js';
import { verifySession, parseCookie } from '../_session.js';

const EDITABLE = ['name', 'quote', 'desc', 'emoji'];

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') { res.status(405).end(); return; }

  const cookies = parseCookie(req.headers.cookie);
  if (!verifySession(cookies.admin_session)) {
    res.status(403).json({ error: 'not authenticated' });
    return;
  }

  const body = req.body || {};
  const { id } = body;
  if (!id) { res.status(400).json({ error: 'id required' }); return; }

  const fields = {};
  for (const k of EDITABLE) {
    if (k in body && typeof body[k] === 'string') fields[k] = body[k];
  }
  if (Object.keys(fields).length === 0) {
    res.status(400).json({ error: 'no editable fields supplied' });
    return;
  }

  if (isMock()) {
    const updated = mockDb.updateCard(id, fields);
    if (!updated) { res.status(404).json({ error: 'card not found' }); return; }
    res.json(updated);
    return;
  }

  const { data, error } = await getSupabase()
    .from('cards')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  if (!data)  { res.status(404).json({ error: 'card not found' }); return; }
  res.json(data);
}
