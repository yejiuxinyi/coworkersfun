0423

# coworkersfun · 会话交接档（2026-04-23）

## 一句话状态

**v3 demo 已部署到 Vercel 线上，功能全通，等用户反馈 + 挑美术风格**。

线上：**https://coworkersfun.vercel.app**
仓库：https://github.com/yejiuxinyi/coworkersfun（HEAD = `3f9b189`）

---

## 历代版本进展

| 版本 | 交付 | 状态 |
|---|---|---|
| **v1** | TDD 抽卡算法 + 5题问答 + 48张卡 + Pokedex + 分享 | ✅ 已部署 |
| **v2** | 👍/🚫 计数后端 + Supabase 持久化 + `/#/admin` 管理员 + HMAC session | ✅ 已部署并验证 |
| **v3** | 5 连盲盒抽卡 + 翻牌特效（R白/SR紫/SSR金+confetti）+ 卡面新布局 + 赛博卡通视觉 + 狗头卡背 SVG | ✅ 已部署，等用户测 |

## 仓库信息

- 位置：`E:\cursor\ProjectsForPrac\coworkersfun`（独立 git repo）
- GitHub：https://github.com/yejiuxinyi/coworkersfun（public）
- 分支：master（18 个 commit）
- git 身份注入（不写入 config）：
  ```
  git -c user.email=xief5345@gmail.com -c user.name=yejiuxinyi commit -m ...
  ```

## 线上部署

- Vercel 项目：`coworkersfun`，托管在 `yejiuxinyi` 账户
- Supabase 项目 ref：`olvdrfdulnfndvfmrzue`（SQL + 48 行 seed 数据都已跑过）
- Vercel 环境变量已填（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ADMIN_PASSWORD=13579 / ADMIN_SECRET）
- push 到 master 会自动触发 Vercel 重新部署，约 1 分钟

**用户**明确说 service_role key 不 rotate（他说没风险）。

## 技术栈

- Vite 5 + 原生 JS（前端 SPA）
- Vercel Serverless Functions（`api/*.js`）
- Supabase Postgres（数据库）
- `@supabase/supabase-js`、`html2canvas`
- vitest（18 个测试：11 draw + 3 drawFive + 4 session）

## API 速记

```
GET   /api/cards                48 张卡 + likes_count/dreads_count
POST  /api/vote                 {cardId, kind: like|dread} → 原子递增
POST  /api/admin/login          {password} → Set-Cookie admin_session (HMAC, 2h)
PATCH /api/admin/card           {id, name?, quote?, desc?, emoji?} → session 校验
```

`api/_db.js` 有 `isMock()` 分支 — 当 `SUPABASE_URL` 为空时走内存 mock。

## v3 关键设计

- **drawFive** (`src/draw.js`)：独立抽 5 张 + 保底（5 张全 R 强制替换 1 张为 SR/SSR）
- **Reveal 页** (`src/reveal.js`)：5 张卡背纵向堆叠，点击 3D rotateY 翻面，按稀有度分级光效
- **翻牌特效** (`src/styles/reveal.css`)：
  - R：`filter: drop-shadow` 白光一闪
  - SR：紫光 + 紫色余辉
  - SSR：金光 + confetti 粒子（`fireConfetti()` DOM 注入）
- **Card 详情**：分享图标左上、计数按钮本身可点（👍/😭/🔄）
- **视觉**：米黄底 + 黑粗描边 + 厚纸板 box-shadow + 孟菲斯几何点缀
- **localStorage** 保存当前 5 连进度（离开后回来能续看，有"回到上一组 5 连"按钮）

## 下次恢复要点（优先级排序）

### 1. 先问用户：v3 demo 试了吗？

- 如果试了 → 问哪里不对（视觉/交互/某张卡）→ 小改
- 如果没试 → 引导打开 https://coworkersfun.vercel.app 手机上玩一玩

### 2. 挑美术风格

文档在 `docs/0422-v3-美术风格选项.md`，让用户答两行：
```
卡面角色 = [A 扁平Q版 / B 线稿彩 / C 棍人 / D 像素]
Doge 卡背 = [1 meme原图 / 2 重绘 / 3 几何 / 4 烫金]
```

