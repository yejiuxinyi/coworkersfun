const SORTS = {
  id:     (a, b) => a.id.localeCompare(b.id),
  rarity: (a, b) => rarityOrder(a.rarity) - rarityOrder(b.rarity) || a.id.localeCompare(b.id),
  likes:  (a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0),
  dreads: (a, b) => (b.dreads_count ?? 0) - (a.dreads_count ?? 0)
};

function rarityOrder(r) {
  return { SSR: 0, SR: 1, R: 2 }[r] ?? 99;
}

async function fetchCards() {
  const r = await fetch('/api/cards');
  if (!r.ok) throw new Error(`/api/cards ${r.status}`);
  return r.json();
}

async function login(password) {
  const r = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    credentials: 'same-origin'
  });
  return r.ok;
}

async function saveCard(id, fields) {
  const r = await fetch('/api/admin/card', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...fields }),
    credentials: 'same-origin'
  });
  if (r.status === 403) throw new Error('session-expired');
  if (!r.ok) throw new Error(`save ${r.status}`);
  return r.json();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function renderAdmin(root, onExit) {
  const ctx = { cards: [], sort: 'id' };

  async function tryShowList() {
    try {
      ctx.cards = await fetchCards();
    } catch (err) {
      renderError(err.message);
      return;
    }
    renderList();
  }

  function renderError(msg) {
    root.innerHTML = `
      <div class="admin">
        <h2>管理员后台</h2>
        <p class="admin-error">加载失败：${escapeHtml(msg)}</p>
        <button id="retry-btn">重试</button>
        <button id="exit-btn" class="ghost">返回首页</button>
      </div>`;
    root.querySelector('#retry-btn').addEventListener('click', tryShowList);
    root.querySelector('#exit-btn').addEventListener('click', onExit);
  }

  function renderLogin(err) {
    root.innerHTML = `
      <div class="admin admin-login">
        <h2>管理员登录</h2>
        ${err ? `<p class="admin-error">${escapeHtml(err)}</p>` : ''}
        <input type="password" id="pwd" placeholder="密码" autofocus />
        <button id="go-btn" class="primary">进入</button>
        <button id="exit-btn" class="ghost">返回首页</button>
      </div>`;
    root.querySelector('#go-btn').addEventListener('click', doLogin);
    root.querySelector('#pwd').addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
    root.querySelector('#exit-btn').addEventListener('click', onExit);
  }

  async function doLogin() {
    const pwd = root.querySelector('#pwd').value;
    const ok = await login(pwd);
    if (ok) tryShowList();
    else renderLogin('密码错误');
  }

  function sorted() {
    return ctx.cards.slice().sort(SORTS[ctx.sort] ?? SORTS.id);
  }

  function renderList() {
    const rows = sorted().map(c => `
      <tr data-id="${c.id}">
        <td class="e">${escapeHtml(c.emoji ?? '🃏')}</td>
        <td>${c.id}</td>
        <td><span class="rarity r-${c.rarity.toLowerCase()}">${c.rarity}</span></td>
        <td>${escapeHtml(c.name)}</td>
        <td class="q">${escapeHtml(c.quote)}</td>
        <td class="n">${c.likes_count ?? 0}</td>
        <td class="n">${c.dreads_count ?? 0}</td>
        <td><button class="edit-btn" data-id="${c.id}">编辑</button></td>
      </tr>`).join('');

    root.innerHTML = `
      <div class="admin">
        <div class="admin-top">
          <h2>管理员后台 · ${ctx.cards.length} 张卡</h2>
          <div class="admin-controls">
            排序：
            <select id="sort-sel">
              <option value="id">按 ID</option>
              <option value="rarity">按稀有度</option>
              <option value="likes">按点赞降序</option>
              <option value="dreads">按重抽降序</option>
            </select>
            <button id="refresh-btn">刷新</button>
            <button id="exit-btn" class="ghost">返回首页</button>
          </div>
        </div>
        <table class="admin-table">
          <thead>
            <tr><th>图</th><th>ID</th><th>稀</th><th>名字</th><th>台词</th><th>👍</th><th>🚫</th><th></th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    root.querySelector('#sort-sel').value = ctx.sort;
    root.querySelector('#sort-sel').addEventListener('change', e => {
      ctx.sort = e.target.value;
      renderList();
    });
    root.querySelector('#refresh-btn').addEventListener('click', tryShowList);
    root.querySelector('#exit-btn').addEventListener('click', onExit);
    root.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEdit(btn.dataset.id));
    });
  }

  function openEdit(id) {
    const card = ctx.cards.find(c => c.id === id);
    if (!card) return;
    const modal = document.createElement('div');
    modal.className = 'admin-modal-backdrop';
    modal.innerHTML = `
      <div class="admin-modal">
        <h3>编辑 ${card.id}</h3>
        <label>Emoji <input id="f-emoji" value="${escapeHtml(card.emoji ?? '')}" /></label>
        <label>名字   <input id="f-name"  value="${escapeHtml(card.name)}" /></label>
        <label>台词   <input id="f-quote" value="${escapeHtml(card.quote)}" /></label>
        <label>描述   <input id="f-desc"  value="${escapeHtml(card.desc)}" /></label>
        <div class="modal-actions">
          <button id="save-btn" class="primary">保存</button>
          <button id="cancel-btn" class="ghost">取消</button>
        </div>
        <p id="modal-err" class="admin-error"></p>
      </div>`;
    root.appendChild(modal);
    const q = (s) => modal.querySelector(s);
    q('#cancel-btn').addEventListener('click', () => modal.remove());
    q('#save-btn').addEventListener('click', async () => {
      const fields = {
        emoji: q('#f-emoji').value,
        name:  q('#f-name').value,
        quote: q('#f-quote').value,
        desc:  q('#f-desc').value
      };
      try {
        const updated = await saveCard(id, fields);
        Object.assign(card, updated);
        modal.remove();
        renderList();
      } catch (err) {
        if (err.message === 'session-expired') {
          modal.remove();
          renderLogin('登录已过期，请重新登录');
          return;
        }
        q('#modal-err').textContent = '保存失败：' + err.message;
      }
    });
  }

  tryShowList().catch(() => renderLogin());
}
