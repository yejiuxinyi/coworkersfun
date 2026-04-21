import { state, loadData, aggregateAnswers, persistCollected } from './state.js';
import { drawCard } from './draw.js';
import { renderQuiz } from './quiz.js';
import { renderCard } from './card.js';
import { renderPokedex } from './pokedex.js';
import { sharePoster } from './share.js';

const app = document.getElementById('app');

function renderHome() {
  app.innerHTML = `
    <div class="home">
      <h1 class="title">今天你会遇到<br/>什么老板/同事？</h1>
      <p class="sub">5道玄学小问题，抽出你今日命定的那一位</p>
      <button id="start-btn" class="primary">开始抽卡</button>
      <button id="pokedex-btn" class="ghost">查看卡池 (${state.collected.size}/${state.cards.length})</button>
    </div>
  `;
  document.querySelector('#start-btn').addEventListener('click', () => {
    renderQuiz(app, onQuizDone);
  });
  document.querySelector('#pokedex-btn').addEventListener('click', () => {
    renderPokedex(app, renderHome);
  });
}

function onQuizDone(answers) {
  const { luckScore, tags } = aggregateAnswers(answers, state.questions);
  const card = drawCard({ cards: state.cards, tags, luckScore });
  state.currentCard = card;
  persistCollected(card.id);
  renderCard(app, card, {
    onShare: sharePoster,
    onDrawAgain: () => renderQuiz(app, onQuizDone),
    onPokedex: () => renderPokedex(app, renderHome)
  });
}

(async function init() {
  app.innerHTML = '<p>加载中…</p>';
  await loadData();
  renderHome();
})();
