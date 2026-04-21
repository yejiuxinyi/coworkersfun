0419

# 职场出战领导/同事 抽卡系统 MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地一个可在浏览器跑通"5题玄学问答 → 抽出出战领导/同事卡牌 → 分享/图鉴"全链路的H5 MVP，含48张卡（R36/SR8/SSR4）和带命定路径的抽卡算法。

**Architecture:** Vite + 原生 JavaScript（零框架），数据代码分离（`data/*.json` 驱动题库与卡池），抽卡算法为可单测的纯函数。前端单页，localStorage 做图鉴持久化，`html2canvas` 生成分享海报。静态产物部署 GitHub Pages。

**Tech Stack:** Vite 5、原生 JS（ESM）、Vitest（单测）、html2canvas（海报）、GitHub Pages（部署）

**Spec：** `docs/superpowers/specs/0419-coworkers-card-draw-design.md`

---

## File Structure

```
coworkersfun/
├── index.html                      # 单页入口（挂点 #app）
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                     # 路由与状态入口
│   ├── state.js                    # 全局状态 + localStorage
│   ├── quiz.js                     # 5题问答流程（UI）
│   ├── draw.js                     # 抽卡算法（纯函数，可测）
│   ├── card.js                     # 卡牌详情渲染
│   ├── pokedex.js                  # 图鉴（收集进度）
│   ├── share.js                    # html2canvas 海报
│   └── styles/
│       ├── main.css                # 全站基础样式
│       ├── card.css                # 卡牌外观
│       └── effects.css             # R/SR/SSR 稀有度光效
├── data/
│   ├── questions.json              # 5题玄学问答
│   └── cards.json                  # 48张卡
├── assets/
│   └── cards/                      # 48 张卡图（MVP 阶段用 emoji 占位）
└── tests/
    └── draw.test.js                # 抽卡算法单测
```

每个文件单一职责；`draw.js` 必须是无副作用的纯函数以便 TDD。

---

## Task 1: Scaffold Vite project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles/main.css`

- [ ] **Step 1: 写 `package.json`**

```json
{
  "name": "coworkersfun",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  },
  "dependencies": {
    "html2canvas": "^1.4.1"
  }
}
```

- [ ] **Step 2: 写 `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { outDir: 'dist' },
  test: { environment: 'node' }
});
```

- [ ] **Step 3: 写 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
    <title>今天你会遇到什么老板/同事</title>
    <link rel="stylesheet" href="/src/styles/main.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: 写最小 `src/main.js`**

```js
const app = document.getElementById('app');
app.innerHTML = `<h1>coworkersfun 脚手架就绪</h1>`;
```

- [ ] **Step 5: 写最小 `src/styles/main.css`**

```css
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; background: #0f0f17; color: #f0f0f0; }
#app { max-width: 640px; margin: 0 auto; padding: 24px; min-height: 100vh; }
```

- [ ] **Step 6: 装依赖 & 启动 dev**

```bash
npm install
npm run dev
```

Expected: 终端提示 `Local: http://localhost:5173/`，浏览器打开能看到"coworkersfun 脚手架就绪"。

- [ ] **Step 7: Commit**

```bash
git add package.json vite.config.js index.html src/main.js src/styles/main.css
git commit -m "feat: scaffold vite project with minimal entry"
```

---

## Task 2: 题库 `data/questions.json`（5道玄学题）

**Files:**
- Create: `data/questions.json`

- [ ] **Step 1: 写完整 5 题 JSON**

