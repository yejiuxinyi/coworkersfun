import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

let cached = null;
let mockCards = null;

export function isMock() {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getSupabase() {
  if (cached) return cached;
  cached = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  return cached;
}

function loadMockCards() {
  if (mockCards) return mockCards;
  const here = dirname(fileURLToPath(import.meta.url));
  const json = readFileSync(resolve(here, '..', 'data', 'cards.json'), 'utf8');
  mockCards = JSON.parse(json).map(c => ({
    ...c, likes_count: 0, dreads_count: 0
  }));
  return mockCards;
}

export const mockDb = {
  listCards: () => loadMockCards().slice().sort((a,b) => a.id.localeCompare(b.id)),
  vote: (id, kind) => {
    const c = loadMockCards().find(x => x.id === id);
    if (!c) return null;
    if (kind === 'like') c.likes_count += 1;
    else if (kind === 'dread') c.dreads_count += 1;
    else return null;
    return { likes_count: c.likes_count, dreads_count: c.dreads_count };
  },
  updateCard: (id, fields) => {
    const c = loadMockCards().find(x => x.id === id);
    if (!c) return null;
    Object.assign(c, fields);
    return c;
  }
};
