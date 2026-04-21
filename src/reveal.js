import { state } from './state.js';

function dogeBackSVG() {
  return `
    <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="6" width="148" height="208" rx="16" fill="#fcf1d0" stroke="#1a1a1a" stroke-width="4"/>
      <g transform="translate(80,108)">
        <ellipse cx="0" cy="0" rx="48" ry="42" fill="#f1c40f" stroke="#1a1a1a" stroke-width="4"/>
        <polygon points="-48,-20 -64,-62 -28,-44" fill="#f1c40f" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
        <polygon points="48,-20 64,-62 28,-44" fill="#f1c40f" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="-16" cy="-4" r="5" fill="#1a1a1a"/>
        <circle cx="16" cy="-4" r="5" fill="#1a1a1a"/>
        <ellipse cx="0" cy="14" rx="10" ry="7" fill="#1a1a1a"/>
        <path d="M -14 22 Q 0 34 14 22" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <circle cx="28" cy="28" r="6" fill="#e74c3c" stroke="#1a1a1a" stroke-width="3"/>
      <rect x="118" y="184" width="16" height="16" fill="#3498db" stroke="#1a1a1a" stroke-width="3"/>
      <text x="80" y="196" text-anchor="middle" font-size="11" font-weight="700" fill="#1a1a1a" font-family="sans-serif" letter-spacing="2">COWORKERS</text>
    </svg>
  `;
}

function hasLS() {
  try { return typeof localStorage !== 'undefined'; } catch { return false; }
}
const STORAGE = 'coworkersfun:reveal';

function saveReveal(cards, revealed) {
  if (!hasLS()) return;
  try {
    localStorage.setItem(STORAGE, JSON.stringify({
      ids: cards.map(c => c.id),
      revealed
    }));
  } catch {}
}

export function loadSavedReveal() {
  if (!hasLS()) return null;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return null;
    const { ids, revealed } = JSON.parse(raw);
    if (!Array.isArray(ids) || ids.length !== 5) return null;
    const cards = ids.map(id => state.cards.find(c => c.id === id)).filter(Boolean);
    if (cards.length !== 5) return null;
    return { cards, revealed: Array.isArray(revealed) ? revealed : new Array(5).fill(false) };
  } catch {
    return null;
  }
}

export function clearSavedReveal() {
  if (hasLS()) localStorage.removeItem(STORAGE);
}

export function renderReveal(root, ctx, { onSingle, onAgain, onPokedex }) {
  function paint() {
    const openedCount = ctx.revealed.filter(Boolean).length;
    const total = ctx.cards.length;
    const allOpen = openedCount === total;

    const cardHtml = ctx.cards.map((c, i) => {
      const open = ctx.revealed[i];
      const r = c.rarity.toLowerCase();
      return `
        <div class="rc ${open ? 'flipped' : ''} ${open ? 'r-' + r : ''}" data-i="${i}">
          <div class="rc-inner">
            <div class="rc-back">${dogeBackSVG()}</div>
            <div class="rc-face r-${r}">
              <div class="rc-rarity">${c.rarity}</div>
              <div class="rc-emoji">${c.emoji ?? '🃏'}</div>
              <div class="rc-name">${c.name}</div>
              <div class="rc-role">${c.role === 'leader' ? '出战领导' : '出战同事'}</div>
              <blockquote class="rc-quote">"${c.quote}"</blockquote>
              <div class="rc-tap">点击查看详情 →</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <div class="reveal-page">
        <div class="reveal-header">
          <h2>今日 5 连</h2>
          <p class="reveal-progress"><span>${openedCount}</span> / ${total} 已开</p>
          ${allOpen ? '<p class="reveal-hint">点任意卡片 查看详情 / 点赞</p>' : '<p class="reveal-hint">挨个点开 盲盒开箱</p>'}
        </div>
        <div class="reveal-deck">${cardHtml}</div>
        <div class="reveal-foot">
          <button class="big-btn again" id="again-btn">🔄 再来一轮</button>
          <button class="big-btn ghost" id="pokedex-btn">📦 卡包</button>
        </div>
      </div>
    `;

    root.querySelectorAll('.rc').forEach(node => {
      node.addEventListener('click', () => {
        const i = Number(node.dataset.i);
        if (ctx.revealed[i]) {
          onSingle(ctx.cards[i]);
        } else {
          ctx.revealed[i] = true;
          saveReveal(ctx.cards, ctx.revealed);
          paint();
          const r = ctx.cards[i].rarity;
          if (r === 'SSR') fireConfetti(node);
        }
      });
    });
    root.querySelector('#again-btn').addEventListener('click', onAgain);
    root.querySelector('#pokedex-btn').addEventListener('click', onPokedex);
  }

  saveReveal(ctx.cards, ctx.revealed);
  paint();
}

function fireConfetti(node) {
  const overlay = document.createElement('div');
  overlay.className = 'ssr-confetti';
  const colors = ['#f1c40f', '#ffd76a', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6'];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-p';
    const angle = (Math.random() * 360).toFixed(0);
    const dist = 80 + Math.random() * 100;
    p.style.setProperty('--angle', angle + 'deg');
    p.style.setProperty('--dist', dist + 'px');
    p.style.background = colors[i % colors.length];
    overlay.appendChild(p);
  }
  node.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1600);
}