```json
[
  {
    "id": "Q1",
    "text": "你的星座是？",
    "options": [
      { "label": "白羊", "luck": 1, "tags": ["fire_sign"] },
      { "label": "狮子", "luck": 1, "tags": ["fire_sign"] },
      { "label": "射手", "luck": 1, "tags": ["fire_sign"] },
      { "label": "金牛", "luck": 0, "tags": ["earth_sign"] },
      { "label": "处女", "luck": 0, "tags": ["earth_sign"] },
      { "label": "摩羯", "luck": 0, "tags": ["earth_sign"] },
      { "label": "双子", "luck": 0, "tags": ["air_sign"] },
      { "label": "天秤", "luck": 0, "tags": ["air_sign"] },
      { "label": "水瓶", "luck": 0, "tags": ["air_sign"] },
      { "label": "巨蟹", "luck": -1, "tags": ["water_sign"] },
      { "label": "天蝎", "luck": -1, "tags": ["water_sign"] },
      { "label": "双鱼", "luck": -1, "tags": ["water_sign"] }
    ]
  },
  {
    "id": "Q2",
    "text": "昨天股票/基金状态？",
    "options": [
      { "label": "亏麻了", "luck": -2, "tags": ["unlucky"] },
      { "label": "微赚", "luck": 1, "tags": ["lucky"] },
      { "label": "没买是唯一赢家", "luck": 0, "tags": [] },
      { "label": "装死没看", "luck": -1, "tags": [] }
    ]
  },
  {
    "id": "Q3",
    "text": "最近一周有没有人跟你表白？",
    "options": [
      { "label": "有！还挺开心的", "luck": 2, "tags": ["loved"] },
      { "label": "我跟别人表白了", "luck": 1, "tags": ["loved"] },
      { "label": "没有，又是孤独的一周", "luck": -1, "tags": [] },
      { "label": "不想谈，烦", "luck": -1, "tags": [] }
    ]
  },
  {
    "id": "Q4",
    "text": "昨天有没有吃到好吃的？",
    "options": [
      { "label": "吃到了，爱生活", "luck": 2, "tags": ["foodie"] },
      { "label": "勉强吃饱", "luck": 0, "tags": [] },
      { "label": "忘了吃啥了", "luck": -1, "tags": [] },
      { "label": "减肥中不敢吃", "luck": -1, "tags": [] }
    ]
  },
  {
    "id": "Q5",
    "text": "今天的心情量化一下？",
    "options": [
      { "label": "今天是好日子", "luck": 2, "tags": ["good_day"] },
      { "label": "还行", "luck": 0, "tags": [] },
      { "label": "麻了", "luck": -1, "tags": [] },
      { "label": "想辞职", "luck": -2, "tags": [] }
    ]
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add data/questions.json
git commit -m "feat(data): add 5 玄学 questions with luck and tags"
```

---

## Task 3: 卡池 `data/cards.json`（48张卡）

**Files:**
- Create: `data/cards.json`

- [ ] **Step 1: 写完整 48 张卡 JSON**

