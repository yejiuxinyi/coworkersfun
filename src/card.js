import { state, updateCardCounts } from './state.js';
import { sharePoster } from './share.js';

async function vote(cardId, kind) {
  const r = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, kind })
  });
  if (!r.ok) throw new Error(`vote ${r.status}`);
  return r.json();
}

export function renderCard(root, card, { onBack, onAgain, onPokedex }) {
  function paint() {
    const fresh = state.cards.find(c => c.id === card.id) || card;
    const r = card.rarity.toLowerCase();

    root.innerHTML = `
      <div class="card-detail">
        <div class="card-detail-top">
          <button id="share-btn" class="icon-btn share" title="分享">📤</button>
          <button id="back-btn" class="icon-btn close" title="返回">✕</button>
        </div>

        <div class="card r-${r}">
          <div class="rarity-badge">${card.rarity}</div>
          <div class="card-art">${card.emoji ?? '🃏'}</div>
          <h2 class="card-name">${card.name}</h2>
          <p class="card-role">${card.role === 'leader' ? '出战领导' : '出战同事'}</p>
          <blockquote class="card-quote">"${card.quote}"</blockquote>
          <p class="card-desc">${card.desc}</p>
        </div>

        <div class="card-stats">
          <button class="stat like" id="like-btn" title="这就是我的领导">
            <span class="emoji">👍</span><span class="num">${fresh.likes_count ?? 0}</span>
          </button>
          <button class="stat dread" id="dread-btn" title="我无法承受">
            <span class="emoji">😭</span><span class="num">${fresh.dreads_count ?? 0}</span>
          </button>
          <button class="stat refresh" id="again-btn" title="再抽一轮">
            <span class="emoji">🔄</span>
          </button>
        </div>

        <button class="pokedex-link" id="pokedex-btn">📦 查看卡包 →</button>
      </div>
    `;

    root.querySelector('#share-btn').addEventListener('click', () => sharePoster(card));
    root.querySelector('#back-btn').addEventListener('click', onBack);
    root.querySelector('#pokedex-btn').addEventListener('click', onPokedex);
    root.querySelector('#again-btn').addEventListener('click', onAgain);

    root.querySelector('#like-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.classList.add('pulse');
      try {
        const updated = await vote(card.id, 'like');
        updateCardCounts(card.id, updated);
        paint();
      } catch (err) {
        alert('点赞失败：' + err.message);
        btn.disabled = false;
        btn.classList.remove('pulse');
      }
    });

    root.querySelector('#dread-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.classList.add('pulse');
      try {
        const updated = await vote(card.id, 'dread');
        updateCardCounts(card.id, updated);
        paint();
      } catch (err) {
        alert('操作失败：' + err.message);
        btn.disabled = false;
        btn.classList.remove('pulse');
      }
    });
  }

  paint();
}
