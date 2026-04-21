import { state } from './state.js';

export function renderPokedex(root, onBack) {
  const collected = state.collected;
  const total = state.cards.length;
  root.innerHTML = `
    <div class="pokedex">
      <button id="back-btn">← 返回</button>
      <h2>卡池图鉴</h2>
      <p class="progress-text">收集进度：${collected.size} / ${total}</p>
      <div class="grid">
        ${state.cards.map(c => {
          const owned = collected.has(c.id);
          return `
            <div class="cell ${c.rarity.toLowerCase()} ${owned ? 'owned' : 'locked'}">
              <div class="cell-art">${owned ? (c.emoji ?? '🃏') : '❓'}</div>
              <div class="cell-name">${owned ? c.name : '???'}</div>
              <div class="cell-rarity">${c.rarity}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  root.querySelector('#back-btn').addEventListener('click', onBack);
}
