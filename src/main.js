import { state, loadData, aggregateAnswers, persistCollected } from './state.js';
import { drawFive } from './draw.js';
import { renderQuiz } from './quiz.js';
import { renderCard } from './card.js';
import { renderPokedex } from './pokedex.js';
import { renderReveal, loadSavedReveal, clearSavedReveal } from './reveal.js';
import { renderAdmin } from './admin.js';

const app = document.getElementById('app');

let currentReveal = null;

function renderHome() {
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  app.innerHTML = `
    <div class="home">
      <div class="home-deco">🎲 🃏 🎯</div>
      <h1 class="title">今日出战<br/>什么老板 / 同事？</h1>
      <p class="sub">答 5 道玄学小问 · 开 5 连盲盒</p>
      <button id="start-btn" class="primary">开始抽卡</button>
      <button id="pokedex-btn" class="ghost">📦 卡包 ${state.collected.size} / ${state.cards.length}</button>
      ${currentReveal ? '<button id="resume-btn" class="ghost">↩ 回到上一组 5 连</button>' : ''}
    </div>
  `;
  document.querySelector('#start-btn').addEventListener('click', () => {
    clearSavedReveal();
    currentReveal = null;
    renderQuiz(app, onQuizDone);
  });
  document.querySelector('#pokedex-btn').addEventListener('click', () => {
    renderPokedex(app, renderHome);
  });
  const resume = document.querySelector('#resume-btn');
  if (resume) resume.addEventListener('click', () => enterReveal(currentReveal));
}

function enterReveal(ctx) {
  currentReveal = ctx;
  renderReveal(app, ctx, {
    onSingle: (card) => {
      renderCard(app, card, {
        onBack: () => enterReveal(ctx),
        onAgain: () => {
          clearSavedReveal();
          currentReveal = null;
          renderQuiz(app, onQuizDone);
        },
        onPokedex: () => renderPokedex(app, () => enterReveal(ctx))
      });
    },
    onAgain: () => {
      clearSavedReveal();
      currentReveal = null;
      renderQuiz(app, onQuizDone);
    },
    onPokedex: () => renderPokedex(app, () => enterReveal(ctx))
  });
}

function onQuizDone(answers) {
  const { luckScore, tags } = aggregateAnswers(answers, state.questions);
  const cards = drawFive({ cards: state.cards, tags, luckScore });
  cards.forEach(c => persistCollected(c.id));
  enterReveal({ cards, revealed: new Array(cards.length).fill(false) });
}

function route() {
  if (location.hash === '#/admin') {
    renderAdmin(app, () => {
      location.hash = '';
      renderHome();
    });
  } else {
    renderHome();
  }
}

window.addEventListener('hashchange', route);

(async function init() {
  app.innerHTML = '<div class="home"><p>加载中…</p></div>';
  try {
    await loadData();
  } catch (err) {
    app.innerHTML = `<div class="home"><h2>加载失败</h2><p class="err">${err.message}</p><p>请检查后端服务是否启动。</p></div>`;
    return;
  }
  const saved = loadSavedReveal();
  if (saved) currentReveal = saved;
  route();
})();