```json
[
  { "id": "R001", "rarity": "R", "type": "roast", "role": "leader", "name": "考古学家", "quote": "你去找一下近三十年的市场销售数据", "desc": "把你派去翻旧数据的那种领导", "emoji": "⛏️" },
  { "id": "R002", "rarity": "R", "type": "roast", "role": "coworker", "name": "闲鱼买家", "quote": "这个数据是新的吗", "desc": "凡事都要问一句新不新", "emoji": "🐟" },
  { "id": "R003", "rarity": "R", "type": "roast", "role": "leader", "name": "健身教练", "quote": "年轻人还是要多锻炼", "desc": "总把加班说成锻炼", "emoji": "💪" },
  { "id": "R004", "rarity": "R", "type": "roast", "role": "leader", "name": "生物学家", "quote": "你为什么干活不能像吃饭一样积极？", "desc": "诡异比喻爱好者", "emoji": "🧬" },
  { "id": "R005", "rarity": "R", "type": "roast", "role": "leader", "name": "天师", "quote": "这个事我要跟上面请示才行", "desc": "一切皆要请示", "emoji": "🧿" },
  { "id": "R006", "rarity": "R", "type": "roast", "role": "leader", "name": "魔方", "quote": "接下来我要讲六个方面，每个方面四小点", "desc": "结构化到令人窒息", "emoji": "🧊" },
  { "id": "R007", "rarity": "R", "type": "roast", "role": "coworker", "name": "拖把", "quote": "（一拖再拖）", "desc": "deadline 是唯一生产力", "emoji": "🧹" },
  { "id": "R008", "rarity": "R", "type": "roast", "role": "leader", "name": "时间旅行者", "quote": "（下班前5分钟）这份报告你写一下，下班前给我", "desc": "时空观异于常人", "emoji": "⏰" },
  { "id": "R009", "rarity": "R", "type": "roast", "role": "leader", "name": "篮球裁判", "quote": "你先别走！！！", "desc": "下班前必有一吹", "emoji": "🏀" },
  { "id": "R010", "rarity": "R", "type": "roast", "role": "leader", "name": "长跑裁判", "quote": "你今天晚到了一分三十秒", "desc": "打卡精确到秒", "emoji": "⏱️" },
  { "id": "R011", "rarity": "R", "type": "roast", "role": "leader", "name": "收藏家", "quote": "至少要做三个版本给到我", "desc": "版本越多越安心", "emoji": "📚" },
  { "id": "R012", "rarity": "R", "type": "roast", "role": "leader", "name": "初恋守护者", "quote": "（改了十个版本）我还是觉得第一个最好", "desc": "绕一圈永远回到起点", "emoji": "💌" },
  { "id": "R013", "rarity": "R", "type": "roast", "role": "leader", "name": "失忆症患者", "quote": "我上次没这么说吧？", "desc": "说过的话不能当证据", "emoji": "🌀" },
  { "id": "R014", "rarity": "R", "type": "roast", "role": "leader", "name": "王阳明", "quote": "这个事你不要问我，你自己就应该知道怎么做", "desc": "你要自己顿悟", "emoji": "🧘" },
  { "id": "R015", "rarity": "R", "type": "roast", "role": "leader", "name": "美食家", "quote": "年轻人多吃点亏是好事", "desc": "吃亏学是他的核心理论", "emoji": "🍜" },
  { "id": "R016", "rarity": "R", "type": "roast", "role": "leader", "name": "美国人", "quote": "（夜里两点）你现在把这份材料改一下", "desc": "时差工作者", "emoji": "🗽" },
  { "id": "R017", "rarity": "R", "type": "roast", "role": "leader", "name": "文盲", "quote": "你写的什么东西我看不懂", "desc": "读三行就放弃", "emoji": "📄" },
  { "id": "R018", "rarity": "R", "type": "roast", "role": "leader", "name": "苹果树", "quote": "你不要说别的，我只要结果", "desc": "只摘果不关心根", "emoji": "🍎" },
  { "id": "R019", "rarity": "R", "type": "roast", "role": "leader", "name": "马克思", "quote": "你们在公司要有主人翁意识", "desc": "让你把公司当家", "emoji": "✊" },
  { "id": "R020", "rarity": "R", "type": "roast", "role": "leader", "name": "科学家", "quote": "等我再研究研究", "desc": "永远在研究阶段", "emoji": "🔬" },
  { "id": "R021", "rarity": "R", "type": "roast", "role": "leader", "name": "碰碰车", "quote": "这个事我们开会碰一下", "desc": "能开会绝不决策", "emoji": "🚗" },
  { "id": "R022", "rarity": "R", "type": "roast", "role": "leader", "name": "阿西莫夫", "quote": "宣传视频你用AI做一下不就好了", "desc": "万物皆可 AI 一下", "emoji": "🤖" },
  { "id": "R023", "rarity": "R", "type": "roast", "role": "leader", "name": "慈善家", "quote": "离开我们这家公司，根本没地方愿意招你们", "desc": "深情 PUA 专业户", "emoji": "🎁" },
  { "id": "R024", "rarity": "R", "type": "roast", "role": "leader", "name": "温度计", "quote": "你知不知道现在就业市场有多冷", "desc": "热衷渲染寒气", "emoji": "🌡️" },
  { "id": "R025", "rarity": "R", "type": "roast", "role": "leader", "name": "海王", "quote": "我最看好你，别让我失望", "desc": "这句话他对每个下属都说", "emoji": "🌊" },
  { "id": "R026", "rarity": "R", "type": "roast", "role": "leader", "name": "机器人反抗军", "quote": "你们这些人以后都是会被AI取代的", "desc": "以威胁促生产力", "emoji": "⚙️" },
  { "id": "R027", "rarity": "R", "type": "roast", "role": "leader", "name": "物理学家", "quote": "现在你的重心都应该放在工作上", "desc": "人生重心单维度论", "emoji": "⚛️" },
  { "id": "R028", "rarity": "R", "type": "roast", "role": "leader", "name": "恐怖分子", "quote": "效果还是不够炸啊", "desc": "永远追求更炸", "emoji": "💥" },
  { "id": "R029", "rarity": "R", "type": "roast", "role": "leader", "name": "狙击手", "quote": "我们做工作的站位一定要高，目光要放长远", "desc": "开口必站位", "emoji": "🎯" },
  { "id": "R030", "rarity": "R", "type": "roast", "role": "leader", "name": "亚里士多德", "quote": "你这套方案的逻辑在哪里？", "desc": "逻辑洁癖患者", "emoji": "📐" },
  { "id": "R031", "rarity": "R", "type": "roast", "role": "leader", "name": "宝可梦训练师", "quote": "你马上来一下", "desc": "随时召唤你到工位", "emoji": "🎒" },
  { "id": "R032", "rarity": "R", "type": "roast", "role": "coworker", "name": "烘干机", "quote": "你先干啊，你不干谁干", "desc": "甩锅一把好手", "emoji": "🌀" },
  { "id": "R033", "rarity": "R", "type": "roast", "role": "leader", "name": "东亚父亲", "quote": "你找我哭也没用", "desc": "情感支持 = 0", "emoji": "👨" },
  { "id": "R034", "rarity": "R", "type": "roast", "role": "leader", "name": "拉面师傅", "quote": "我们要想办法跟后面的组拉开差距，把他们甩远一点", "desc": "永远在拉开差距", "emoji": "🍜" },
  { "id": "R035", "rarity": "R", "type": "roast", "role": "coworker", "name": "变色龙", "quote": "（对老板笑脸，转头对你黑脸）", "desc": "双面人格专业户", "emoji": "🦎" },
  { "id": "R036", "rarity": "R", "type": "roast", "role": "coworker", "name": "透明人", "quote": "这事我不清楚，你问别人吧", "desc": "开会从不表态，甩锅先行", "emoji": "👻" },

  { "id": "SR001", "rarity": "SR", "type": "angel", "role": "leader", "name": "树洞", "quote": "最近有啥困难跟我说", "desc": "真的会认真听你说话", "emoji": "🌳" },
  { "id": "SR002", "rarity": "SR", "type": "angel", "role": "leader", "name": "哨兵", "quote": "那个会你别去了，我帮你挡了", "desc": "帮你拦无效会议", "emoji": "🛡️" },
  { "id": "SR003", "rarity": "SR", "type": "angel", "role": "coworker", "name": "翻译官", "quote": "老板的意思其实是要你做XX", "desc": "帮你翻译老板的薛定谔指令", "emoji": "🗣️" },
  { "id": "SR004", "rarity": "SR", "type": "angel", "role": "leader", "name": "面包师", "quote": "今晚加班我请烧烤", "desc": "加班真的会投喂", "emoji": "🥐" },
  { "id": "SR005", "rarity": "SR", "type": "angel", "role": "leader", "name": "沙漠绿洲", "quote": "这周活干完就早点下班", "desc": "别的组卷，他的组准点下班", "emoji": "🌴" },
  { "id": "SR006", "rarity": "SR", "type": "angel", "role": "leader", "name": "教练", "quote": "来我跟你捋一下这个事", "desc": "手把手带，不怕你菜", "emoji": "🏋️" },
  { "id": "SR007", "rarity": "SR", "type": "angel", "role": "leader", "name": "保护伞", "quote": "跨部门的事我来扛", "desc": "battle 永远站你这边", "emoji": "☂️" },
  { "id": "SR008", "rarity": "SR", "type": "angel", "role": "coworker", "name": "阳光型人格", "quote": "早，今天状态不错啊", "desc": "见面第一句让你心情好半天", "emoji": "☀️" },

  { "id": "SSR001", "rarity": "SSR", "type": "angel", "role": "leader", "name": "圣诞老人", "quote": "今年年终多发一个月", "desc": "真的会兑现承诺的神话级老板", "emoji": "🎅", "destined_tags": ["fire_sign", "lucky", "loved", "foodie", "good_day"], "destined_roll": 0.05 },
  { "id": "SSR002", "rarity": "SSR", "type": "angel", "role": "leader", "name": "诸葛亮", "quote": "我来写这一版，你休息", "desc": "能写代码的那种老板", "emoji": "🪶" },
  { "id": "SSR003", "rarity": "SSR", "type": "angel", "role": "leader", "name": "盖茨", "quote": "年会红包我准备了十万", "desc": "财大气粗真发钱", "emoji": "💰" },
  { "id": "SSR004", "rarity": "SSR", "type": "angel", "role": "leader", "name": "甘道夫", "quote": "你已经做得很好了", "desc": "真诚不敷衍的温暖长者", "emoji": "🧙" }
]
```

