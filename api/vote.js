import { getSupabase, isMock, mockDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { cardId, kind } = req.body || {};
  if (!cardId || (kind !== 'like' && kind !== 'dread')) {
    res.status(400).json({ error: 'cardId and kind (like|dread) required' });
    return;
  }

  if (isMock()) {
    const updated = mockDb.vote(cardId, kind);
    if (!updated) { res.status(404).json({ error: 'card not found' }); return; }
    res.json(updated);
    return;
  }

  const { data, error } = await getSupabase()
    .rpc('increment_vote', { card_id: cardId, kind });

  if (error) { res.status(500).json({ error: error.message }); return; }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) { res.status(404).json({ error: 'card not found' }); return; }
  res.json(row);
}
