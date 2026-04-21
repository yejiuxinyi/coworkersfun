# coworkersfun

职场抽卡 H5 —— 答 5 道玄学问答，抽出你今日的"出战领导/同事"。v2 加了点赞后端和管理员后台。

## 一句话

```
玄学问答 → 48 张卡随机抽（R36 / SR8 / SSR4）→ 点赞 / 重抽 → 数据存 Supabase
```

## 功能

- 5 题玄学问答（星座 / 股票 / 表白 / 吃饭 / 心情）
- 48 张职场角色卡，稀有度 R/SR/SSR，圣诞老人为命定路径 SSR
- 👍 "这就是我的领导" / 🚫 "我无法承受（重抽）" 两个按钮，数据持久化
- `/#/admin` 管理员后台：按稀有度/点赞/重抽排序 + 编辑卡牌文案
- html2canvas 一键生成卡面图分享

## 技术栈

- Vite + 原生 JS（前端）
- Vercel Serverless Functions（API 层，`api/*.js`）
- Supabase Postgres（数据源）
- vitest（单测）

## 本地开发

```bash
npm install
cp .env.example .env.local   # 留空 SUPABASE_* 就会走内存 mock 模式
```

两种运行方式：

### 方式 A：纯前端 + mock API（最简，不碰 Supabase）

需要 Vercel CLI 起 `api/*`：

```bash
npm i -g vercel
vercel dev            # 默认 http://localhost:3000，会同时 host 前端 + api/
```

### 方式 B：Vite dev server + 独立 API

```bash
# terminal 1
vercel dev --listen 3000
# terminal 2
npm run dev           # 5173 端口，vite.config.js 已配 /api proxy 到 3000
```

## 单元测试

```bash
npm test
```

覆盖抽卡算法（11 specs）和管理员 session HMAC（4 specs）。

## 部署步骤

### 1) Supabase（一次性）

1. 在 https://supabase.com 建新项目，记 `Project URL` 和 `service_role` key
2. SQL Editor 跑 `db/schema.sql`（建 `cards` 表 + `increment_vote` 函数）
3. 本地 `node scripts/gen-seed.js` 生成 `db/seed.sql`（已提交，确认有 48 张）
4. SQL Editor 跑 `db/seed.sql`（upsert 48 张卡）

### 2) Vercel

1. New Project → Import `yejiuxinyi/coworkersfun`
2. Settings → Environment Variables 里加：
   - `SUPABASE_URL`：来自第 1 步
   - `SUPABASE_SERVICE_ROLE_KEY`：来自第 1 步
   - `ADMIN_PASSWORD`：`13579`（或你自己改）
   - `ADMIN_SECRET`：任意随机字符串（越长越好）
3. Deploy → 拿到 `https://coworkersfun.vercel.app`

### 3) 验证

- 打开首页 → 抽一张卡 → 点 👍 → 刷新首页再抽到同卡，计数应增加
- 打开 `/#/admin` → 输入 `ADMIN_PASSWORD` → 看到表格
- 改一张卡的 quote → 保存 → 再抽到该卡时看到新文案

## 架构

```
浏览器 ─── /api/cards         ┐
        ── /api/vote          ├─→ Vercel Serverless Functions ─── Supabase Postgres
        ── /api/admin/login   │
        ── /api/admin/card    ┘
```

- Supabase service role key 只存在 Vercel env，前端从不接触
- 管理员 session：`api/admin/login` 返回 HTTP-Only cookie，HMAC 签名，2 小时过期
- 无去重：任意用户可无限次点赞（Demo 级安全）

## 目录

```
api/           serverless functions
data/          静态 questions.json（不进 DB）
db/            Postgres schema + auto-gen seed
docs/          design specs 和 plans
public/        vite public 静态资源
scripts/       gen-seed.js
src/           前端 SPA
tests/         vitest
```

## 注意

- `.env.local` 在 `.gitignore` 里，不会被 commit
- 当 `SUPABASE_URL` 为空时，API 自动跑 in-memory mock 模式，所有 like/dread 数据存在进程里，重启清零（方便不开 Supabase 时本地 demo）