- [ ] **Step 2: 校验 JSON 合法性**

```bash
node -e "JSON.parse(require('fs').readFileSync('data/cards.json','utf8')).length" 
```

Expected: 输出 `48`

- [ ] **Step 3: Commit**

```bash
git add data/cards.json
git commit -m "feat(data): add 48 character cards (R36/SR8/SSR4) with destined SSR"
```

---

## Task 4: 抽卡算法 TDD（先写失败测试）

**Files:**
- Create: `tests/draw.test.js`

- [ ] **Step 1: 写 `tests/draw.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { drawCard, computeRarityPool, isDestinedHit } from '../src/draw.js';

const mockCards = [
  { id: 'R001', rarity: 'R', type: 'roast', role: 'leader', name: 'R1' },
  { id: 'R002', rarity: 'R', type: 'roast', role: 'leader', name: 'R2' },
  { id: 'SR001', rarity: 'SR', type: 'angel', role: 'leader', name: 'SR1' },
  { id: 'SSR002', rarity: 'SSR', type: 'angel', role: 'leader', name: 'SSR2' },
  { id: 'SSR001', rarity: 'SSR', type: 'angel', role: 'leader', name: 'Santa',
    destined_tags: ['fire_sign','lucky','loved','foodie','good_day'],
    destined_roll: 0.05 }
];

describe('computeRarityPool', () => {
  it('returns base pool when luck is neutral', () => {
    expect(computeRarityPool(0)).toEqual({ R: 0.75, SR: 0.20, SSR: 0.05 });
  });
  it('boosts SSR when luck >= 6', () => {
    expect(computeRarityPool(6)).toEqual({ R: 0.60, SR: 0.30, SSR: 0.10 });
  });
  it('suppresses SSR when luck <= -4', () => {
    expect(computeRarityPool(-4)).toEqual({ R: 0.85, SR: 0.13, SSR: 0.02 });
  });
});

describe('isDestinedHit', () => {
  const santa = mockCards.find(c => c.id === 'SSR001');
  const fullTags = new Set(['fire_sign','lucky','loved','foodie','good_day']);
  const partialTags = new Set(['fire_sign','lucky']);

  it('returns true when all destined_tags matched AND roll succeeds', () => {
    expect(isDestinedHit(santa, fullTags, () => 0.01)).toBe(true);
  });
  it('returns false when a destined_tag is missing', () => {
    expect(isDestinedHit(santa, partialTags, () => 0.01)).toBe(false);
  });
  it('returns false when roll exceeds destined_roll threshold', () => {
    expect(isDestinedHit(santa, fullTags, () => 0.99)).toBe(false);
  });
  it('returns false when card has no destined_tags', () => {
    const sr1 = mockCards.find(c => c.id === 'SR001');
    expect(isDestinedHit(sr1, fullTags, () => 0.01)).toBe(false);
  });
});

describe('drawCard', () => {
  it('returns the destined card when path + luck roll hit', () => {
    const tags = new Set(['fire_sign','lucky','loved','foodie','good_day']);
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 8,
      random: () => 0.01
    });
    expect(card.id).toBe('SSR001');
  });

  it('returns an R rarity card when random falls in R slice', () => {
    const tags = new Set();
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 0,
      random: () => 0.10
    });
    expect(card.rarity).toBe('R');
  });

  it('returns an SR rarity card when random falls in SR slice', () => {
    const tags = new Set();
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 0,
      random: () => 0.80
    });
    expect(card.rarity).toBe('SR');
  });

  it('returns an SSR that is NOT the destined card when path missing', () => {
    const tags = new Set(['fire_sign']);
    const card = drawCard({
      cards: mockCards,
      tags,
      luckScore: 0,
      random: () => 0.97
    });
    expect(card.rarity).toBe('SSR');
    expect(card.id).not.toBe('SSR001');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npm test
```

