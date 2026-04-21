0421

# coworkersfun v2 · 点赞后端 + 管理员后台 · 设计文档

**日期**：2026-04-21
**代号**：coworkersfun v2
**状态**：设计稿 v0.1

---

## 1. 目标

在 v1 MVP（纯静态抽卡 H5）之上，加三件事：

1. **抽卡后两个情绪按钮**
   - 👍 **这就是我的领导** — 点一次 `likes_count += 1`
   - 🚫 **我无法承受** — 点一次 `dreads_count += 1`，并触发**重抽**
   - 无去重：同一用户对同一张卡可以连点
2. **数据持久化到远端**：点赞/拒绝数据存进真实数据库，所有访客看到的是聚合累计值
3. **管理员后台 `/admin`**：账号密码登录（密码 `13579`）→ 看 48 张卡的累计 likes/dreads → 按稀有度/点赞数/重抽数排序 → 点任一张可编辑 `name` / `quote` / `desc` / `emoji`

## 2. 架构切换：静态 → 前后端分离

### v1（当前）
- 前端：Vite 打包的 SPA，可挂 GitHub Pages
- 数据：`public/data/cards.json` 打到前端包里，无状态

### v2
```
[浏览器]
   │
   │ GET  /api/cards          列出全部卡（带聚合计数）
   │ POST /api/vote           {cardId, kind: 'like'|'dread'} → 计数+1
   │ POST /api/admin/login    {password} → Set-Cookie session
   │ PATCH /api/admin/card    {id, name, quote, desc, emoji}   需 session
   ▼
[Vercel Serverless Functions (Node)]
   │  用 service_role key
   ▼
[Supabase Postgres]
   └── cards 表（数据源）
```

- **前端**：仍是 Vite，部署到 Vercel（静态资源 + `api/` 自动识别为 serverless）
- **后端**：Vercel Functions，每个 API 端点一个 `.js` 文件
- **数据库**：Supabase Postgres（免费 tier 够用），前端不直连，全部走 Vercel Function 中转

### 为什么走 Vercel Functions 而不是 Supabase 直连（RLS）？
- 管理员密码校验放 DB 层（PL/pgSQL）不直观
- Service role key 不能进前端包；Function 是唯一把它藏起来的地方
- 部署一键化：`git push` → Vercel 自动构建 + deploy

## 3. 数据模型

### `cards` 表
```sql
create table cards (
  id            text primary key,          -- R001, SR001, SSR001 ...
  rarity        text not null,             -- R | SR | SSR
  type          text not null,             -- roast | angel
  role          text not null,             -- leader | coworker
  name          text not null,
  quote         text not null,
  desc          text not null,
  emoji         text,
  destined_tags text[],                    -- null for most; set for SSR001
  destined_roll numeric,                   -- 0.05 for SSR001
  likes_count   integer not null default 0,
  dreads_count  integer not null default 0,
  updated_at    timestamptz not null default now()
);
```

### seed
初次部署后，用 `scripts/seed-cards.js` 把 `data/cards.json` 塞进 `cards` 表（id 冲突时 upsert）。

### 不建 `votes` 事件表的理由
用户明确说"无去重、任意次数"，只需要聚合总数。加事件表无意义只增加表体积。未来要 IP 防刷再加。

## 4. API 契约

### 4.1 `GET /api/cards`
**响应**：
```json
[
  { "id": "R001", "rarity": "R", "type": "roast", "role": "leader",
    "name": "考古学家", "quote": "...", "desc": "...", "emoji": "⛏️",
    "likes_count": 17, "dreads_count": 3 },
  ...
]
```
前端 `loadData()` 把这个结果塞给 `state.cards`，替代 v1 从 `public/data/cards.json` 读。

### 4.2 `POST /api/vote`
**请求**：`{ "cardId": "R001", "kind": "like" }` 或 `"kind": "dread"`
**响应**：`{ "likes_count": 18, "dreads_count": 3 }`
服务端用 `update cards set likes_count = likes_count + 1 where id = ?` 原子加。

### 4.3 `POST /api/admin/login`
**请求**：`{ "password": "13579" }`
**响应（200）**：`Set-Cookie: admin_session=<signed_token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200`
**响应（401）**：`{ "error": "wrong password" }`

Signed token 用环境变量 `ADMIN_SECRET` 做 HMAC。简化实现：token = `base64(expiry):hmac(expiry, secret)`，API 端解密校验 expiry + sig。

### 4.4 `PATCH /api/admin/card`
**Header**：Cookie `admin_session=...`
**请求**：`{ "id": "R001", "name": "...", "quote": "...", "desc": "...", "emoji": "..." }`
**响应**：更新后的卡对象
所有字段可选，只更新提供的。

## 5. 前端改动

