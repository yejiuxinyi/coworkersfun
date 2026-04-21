export function renderCard(root, card, { onShare, onDrawAgain, onPokedex }) {
  root.innerHTML = `
    <div class="card-page">
      <div class="card ${card.rarity.toLowerCase()}">
        <div class="rarity-badge">${card.rarity}</div>
        <div class="card-art">${card.emoji ?? '🃏'}</div>
        <h2 class="card-name">${card.name}</h2>
        <p class="card-role">${card.role === 'leader' ? '出战领导' : '出战同事'}</p>
        <blockquote class="card-quote">“${card.quote}”</blockquote>
        <p class="card-desc">${card.desc}</p>
      </div>
      <div class="actions">
        <button id="share-btn">分享这张卡</button>
        <button id="again-btn">再抽一张</button>
        <button id="pokedex-btn">查看卡池进度</button>
      </div>
    </div>
  `;
  root.querySelector('#share-btn').addEventListener('click', () => onShare(card));
  root.querySelector('#again-btn').addEventListener('click', onDrawAgain);
  root.querySelector('#pokedex-btn').addEventListener('click', onPokedex);
}