Expected: 测试失败，报 `Cannot find module '../src/draw.js'` 或各函数未定义。

- [ ] **Step 3: Commit（先提交失败测试，TDD节奏）**

```bash
git add tests/draw.test.js
git commit -m "test(draw): add failing tests for rarity pool, destined path, drawCard"
```

---

## Task 5: 实现 `src/draw.js`（使测试通过）

**Files:**
- Create: `src/draw.js`

- [ ] **Step 1: 写 `src/draw.js`**

```js
const BASE_POOL = { R: 0.75, SR: 0.20, SSR: 0.05 };
const GOOD_POOL = { R: 0.60, SR: 0.30, SSR: 0.10 };
const BAD_POOL  = { R: 0.85, SR: 0.13, SSR: 0.02 };

export function computeRarityPool(luckScore) {
  if (luckScore >= 6) return { ...GOOD_POOL };
  if (luckScore <= -4) return { ...BAD_POOL };
  return { ...BASE_POOL };
}

export function isDestinedHit(card, tagSet, random = Math.random) {
  if (!card.destined_tags || card.destined_tags.length === 0) return false;
  const allTagsHit = card.destined_tags.every(t => tagSet.has(t));
  if (!allTagsHit) return false;
  return random() < (card.destined_roll ?? 0);
}

function pickRarity(pool, random) {
  const r = random();
  let acc = 0;
  for (const [rarity, p] of Object.entries(pool)) {
    acc += p;
    if (r < acc) return rarity;
  }
  return 'R';
}

function pickFromRarity(cards, rarity, random, excludeIds = new Set()) {
  const candidates = cards.filter(c => c.rarity === rarity && !excludeIds.has(c.id));
  if (candidates.length === 0) return null;
  const idx = Math.floor(random() * candidates.length);
  return candidates[idx];
}

export function drawCard({ cards, tags, luckScore, random = Math.random }) {
  const tagSet = tags instanceof Set ? tags : new Set(tags);
  const destinedCards = cards.filter(c => Array.isArray(c.destined_tags));

  for (const c of destinedCards) {
    if (isDestinedHit(c, tagSet, random)) return c;
  }

  const pool = computeRarityPool(luckScore);
  const rarity = pickRarity(pool, random);
  const excludeDestined = new Set(destinedCards.map(c => c.id));
  const picked = pickFromRarity(cards, rarity, random, excludeDestined);
  if (picked) return picked;

  return pickFromRarity(cards, 'R', random, excludeDestined);
}
```

