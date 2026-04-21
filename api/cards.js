import { getSupabase, isMock, mockDb } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  if (isMock()) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Data-Source', 'mock');
    res.json(mockDb.listCards());
    return;
  }

  const { data, error } = await getSupabase()
    .from('cards')
    .select('id,rarity,type,role,name,quote,desc,emoji,destined_tags,destined_roll,likes_count,dreads_count')
    .order('id');

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5');
  res.json(data);
}