### 5.1 `src/state.js`
- `loadData()` 改为 `fetch('/api/cards').then(r => r.json())`（开发期 Vite `proxy` 转给本地 Vercel dev / 或 Supabase dev）
- 不再依赖 `public/data/cards.json`，但**保留这份文件作为 seed 源**

### 5.2 `src/card.js` · 加两个按钮
```
┌──────────────────┐
│     [卡面]        │
│  名字 / 台词 / 描述 │
├──────────────────┤
│ 👍 17  🚫 3        │  ← 累计显示
├──────────────────┤
│ [这就是我的领导]   │
│ [我无法承受（重抽）]│
│ [再抽一张]         │
│ [查看卡池进度]     │
│ [分享这张卡]        │
└──────────────────┘
```
- 点 👍：`POST /api/vote` + 本地计数乐观加
- 点 🚫：`POST /api/vote` 带 kind=dread，成功后自动调用 `onDrawAgain` 重抽（快速回到 quiz 流程）
- 数字显示用从 `state.cards.find(c=>c.id===card.id)` 里拿到的 `likes_count` / `dreads_count`

### 5.3 新增 `src/admin.js` + `src/styles/admin.css`
- 路由：URL hash 为 `#/admin` 时进入
- 未登录 → 显示密码输入框
- 登录成功 → 卡牌表格视图：
  - 列：emoji | id | rarity | name | quote | likes | dreads | [编辑]
  - 顶部：排序下拉（rarity / likes desc / dreads desc）
  - [编辑]：弹出表单，改 name/quote/desc/emoji，保存调 `PATCH /api/admin/card`

## 6. 安全

- **Admin 密码 `13579`** 存在环境变量 `ADMIN_PASSWORD`（部署时设，不提交代码）
- **session 签名密钥 `ADMIN_SECRET`** 环境变量
- **Supabase service role key** 环境变量 `SUPABASE_SERVICE_ROLE_KEY`（仅 Function 可见）
- **Supabase URL** 环境变量 `SUPABASE_URL`
- `CORS`：API 允许同源（Vercel 同域）+ 本地 `http://localhost:5173`（dev）

**威胁模型**：娱乐项目、不存用户数据、密码已在聊天里泄漏 → 安全只求不被爬虫一键刷爆；未来可加 IP rate limit（当前不做）。

## 7. 部署步骤（README 会细化）

1. **Supabase**：
   - 建项目 → 执行 `db/schema.sql` → 执行 `db/seed.sql`（自动由 Action 从 `data/cards.json` 生成）
   - 拿到 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`
2. **Vercel**：
   - 连 `yejiuxinyi/coworkersfun` GitHub repo
   - 设环境变量：`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `ADMIN_PASSWORD=13579` / `ADMIN_SECRET=<随机>`
   - Deploy → 拿到 `https://coworkersfun.vercel.app`
3. **本地 dev**：
   - `cp .env.example .env.local` 填本地 Supabase 或测试值
   - `npm run dev`（前端）+ 另一个终端 `vercel dev`（API）

## 8. MVP 范围（v2）

做：
- [x] Supabase schema + seed 脚本
- [ ] 4 个 API endpoints（cards / vote / admin/login / admin/card）
- [ ] 前端：按钮 UI + 累计显示 + 重抽逻辑
- [ ] 前端：`/admin` 登录 + 列表 + 排序 + 编辑
- [ ] `.env.example` + README 部署步骤
- [ ] Vercel 识别需要的 `vercel.json`（如必要）

暂不做：
- 用户去重（按需求明确无限制）
- 防刷/速率限制
- 全局排行榜 UI
- 社交登录
- 点赞事件审计表

## 9. 成功标准

1. 本地 `vercel dev` 能跑通全链路：首页→抽卡→点 👍/🚫→计数更新
2. 点 🚫 后自动回到 quiz 页（重抽体验）
3. 访问 `/#/admin`，输密码 `13579` 后能看到 48 张卡的累计计数
4. 按 likes 降序排序正常
5. 编辑一张卡的 name/quote，刷新首页抽到该卡时看到新文案
6. 部署到 Vercel 后公网可访问，点赞能跨浏览器同步

## 10. 风险与对齐点

- **Vercel 冷启动**：Function 首次请求可能 1-3s 延迟；对娱乐 App 可接受
- **Supabase 免费额度**：500MB DB + 5GB 流量/月，48 张卡 + 低频点赞远远用不完
- **密码在代码里如果误写**：靠环境变量隔离；README 明确 `ADMIN_PASSWORD` 不要 commit
- **前端与 API 同域假设**：Vercel 自动同域，不需要 CORS 特殊配置
- **JSON 静态版本保留**：`data/cards.json` 仍用作 seed 源 + 离线测试 fixture

## 11. 下一步

- 本 spec 直接进 `writing-plans`
- 生成 `plans/0421-v2-likes-admin-backend.md`