- [ ] **Step 2: 运行测试，确认全部通过**

```bash
npm test
```

Expected: 9 个测试全部 PASS。

- [ ] **Step 3: Commit**

```bash
git add src/draw.js
git commit -m "feat(draw): implement rarity pool, destined path, drawCard"
```

---

## Task 6: 状态管理 `src/state.js` + 数据加载

**Files:**
- Create: `src/state.js`

- [ ] **Step 1: 写 `src/state.js`**

```js
const STORAGE_KEY = 'coworkersfun:v1';

export const state = {
  route: 'home',
  questions: [],
  cards: [],
  answers: [],
  currentCard: null,
  get collected() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    try { return new Set(JSON.parse(raw).collected ?? []); }
    catch { return new Set(); }
  }
};

export function persistCollected(cardId) {
  const current = state.collected;
  current.add(cardId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ collected: [...current] }));
}

export async function loadData() {
  const [q, c] = await Promise.all([
    fetch('./data/questions.json').then(r => r.json()),
    fetch('./data/cards.json').then(r => r.json())
  ]);
  state.questions = q;
  state.cards = c;
}

export function aggregateAnswers(answers, questions) {
  let luckScore = 0;
  const tags = new Set();
  answers.forEach((optIdx, qIdx) => {
    const opt = questions[qIdx].options[optIdx];
    luckScore += opt.luck ?? 0;
    (opt.tags ?? []).forEach(t => tags.add(t));
  });
  return { luckScore, tags };
}
```

- [ ] **Step 2: 把 `data/` 拷贝到 `public/` 以便 Vite 静态服务（简化写法）**

```bash
mkdir -p public
cp -r data public/
```

> 说明：Vite 默认把 `public/` 下的内容按原路径暴露，`fetch('./data/xxx.json')` 才能命中。

- [ ] **Step 3: Commit**

```bash
git add src/state.js public/data/
git commit -m "feat(state): add state module, localStorage persistence, data loader"
```

---

## Task 7: 问答流程 `src/quiz.js`

**Files:**
- Create: `src/quiz.js`

- [ ] **Step 1: 写 `src/quiz.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/quiz.js
git commit -m "feat(quiz): render 5-question flow, emit answers on completion"
```

---

## Task 8: 卡牌详情 `src/card.js`

**Files:**
- Create: `src/card.js`
- Create: `src/styles/card.css`

- [ ] **Step 1: 写 `src/card.js`**

```js
export function renderCard(root, card, { onShare, onDrawAgain, onPokedex }) {
  root.innerHTML = `
    <div class="card-page">
      <div class="card ${card.rarity.toLowerCase()}">
        <div class="rarity-badge">${card.rarity}</div>
        <div class="card-art">${card.emoji ?? '🃏'}</div>
        <h2 class="card-name">${card.name}</h2>
        <p class="card-role">${card.role === 'leader' ? '出战领导' : '出战同事'}</p>
        <blockquote class="card-quote">“${card.quote}”</blockquote>
        <p class="card-desc">${card.desc}</p>
      </div>
      <div class="actions">
        <button id="share-btn">分享这张卡</button>
        <button id="again-btn">再抽一张</button>
        <button id="pokedex-btn">查看卡池进度</button>
      </div>
    </div>
  `;
  root.querySelector('#share-btn').addEventListener('click', () => onShare(card));
  root.querySelector('#again-btn').addEventListener('click', onDrawAgain);
  root.querySelector('#pokedex-btn').addEventListener('click', onPokedex);
}
```