**我的推荐**：A + 3 无缝升级 / C + 1 最有传播力

### 3. 真美术生成

选定后的下一步：
- 整理 48 张人物 + 1 张卡背的 Midjourney/imagen-3 prompt
- 如果用户授权我调图像 API → 直接生成
- 否则 → 给 prompt 让用户自己去 MJ
- 生成后塞 `public/assets/cards/{id}.webp` 和 `public/assets/back.png`
- 前端卡面 emoji 替换成 `<img>`

### 4. 题库修改

用户说自己改 `data/questions.json`。字段结构：
```json
{
  "id": "Q1",
  "text": "题干",
  "options": [
    { "label": "显示文字", "luck": 1, "tags": ["fire_sign"] }
  ]
}
```
- luck：-2 到 +2（影响稀有度池）
- tags：触发命定卡（目前只有 SSR001 圣诞老人要求 5 tag 命中）

用户想加 0-999 数字题（推迟到下一轮，用户原话"LUX 以后再做"）。

### 5. 用户明确推迟的功能

- luck 加权规则（圣诞老人命定路径保留在代码里，但 5 连抽时暂不强化这条路径）
- 数字题（0-999）
- 题库完整重写（用户自己改，我不帮改）

## 不要做的事

- ❌ 重建 v1/v2/v3 基础结构（已稳定）
- ❌ 改后端架构（Vercel + Supabase 已确认）
- ❌ 主动 rotate service_role key（用户说没风险）
- ❌ 没授权就 push 或做大改动

## 关键路径速查

```
src/draw.js          drawCard, drawFive, isDestinedHit, computeRarityPool
src/reveal.js        5 张翻牌页面（SVG Doge 卡背 + 翻转 + confetti）
src/card.js          单卡详情（新 3 按钮布局）
src/main.js          route: home → quiz → reveal → card
src/styles/main.css  赛博卡通基础配色
src/styles/reveal.css 翻牌 3D + 稀有度光效 keyframes
src/styles/card.css  单卡详情布局
src/styles/admin.css 后台黄表头
api/cards.js         GET 全量卡
api/vote.js          POST 递增 (RPC increment_vote)
api/admin/login.js   密码 → HMAC cookie
api/admin/card.js    PATCH 卡牌字段（session 校验）
api/_db.js           Supabase 客户端 + mock 分支
api/_session.js      HMAC 签发/验证
db/schema.sql        建表 + RPC 函数
db/seed.sql          48 行 upsert（自动生成，scripts/gen-seed.js）
docs/0422-v3-美术风格选项.md  美术选型待决策
```

## 设计 & 计划文档

- **v1 设计**：`docs/superpowers/specs/0419-coworkers-card-draw-design.md`
- **v1 计划**：`docs/superpowers/plans/0419-coworkers-card-draw-mvp.md`
- **v2 设计**：`docs/superpowers/specs/0421-v2-likes-admin-backend.md`
- **v2 计划**：`docs/superpowers/plans/0421-v2-likes-admin-backend.md`
- **架构原理**（写给小白的解释）：`docs/0421-架构原理解释.md`
- **v3 需求**：`docs/0421-v3-需求整理与决策点.md`
- **v3 美术选型**：`docs/0422-v3-美术风格选项.md`

## 用户原始意图（时间线）

- `意图输入1.txt`：最初想法（SBTI + 职场抽卡）
- `意图输入2.txt`：v1 调整（MVP + 玄学问题 + 随机+逻辑）
- `意图输入3.txt`：v3 大改（手机长条 + 5 连 + 翻牌特效 + 按钮重组 + 卡背 Doge + 小人形象）
- `意图输入4.txt`：v3 决策（赛博卡通 + B 保底 + 翻倍特效 + 先做 demo）

## 遗留/已知问题

- GitHub OAuth token 缺 `workflow` scope（要加 `.github/workflows/` 需 `gh auth refresh -h github.com -s workflow`）
- `credential-manager-core is not a git command` 警告 — git push 能成功但末尾有噪声，不影响功能
- v3 demo 没做真机浏览器 E2E 自动测试（靠用户手动）
