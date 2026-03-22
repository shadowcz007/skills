---
name: topic-bing-report
description: 从 solo-topics 获取话题，进行 Bing 搜索（国际来源优先）并获取全文，撰写汇总报告，投稿到话题。触发词：「制作专题报告」。搜索阶段调用 bing-search skill；详情页用 Playwright MCP；脚本路径以各 skill 目录为基准。需区分检索日与原文日期；默认材料时效为检索日前 7 天内（偏最新），详见 references/details.md。
---

# Topic Bing Report

从 solo-topics 获取话题关键词，调用 bing-search 执行搜索（**国际来源优先**），用 Playwright MCP 获取详情页全文，整合信息撰写汇总智库报告，并投稿到对应话题。

**详细参考**（按需读取，与本 `SKILL.md` 同目录）：[`references/details.md`](references/details.md) — 国际来源域名与 `site:` 组合、搜索示例、§1.6 信息时效、正文 `evaluate` 脚本、报告模板、质量清单、失败经验表。

## 路径与仓库约定（通用）

- **solo-topics 目录** / **bing-search 目录**：分别指含有对应 `SKILL.md` 与 `scripts/` 的那一层 skill 目录（与仓库内其它 skill 并列）。
- **执行命令前**：`cd` 到对应 skill 目录（或使用等价路径调用脚本），**禁止**在说明中写死某一用户的本机绝对路径。
- **投稿**：`solo-topics.js add` 的第二个参数为 Markdown 路径，**相对运行命令时的当前工作目录**（与 solo-topics skill 一致）。

## 核心流程

```
1. solo-topics 获取话题 + keywords
     ↓
2. bing-search 执行搜索（英文关键词，国际来源优先）
     ↓
3. Playwright MCP 获取详情页全文（国际来源优先）
     ↓
4. 撰写汇总报告
     ↓
5. solo-topics add 投稿
```

## 环境要求

- **MCP Playwright** 插件
- **solo-topics** 环境变量：`MIXDAO_API_KEY`

---

## 步骤 1：获取话题

- **用户已指定话题**：直接用其 ID 或名称，跳过列表。
- **未指定**：在 **solo-topics 目录** 执行 `node scripts/solo-topics.js topics`，向用户展示 **id + label**（示例见 `references/details.md` 文首）。
- 执行 `node scripts/solo-topics.js articles <TOPIC_ID>`，避免与已有文章同质化。
- **去重**：新报告标题与切入角度应与近期文章区分；若仅换词重复结论，应调整检索或分析框架后再写。

---

## 步骤 2：构造搜索关键词

- 从话题 `keywords` 中选 **3～5** 个**英文**关键词；避免整句纯中文作为唯一检索式。
- **国际优先**：用 **域名白名单 `site:... OR ...`** 与 **`-site:` 排除**（列表与示例见 `references/details.md` §1）；**慎用**笼统 `site:.com`。
- **时效（最近 7 天内）**：以**检索日**为基准，正文主要依据宜为**往前 7 天内**发表或重大更新；检索式与筛 URL 的规则见 **`references/details.md` §1.6**。单靠搜索引擎无法保证结果都在窗口内，须在结果与页面上核对日期。
- **多轮与翻页、并行与全文篇数**：见 `references/details.md` §1.5。

---

## 步骤 3：执行搜索（调用 bing-search）

**优先**用 Skill 工具调用 **bing-search**，参数为构造好的英文搜索词。

若无法调用该 skill：按 **bing-search 目录** 内 `SKILL.md` 操作；结果提取使用同目录 `scripts/extract-results.js`，勿自写易碎 DOM 解析。

结果筛选（域名与优先级）见 **`references/details.md` §1**；每条结果的 **`date` 字段**（若有）用于判断是否落入 **7 天**窗口；与详情页显示的**原文发布/更新日期**交叉核对，明显早于窗口且非必要背景则换 URL。

---

## 步骤 4：获取详情页全文（Playwright MCP）

不通过 bing-search；直接用 Playwright MCP 打开 URL 并抽取正文。

**浏览器 lock/unlock 顺序、`browser_evaluate` 脚本、来源抓取优先级、付费墙处理、全文 2～3 篇**：见 **`references/details.md` §2**。

---

## 步骤 5：撰写汇总报告

**完整 Markdown 模板、写作要点、国际来源比例**：见 **`references/details.md` §3**。

摘要要求：中文、Mixlab 智库风格、1500～3000 字、观点带 `[标题](URL)`、区分检索日与原文日期、摘要级依据须标注。

- **检索日**：填**执行 Bing 搜索当日**的 `YYYY-MM-DD`。为避免手误，可在终端执行 `date +%Y-%m-%d`（macOS/Linux）作为检索日填入模板；**检索日不会使搜索结果变新**，仅作诚实标注并与正文中的原文日期对照。

---

## 步骤 6：投稿并清理

在 **solo-topics 目录**：

```bash
node scripts/solo-topics.js add <TOPIC_ID> <文章.md 的路径>
```

- **`add` 成功**：可删临时稿。
- **`add` 失败**：**保留**临时文件，勿删除。

---

## 质量检查与排障

清单与失败经验表见 **`references/details.md` §4、§5**。

---

## 依赖的 Skills

| Skill | 用途 |
|-------|------|
| **solo-topics** | 话题列表、文章列表、投稿（`scripts/solo-topics.js`） |
| **bing-search** | Bing 搜索与结果解析（`scripts/extract-results.js`） |

详情页使用 **Playwright MCP**，不经过其它 skill。