- [ ] **Step 2: 写 `src/styles/card.css`**

```css
.card-page { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 16px 0; }
.card {
  width: 280px; padding: 24px; border-radius: 16px;
  background: linear-gradient(160deg, #1a1a2e, #16213e);
  border: 2px solid #333; text-align: center; position: relative;
}
.card.r   { border-color: #888; box-shadow: 0 0 16px rgba(200,200,200,0.25); }
.card.sr  { border-color: #b9a8ff; box-shadow: 0 0 28px rgba(185,168,255,0.5); }
.card.ssr { border-color: #ffd76a; box-shadow: 0 0 42px rgba(255,215,106,0.85); animation: ssrPulse 2.2s infinite; }
.rarity-badge { position: absolute; top: 12px; right: 12px; font-weight: 800; letter-spacing: 2px; }
.card-art { font-size: 96px; margin: 8px 0 16px; }
.card-name { margin: 0 0 4px; font-size: 26px; }
.card-role { opacity: 0.7; margin: 0 0 12px; font-size: 13px; }
.card-quote { font-size: 17px; margin: 14px 0; font-style: italic; color: #ffe28a; }
.card-desc { font-size: 13px; opacity: 0.8; }
.actions { display: flex; flex-direction: column; gap: 10px; width: 280px; }
.actions button { padding: 12px; border-radius: 10px; border: 1px solid #555; background: #1e1e2e; color: #fff; cursor: pointer; font-size: 15px; }
.actions button:hover { background: #2a2a40; }
@keyframes ssrPulse {
  0%,100% { box-shadow: 0 0 42px rgba(255,215,106,0.85); }
  50%     { box-shadow: 0 0 60px rgba(255,215,106,1); }
}
```

- [ ] **Step 3: 在 `src/styles/main.css` 末尾引入 card.css**

修改 `index.html`，在 `<head>` 里再加一行：
```html
<link rel="stylesheet" href="/src/styles/card.css" />
```

- [ ] **Step 4: Commit**

```bash
git add src/card.js src/styles/card.css index.html
git commit -m "feat(card): render card detail with rarity-styled glow"
```

---

## Task 9: 图鉴 `src/pokedex.js`

**Files:**
- Create: `src/pokedex.js`

- [ ] **Step 1: 写 `src/pokedex.js`**

```js
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
```

- [ ] **Step 2: 在 `src/styles/main.css` 追加样式**

```css
.pokedex { padding: 16px 0; }
.pokedex h2 { margin: 8px 0; }
.progress-text { opacity: 0.75; margin-bottom: 16px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.cell { padding: 10px; border-radius: 10px; text-align: center; background: #1a1a2e; border: 1px solid #333; }
.cell.locked { opacity: 0.4; }
.cell.ssr.owned { border-color: #ffd76a; box-shadow: 0 0 10px rgba(255,215,106,0.5); }
.cell.sr.owned  { border-color: #b9a8ff; }
.cell-art { font-size: 36px; }
.cell-name { font-size: 13px; margin-top: 4px; }
.cell-rarity { font-size: 10px; opacity: 0.6; letter-spacing: 1px; }
#back-btn { background: transparent; color: #aaa; border: none; cursor: pointer; font-size: 14px; padding: 4px 0; }
```

- [ ] **Step 3: Commit**

```bash
git add src/pokedex.js src/styles/main.css
git commit -m "feat(pokedex): collection grid with progress and locked cells"
```

---

## Task 10: 分享海报 `src/share.js`

**Files:**
- Create: `src/share.js`

- [ ] **Step 1: 写 `src/share.js`**

```js
import html2canvas from 'html2canvas';

export async function sharePoster(card) {
  const node = document.querySelector('.card');
  if (!node) {
    alert('未找到卡牌元素');
    return;
  }
  const canvas = await html2canvas(node, { backgroundColor: '#0f0f17', scale: 2 });
  const url = canvas.toDataURL('image/png');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${card.name}-${card.rarity}.png`;
  a.click();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/share.js
