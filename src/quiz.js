import { state } from './state.js';

export function renderQuiz(root, onDone) {
  let step = 0;
  const answers = [];

  function draw() {
    if (step >= state.questions.length) {
      onDone(answers);
      return;
    }
    const q = state.questions[step];
    root.innerHTML = `
      <div class="quiz">
        <div class="progress">第 ${step + 1} / ${state.questions.length} 题</div>
        <h2 class="question">${q.text}</h2>
        <div class="options">
          ${q.options.map((o, i) =>
            `<button class="opt" data-i="${i}">${o.label}</button>`
          ).join('')}
        </div>
      </div>
    `;
    root.querySelectorAll('.opt').forEach(btn => {
      btn.addEventListener('click', () => {
        answers.push(Number(btn.dataset.i));
        step += 1;
        draw();
      });
    });
  }
  draw();
}
