0421

# coworkersfun · 会话交接档（2026-04-21）

## 一句话状态

代码全部完成，master 分支 10 个 commit 已推 GitHub。**阻塞在用户手动部署环节**：Supabase 要跑 2 个 SQL，Vercel 要连 repo + 填 4 个环境变量。

## 仓库

- 位置：`E:\cursor\ProjectsForPrac\coworkersfun`（独立 git repo，不属于外层 E:\cursor\）
- GitHub：https://github.com/yejiuxinyi/coworkersfun（public）
- 分支：master
- git 身份：每次 commit 用 `git -c user.email=xief5345@gmail.com -c user.name=yejiuxinyi`（不要写入 local/global config）

## 已交付

| 功能 | 文件 | 状态 |
|---|---|---|
| v1 抽卡算法（TDD） | `src/draw.js`, `tests/draw.test.js` | 11/11 specs 绿 |
| v1 前端全链路 | `src/{main,state,quiz,card,pokedex,share}.js`, `src/styles/` | build 成功 |
| v1 卡池数据 | `data/questions.json`, `data/cards.json`（48 张 R36/SR8/SSR4） | — |
| v2 DB | `db/schema.sql`（含 `increment_vote` RPC）, `db/seed.sql`（自动生成） | 未跑 |
| v2 API | `api/cards.js`, `api/vote.js`, `api/admin/login.js`, `api/admin/card.js` | 代码就绪 |
| v2 Helper | `api/_db.js`（Supabase + mock）, `api/_session.js`（HMAC cookie） | 4 specs 绿 |
| v2 前端 | `src/admin.js`, `src/card.js` 改 + 样式 | build 成功 |
| 部署配置 | `vercel.json`, `.env.example`, `README.md` | 就绪 |

测试：`npm test` → 15/15 通过（11 draw + 4 session）
构建：`npm run build` → 成功（~400ms）

## 用户手动待办

### 1. Supabase（用户在 Supabase 新建了项目但找不到 SQL Editor）

- 左侧导航 `</>`  "SQL Editor" 图标，或 `https://supabase.com/dashboard/project/<project-ref>/sql/new`
- 粘 `db/schema.sql` → Run → 建表 + RPC
- 新建查询粘 `db/seed.sql` → Run → 插入 48 张卡
- 到 Settings → API，记下：
  - `Project URL`（后面填 `SUPABASE_URL`）
  - `service_role` secret（后面填 `SUPABASE_SERVICE_ROLE_KEY`，**不是 anon key**）

### 2. Vercel

- https://vercel.com/new → Import `yejiuxinyi/coworkersfun`
- Environment Variables 加 4 个：
  - `SUPABASE_URL` = Supabase Project URL
  - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role key
  - `ADMIN_PASSWORD` = `13579`
  - `ADMIN_SECRET` = 任意随机长字符串（HMAC 签名用）
- Deploy → 得到 `https://coworkersfun*.vercel.app`

### 3. 线上 E2E 验证

1. 打开首页 → 抽卡
2. 点 👍 → 计数 +1
3. 点 🚫 → 计数 +1 + 自动重抽
4. 浏览器开隐身窗口访问同一 URL，看到的是**累计后**计数（证明确实持久化）
5. `/#/admin` → 输 `13579` → 表格显示 48 张卡 + 排序 + 编辑
6. 改一张卡的 quote → 保存 → 回首页抽到看新文案

## 下次会话恢复要点

1. **先问**：Supabase SQL 跑完没？Vercel 连好了没？
2. **若还没 Supabase**：重复指引 SQL Editor 路径
3. **若 Supabase OK Vercel 没搞**：走上面 2
4. **若都 OK 部署完成**：引导 E2E，出问题看 Vercel Functions logs
5. **后续任务方向**（用户原话）：
   - UI 继续优化（v1 做完时用户说"后续要优化前端ui和功能设置"）
   - 可能加稀有度特效、抽卡动画、分享海报美化
6. **不要**：重建 v1/v2 基础结构（已稳定）；改后端架构（用户已确认 Vercel+Supabase 方案）

## 设计 & 计划文档

- 设计：`docs/superpowers/specs/0419-coworkers-card-draw-design.md`（v1），`docs/superpowers/specs/0421-v2-likes-admin-backend.md`（v2）
- 计划：`docs/superpowers/plans/0419-coworkers-card-draw-mvp.md`（v1），`docs/superpowers/plans/0421-v2-likes-admin-backend.md`（v2）
- 用户原始意图：`意图输入1.txt`, `意图输入2.txt`

## 架构速记

```
浏览器
  ├─ /api/cards             GET    cards + counts
  ├─ /api/vote              POST   {cardId, kind: like|dread}
  ├─ /api/admin/login       POST   {password} → Set-Cookie HMAC
  └─ /api/admin/card        PATCH  session-gated edit
       ↓
Vercel Functions (Node ESM, api/*.js)
       ↓ service_role key
Supabase Postgres (cards 表 + increment_vote RPC)
```

- `SUPABASE_URL` 为空时所有 API 走 `api/_db.js` 的 `mockDb`（内存，重启清零）
- Admin session 是 `base64(expiry).hmac(expiry, ADMIN_SECRET)`，2 小时 TTL
- 无用户去重：同一人可无限次点赞/重抽

## 已知遗留

- 没做线上 E2E（用户还没部署完）
- 没做浏览器真机 E2E 测试（v1 时用户自己测过基础功能）
- UI 还有优化空间（用户在 v2 提出要求时就说"后续要优化"）
- GitHub OAuth token 没 `workflow` scope —— 未来如果要再加 `.github/workflows/` 需先：`gh auth refresh -h github.com -s workflow`
