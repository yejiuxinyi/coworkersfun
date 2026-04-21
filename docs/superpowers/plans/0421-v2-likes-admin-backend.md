0421

# coworkersfun v2 实施计划

**Goal：** 在 v1 静态抽卡基础上加两个情绪按钮（👍 / 🚫）+ 管理员后台，数据落到 Supabase，通过 Vercel Functions 中转。

**Spec：** `docs/superpowers/specs/0421-v2-likes-admin-backend.md`

**Tech delta：** 前端仍 Vite；新增 Vercel Serverless Functions（`api/*.js`）；Supabase Postgres 作为数据源。

---

## File Structure（v2 新增/改动）

```
coworkersfun/
├── api/                                ← 新增，Vercel 自动识别
│   ├── cards.js                        GET  列表
│   ├── vote.js                         POST 点赞/重抽
│   └── admin/
│       ├── login.js                    POST 密码换 cookie
│       └── card.js                     PATCH 编辑卡牌（需 cookie）
├── db/
│   ├── schema.sql                      ← 新增，建表
│   └── seed.sql                        ← 自动生成
├── scripts/
│   └── gen-seed.js                     ← 从 data/cards.json 生成 seed.sql
├── src/
│   ├── admin.js                        ← 新增，管理员路由
│   ├── state.js                        ← 改：API 取代静态 JSON
│   ├── card.js                         ← 改：加 👍 / 🚫 按钮
│   ├── main.js                         ← 改：支持 #/admin 路由
│   └── styles/
│       └── admin.css                   ← 新增
├── vercel.json                         ← 新增（rewrites）
├── vite.config.js                      ← 改：dev proxy 到 vercel dev
├── .env.example                        ← 新增
├── package.json                        ← 改：加 @supabase/supabase-js
└── README.md                           ← 新增：部署步骤
```

---

## Task 1: 数据库 schema + seed 脚本

**Files:** `db/schema.sql`, `scripts/gen-seed.js`, `db/seed.sql`

- [ ] `db/schema.sql`：建表 + 索引
- [ ] `scripts/gen-seed.js`：读 `data/cards.json`，输出 `db/seed.sql`（一堆 `insert on conflict do update`）
- [ ] 跑 `node scripts/gen-seed.js`，生成 `db/seed.sql`

**Commit：** `feat(db): schema and seed generator for cards table`

---

## Task 2: Supabase 客户端封装

**Files:** `api/_db.js`

创建 `api/_db.js`，封装一个 `getSupabase()` 函数返回 server-side client（用 service_role key）。前缀 `_` 让 Vercel 把它当内部模块不当 endpoint。

**Commit：** `feat(api): server-side supabase client helper`

---

## Task 3: API - GET /api/cards

**Files:** `api/cards.js`

```js
import { getSupabase } from './_db.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).end(); return; }
  const { data, error } = await getSupabase()
    .from('cards')
    .select('id,rarity,type,role,name,quote,desc,emoji,destined_tags,destined_roll,likes_count,dreads_count')
    .order('id');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=10');
  res.json(data);
}
```

**Commit：** `feat(api): GET /api/cards returns cards with counts`

---

## Task 4: API - POST /api/vote

**Files:** `api/vote.js`

用 Supabase RPC 或直接 `.update` + `.select`。简化用 RPC：在 schema 里定义 `fn_vote(card_id, kind)` 返回新计数。

方案：先用 update expression（`supabase.rpc('increment_vote', {...})`），避免先 select 后 update 的 race。

**Commit：** `feat(api): POST /api/vote atomically increments like/dread count`

---

## Task 5: API - Admin login + session

**Files:** `api/admin/login.js`, `api/_session.js`

`_session.js`：`signSession(expiry)` 返回 `base64(expiry).hex(hmac)`，`verifySession(token)` 校验 HMAC 和过期时间。

`login.js`：
- 比对 `req.body.password === process.env.ADMIN_PASSWORD`
- 对则 Set-Cookie `admin_session=<sig>; HttpOnly; SameSite=Strict; Max-Age=7200; Path=/`
- 错则 401

**Commit：** `feat(api): admin password login with HMAC-signed cookie session`

---

