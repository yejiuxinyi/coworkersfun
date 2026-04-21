const STORAGE_KEY = 'coworkersfun:v1';

export const state = {
  route: 'home',
  questions: [],
  cards: [],
  answers: [],
  currentCard: null,
  get collected() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    try { return new Set(JSON.parse(raw).collected ?? []); }
    catch { return new Set(); }
  }
};

export function persistCollected(cardId) {
  const current = state.collected;
  current.add(cardId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ collected: [...current] }));
}

export async function loadData() {
  const [q, c] = await Promise.all([
    fetch('./data/questions.json').then(r => r.json()),
    fetch('./data/cards.json').then(r => r.json())
  ]);
  state.questions = q;
  state.cards = c;
}

export function aggregateAnswers(answers, questions) {
  let luckScore = 0;
  const tags = new Set();
  answers.forEach((optIdx, qIdx) => {
    const opt = questions[qIdx].options[optIdx];
    luckScore += opt.luck ?? 0;
    (opt.tags ?? []).forEach(t => tags.add(t));
  });
  return { luckScore, tags };
}
