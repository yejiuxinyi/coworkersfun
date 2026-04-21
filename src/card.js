import { state, updateCardCounts } from './state.js';

async function vote(cardId, kind) {
  const r = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, kind })
  });
  if (!r.ok) throw new Error(`vote ${r.status}`);
  return r.json();
}

export function renderCard(root, card, { onShare, onDrawAgain, onPokedex }) {
  const live = state.cards.find(c => c.id === card.id) || card;

  function paint() {
    const fresh = state.cards.find(c => c.id === card.id) || live;
    root.innerHTML = `
      <div class="card-page">
        <div class="card ${card.rarity.toLowerCase()}">
          <div class="rarity-badge">${card.rarity}</div>
          <div class="card-art">${card.emoji ?? '🃏'}</div>
          <h2 class="card-name">${card.name}</h2>
          <p class="card-role">${card.role === 'leader' ? '出战领导' : '出战同事'}</p>
          <blockquote class="card-quote">“${card.quote}”</blockquote>
          <p class="card-desc">${card.desc}</p>
          <div class="vote-stats">
            <span class="stat like">👍 ${fresh.likes_count ?? 0}</span>
            <span class="stat dread">🚫 ${fresh.dreads_count ?? 0}</span>
          </div>
        </div>
        <div class="actions">
          <button id="like-btn" class="vote-btn vote-like">这就是我的领导 👍</button>
          <button id="dread-btn" class="vote-btn vote-dread">我无法承受（重抽） 🚫</button>
          <button id="again-btn">再抽一张</button>
          <button id="share-btn">分享这张卡</button>
          <button id="pokedex-btn" class="ghost-inline">查看卡池进度</button>
        </div>
      </div>
    `;

    root.querySelector('#like-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        const updated = await vote(card.id, 'like');
        updateCardCounts(card.id, updated);
        paint();
      } catch (err) {
        alert('点赞失败：' + err.message);
        btn.disabled = false;
      }
    });

    root.querySelector('#dread-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        const updated = await vote(card.id, 'dread');
        updateCardCounts(card.id, updated);
        onDrawAgain();
      } catch (err) {
        alert('重抽失败：' + err.message);
        btn.disabled = false;
      }
    });

    root.querySelector('#again-btn').addEventListener('click', onDrawAgain);
    root.querySelector('#share-btn').addEventListener('click', () => onShare(card));
    root.querySelector('#pokedex-btn').addEventListener('click', onPokedex);
  }

  paint();
}