git commit -m "feat(share): generate card poster via html2canvas"
```

---

## Task 11: 组装主流程 `src/main.js`

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: 覆盖 `src/main.js`**

```js
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
```

- [ ] **Step 2: 补首页基础样式，在 `src/styles/main.css` 追加**

```css
.home { text-align: center; padding: 48px 0; }
.title { font-size: 32px; line-height: 1.25; margin: 16px 0 8px; }
.sub { opacity: 0.7; margin-bottom: 32px; }
.primary { padding: 14px 32px; font-size: 17px; border: 0; border-radius: 999px; background: linear-gradient(90deg, #ff7eb3, #9f7aea); color: #fff; cursor: pointer; }
.primary:hover { filter: brightness(1.08); }
.ghost { display: block; margin: 18px auto 0; padding: 10px 20px; background: transparent; color: #aaa; border: 1px solid #333; border-radius: 999px; cursor: pointer; }
.quiz { padding: 24px 0; }
.quiz .progress { opacity: 0.6; font-size: 13px; margin-bottom: 12px; }
.quiz .question { font-size: 22px; margin: 8px 0 24px; }
.quiz .options { display: flex; flex-direction: column; gap: 12px; }
.quiz .opt { padding: 14px; font-size: 15px; border-radius: 10px; border: 1px solid #333; background: #1a1a2e; color: #fff; cursor: pointer; text-align: left; }
.quiz .opt:hover { background: #22223a; border-color: #666; }
```

- [ ] **Step 3: 手动 E2E 验证**

```bash
npm run dev
```

在浏览器打开 `http://localhost:5173`，完成：
1. 首页显示"开始抽卡"按钮 ✓
2. 点击后依次显示 5 题 ✓
3. 答完 5 题后出现一张带稀有度光效的卡 ✓
4. 点"再抽一张"能回到题目流程 ✓
5. 点"分享这张卡"下载到 `${name}-${rarity}.png` ✓
6. 点"查看卡池进度"显示 48 格（已抽的点亮，其余为 ???） ✓
7. 刷新页面后图鉴进度保留 ✓

- [ ] **Step 4: Commit**

```bash
git add src/main.js src/styles/main.css
git commit -m "feat(main): wire home→quiz→draw→card→pokedex full flow"
```

---

## Task 12: 部署配置（GitHub Pages）

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 修改 `package.json` 添加部署脚本**

在 `"scripts"` 内追加：
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "deploy:preview": "npm run build && vite preview --port 4173"
}
```

- [ ] **Step 2: 写 `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master, main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 3: 本地产物验证**

```bash
npm run build
npm run deploy:preview
```

Expected: 浏览器打开 `http://localhost:4173` 能看到完整可用的站点。

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/deploy.yml
git commit -m "chore: add GitHub Pages deploy workflow"
```

---

## Self-Review Checklist

**Spec coverage:**
- §4 体验链路 → Task 7/8/9/11 ✓
- §5 卡池 R36/SR8/SSR4 → Task 3 ✓
- §5.5 命定路径 → Task 4/5（`isDestinedHit` + `destined_tags` + `destined_roll`）✓
- §6 数据结构 → Task 2/3（questions.json / cards.json）✓
- §7 配图方案 → MVP 用 emoji 占位，后续迭代（spec 已说明）✓
- §8 技术架构 → Task 1/6/11 文件结构一致 ✓
- §9 MVP 范围 → 全部 12 个 Task 覆盖 ✓
- §11 风险 → Task 3 的 SSR 数量控制为 4 张，destined 仅 1 张，已克制 ✓

**Placeholder scan:** 无 TBD/TODO；SR/SSR 台词已给定具体文案（后续可由用户微调 `cards.json`，不需要改代码）；测试代码完整。

**Type consistency:** `drawCard({ cards, tags, luckScore, random })` 在 Task 4 测试与 Task 5 实现、Task 11 调用三处签名一致；`state.cards/questions/collected` 在 state.js / quiz.js / pokedex.js / main.js 中使用一致。

---

## Next Step

Plan complete and saved to `docs/superpowers/plans/0419-coworkers-card-draw-mvp.md`.

执行方式二选一：
1. **Subagent-Driven**（推荐）：我派新 subagent 逐 task 执行，每 task 完我 review 再开下一个
2. **Inline Execution**：在当前会话里一口气跑完，checkpoint 时暂停让你看

请选择。