## Task 6: API - PATCH /api/admin/card

**Files:** `api/admin/card.js`

- 读 cookie `admin_session`，`verifySession` 失败则 403
- Body：`{ id, name?, quote?, desc?, emoji? }`
- update cards 只改提供的字段 + `updated_at = now()`
- 返回更新后的卡

**Commit：** `feat(api): PATCH /api/admin/card updates fields with session check`

---

## Task 7: 前端 state 改从 API 取

**Files:** `src/state.js`, `vite.config.js`

- `loadData()` 改为：
  ```js
  const [q, c] = await Promise.all([
    fetch('/data/questions.json').then(r => r.json()),
    fetch('/api/cards').then(r => r.json())
  ]);
  ```
  questions 仍是静态（不会被点赞）；cards 走 API
- `vite.config.js` dev 时代理 `/api` → `http://localhost:3000`（Vercel dev 默认端口）

**Commit：** `feat(state): load cards from /api/cards; keep questions static`

---

## Task 8: 卡牌页两个按钮 + 计数显示 + 重抽

**Files:** `src/card.js`, `src/styles/card.css`

- 卡面下方显示 👍 N / 🚫 M（从 `state.cards.find(c=>c.id===card.id).likes_count` 拿）
- 新增两个按钮：
  - **这就是我的领导**（绿色） → POST /api/vote kind=like → 乐观 +1 + 重渲染
  - **我无法承受（重抽）**（红色） → POST /api/vote kind=dread → 成功后调用 `onDrawAgain`
- 保留原 `[再抽一张] [查看卡池] [分享]` 三按钮

**Commit：** `feat(card): add like and dread buttons with live counts and auto-redraw`

---

## Task 9: Admin 路由 + 登录页

**Files:** `src/admin.js`, `src/styles/admin.css`, `src/main.js`

- `main.js` 启动时检测 `location.hash`，若是 `#/admin` → `renderAdmin(app)`
- `admin.js`：
  - `loadLoginForm(root)`：单一 password input + 登录按钮 → POST `/api/admin/login`
  - 登录成功 → `renderAdminList(root)`：表格 + 排序下拉 + 每行 [编辑] 按钮
  - 点编辑 → 弹 modal，保存 → PATCH /api/admin/card → 重新 fetch /api/cards
- 判断"已登录"：调 `/api/cards` 正常拿到数据后，再尝试 `/api/admin/card` 的 OPTIONS/HEAD？简单起见用"尝试进去，403 就弹登录框"

**Commit：** `feat(admin): password-gated admin page with sortable card list and edit modal`

---

## Task 10: 部署配置

**Files:** `.env.example`, `vercel.json`, `README.md`, `package.json`

- `.env.example`：列出 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `ADMIN_PASSWORD` / `ADMIN_SECRET`
- `vercel.json`：简单的 rewrites（SPA fallback 到 index.html，除 /api/ 外）
- `README.md`：Supabase 建表步骤 + Vercel 连 repo 步骤 + 本地 dev 指令
- `package.json`：加 `@supabase/supabase-js`

**Commit：** `chore: vercel config + env example + README deployment guide`

---

## Task 11: 本地 smoke

- `npm install`
- `vercel dev`（如果装了 Vercel CLI；否则用本地 express 代 api 跑测试）
- 浏览器跑首页 → 点 👍 / 🚫 → 计数变化
- `/#/admin` → 输入 13579 → 表格显示

**本地测试注意**：如果用户还没建 Supabase，API 会连不上；此时可用 `api/_db.js` 的 `USE_MOCK_DB=1` 分支回 hardcoded 假数据给前端走完流程。

**Commit（若有 mock）：** `chore: add mock-db mode for local dev without Supabase`

---

## Task 12: 二次推送

`git push` 到 GitHub。README 告诉用户接下来手动做的三步（Supabase 建项目、跑 SQL、Vercel 连 repo 填环境变量）。

---

## 执行注记

- Task 1-6（后端） / Task 7-9（前端） / Task 10-12（部署）是三条基本独立的线；按顺序做最保险，一次性做完后推送
- 若 Supabase / Vercel 登录需要用户交互 → 停下来提示用户手动操作
