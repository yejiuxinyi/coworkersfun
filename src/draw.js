const BASE_POOL = { R: 0.75, SR: 0.20, SSR: 0.05 };
const GOOD_POOL = { R: 0.60, SR: 0.30, SSR: 0.10 };
const BAD_POOL  = { R: 0.85, SR: 0.13, SSR: 0.02 };

export function computeRarityPool(luckScore) {
  if (luckScore >= 6) return { ...GOOD_POOL };
  if (luckScore <= -4) return { ...BAD_POOL };
  return { ...BASE_POOL };
}

export function isDestinedHit(card, tagSet, random = Math.random) {
  if (!card.destined_tags || card.destined_tags.length === 0) return false;
  const allTagsHit = card.destined_tags.every(t => tagSet.has(t));
  if (!allTagsHit) return false;
  return random() < (card.destined_roll ?? 0);
}

function pickRarity(pool, random) {
  const r = random();
  let acc = 0;
  for (const [rarity, p] of Object.entries(pool)) {
    acc += p;
    if (r < acc) return rarity;
  }
  return 'R';
}

function pickFromRarity(cards, rarity, random, excludeIds = new Set()) {
  const candidates = cards.filter(c => c.rarity === rarity && !excludeIds.has(c.id));
  if (candidates.length === 0) return null;
  const idx = Math.floor(random() * candidates.length);
  return candidates[idx];
}

export function drawCard({ cards, tags, luckScore, random = Math.random }) {
  const tagSet = tags instanceof Set ? tags : new Set(tags);
  const destinedCards = cards.filter(c => Array.isArray(c.destined_tags));

  for (const c of destinedCards) {
    if (isDestinedHit(c, tagSet, random)) return c;
  }

  const pool = computeRarityPool(luckScore);
  const rarity = pickRarity(pool, random);
  const excludeDestined = new Set(destinedCards.map(c => c.id));
  const picked = pickFromRarity(cards, rarity, random, excludeDestined);
  if (picked) return picked;

  return pickFromRarity(cards, 'R', random, excludeDestined);
}
