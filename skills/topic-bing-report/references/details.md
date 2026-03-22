# topic-bing-report 详细参考

按需读取：域名白名单、查询示例、信息时效（§1.6）、Playwright 正文抽取、报告模板、质量清单与排障。主流程见上级 `SKILL.md`。

### 话题列表呈现示例

向用户展示 `topics` 结果时可用：

```
可用话题：
1. cmmsi2h1r0005me6xl3aqnuw9 - AI模型进展
2. cmmshb0nt0001jp0as54syen5 - 一人公司的agentos
...
```

---

## 1. 国际来源域名与检索

### 1.1 优先站点（可拼进 `site:`）

以下站点名对应结果优先采用；构建 Bing 查询时可将域名用 `OR` 组合，例如：

`site:techcrunch.com OR site:wired.com OR site:theverge.com`

| 类型 | 站点 |
|------|------|
| 科技媒体 | TechCrunch, Wired, The Verge, Ars Technica, VentureBeat, The Register, ZDNet |
| 财经与综合 | Forbes, Bloomberg, Financial Times, Reuters, AP News, The New York Times, Wall Street Journal |
| 研究与商业 | MIT Technology Review, Harvard Business Review, McKinsey Quarterly |
| 开发者与社区 | dev.to, GitHub, Medium, Substack, Hacker News |

### 1.2 排除与降权（`-site:`）

常见追加项（可按任务再补充）：

`-site:zhihu.com -site:csdn.net -site:sohu.com`

对中文聚合站、强登录、易拦截的域名**降权或跳过**（如部分门户、微信公众号网页版等）。

### 1.3 慎用 `site:.com`

会误伤 `.io`、`.org`、`.ai` 等正当站点；优先**白名单 `site:`** 或 **`-site:` 排除**，见主 SKILL 步骤 2。

### 1.4 搜索词示例

（表中 **年份请按执行检索时的当年替换**；与 §1.6 一致，偏「最近 7 天」可加 `this week`、`breaking`、`today`、`recent` 等（按需、勿堆砌），再以结果与页面日期为准筛选。）

| 话题方向 | 英文搜索词（示例） |
|----------|-------------------|
| 一人公司 / agent | `"AI agent" "solo founder" OR "one person company" this week 2026 -site:zhihu.com -site:csdn.net` |
| AI 模型进展 | `Claude Gemini comparison benchmark breaking 2026 site:theverge.com OR site:arstechnica.com` |
| 品牌 AI 案例 | `brand AI case study recent 2026 site:techcrunch.com OR site:wired.com` |

### 1.5 多轮搜索与翻页

- 每个话题至少 **2～3 轮**不同 query（与 §1.6「最近 7 天」一致）：  
  1. 核心词 + **当年份** + 可选 `this week OR breaking OR recent`（勿堆砌同义词）  
  2. 细分 + `trend OR insight OR analysis`（可再带当年份）  
  3. 案例 + `case study OR example`  
- 若按上述检索后**仍缺少**落入 **7 天**窗口的可用来源，可再加宽检索或引用更早材料，但须在报告中**逐条注明**「超出 7 日窗口」及引用原因（背景/唯一权威来源等）。
- 同一 query 需更多条：按 **bing-search** skill 用 Bing URL 参数 `first=` 翻页。
- 各轮可并行（工具允许时）；抓全文前先排序 URL，只抓 **2～3** 篇全文。

### 1.6 信息时效（检索日 vs 原文日期）

- **默认窗口：最近 7 天内（偏最新）**：以 **检索日** 为 T，优先选用原文日期在 **\[T−7 天, T\]**（含边界）内**首次发表**或**重大更新**（页面明确 `Updated` 且正文实质变化）的材料。按自然日计算。
- **无法保证结果自动落在窗口内**：Bing 排序不以「最新」为唯一目标；**靠检索式（当年份、`this week`/`breaking`/`recent` 等）+ 结果与页面日期筛选**。
- **结果侧**：优先看 **bing-search 提取结果中的 `date` 字段**（若有）；打开详情页后再核对 **byline / 发布时间 /「Updated」**。明显早于 T−7 天且非必要背景则换文。
- **辅助日期（可选）**：需要把「7 天前」写成具体日历时，**检索日**用 `date +%Y-%m-%d`；**7 天前**：macOS `date -v-7d +%Y-%m-%d`，GNU/Linux `date -d '7 days ago' +%Y-%m-%d`。仅作人工比对，不代替 Bing。
- **报告侧**：模板中的 **检索日** = 执行搜索当日，用于与 **原文发布日期** 区分。**`date` 类命令只辅助标注与比对，不改变 Bing 返回内容。**

---

## 2. 详情页全文（Playwright MCP）

### 2.1 会话顺序（与 MCP 一致）

1. `browser_navigate` 打开 URL（无可用 tab 时）。
2. 需要时 **`browser_lock`** 后再点击、输入、`browser_evaluate`。
3. 该 URL 操作结束 **`browser_unlock`**。
4. 已有 tab 继续操作：先确认 tab，再 lock。

### 2.2 提取正文脚本

在页面加载完成后 `browser_evaluate`：

```javascript
() => {
  const pick = () =>
    document.querySelector('article') ||
    document.querySelector('main') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('.post, .entry-content, .article-body') ||
    document.querySelector('.article-content');
  const el = pick();
  const text = (el && el.innerText) || document.body.innerText;
  return text.slice(0, 8000);
}
```

**站点提示**：Medium / Substack / dev.to 多以 `article` 为主；TechCrunch、Wired、The Verge 常见 `article` 或主栏容器。仍失败再降级 `body` 截断。

**付费墙 / 强登录 / 正文极短**：判为无法全文抓取，**立即换 URL**，勿长时间重试。

### 2.3 来源优先级（抓取顺序）

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 | TechCrunch, Wired, The Verge | 结构清晰，一般易抓正文 |
| 2 | Medium, Substack, dev.to | 深度内容多；注意付费段落 |
| 3 | Forbes, Bloomberg, HBR | 注意跳转与裁剪 |
| 4 | GitHub, Hacker News | 讨论与 issue，作补充 |
| 避免 | CSDN、知乎、微信公众号等 | 难访问或需登录 |

### 2.4 无法访问与数量

- 标注「来源暂时无法访问」或「仅摘要可用」；仅用摘要时文中写 **「仅据检索摘要，未读全文」**。
- 勿卡在同一 URL；换其它国际来源。
- 全文 **2～3** 篇即可，其余用摘要支撑。

---

## 3. 报告模板（Markdown）

```markdown
# [标题：话题名 + 核心洞察]

> 日期：YYYY-MM-DD
> 检索日：YYYY-MM-DD（执行 Bing 搜索当日，可与文章日期不同；正文主要依据宜为检索日前 7 天内，见 §1.6）
> 关键词：关键词1、关键词2、关键词3

## 核心结论

[2-3 句话总结最重要的发现]

---

## 一、[第一个主题]

### 1.1 [子标题]
[内容；若仅来自 Bing 摘要，句末或段末注明「（仅据检索摘要）」]

来源：[标题](URL)

### 1.2 [子标题]
[内容]

来源：[标题](URL)

## 二、[第二个主题]
...

## 三、[趋势分析/实践建议]
...

---

## 结语

[总结 + 未来展望]

*信息来源：Bing 搜索（检索日 YYYY-MM-DD），正文整合自 TechCrunch、Wired 等；单条若仅摘要则文中已标注。*
```

### 3.1 写作要点

- 中文撰写，Mixlab 风格智库报告排版。
- 观点注明 `[标题](URL)`；区分**原文发布日期**（若有）与**本次检索日期**（建议与执行日一致，可用 `date +%Y-%m-%d`）。主要论据宜落在 **T−7 天**窗口内；超出须说明原因。
- 英文材料中文转述，避免大段原文。
- 有判断与结构，非素材罗列。
- 字数 **1500～3000**。

### 3.2 国际来源比例

- 国际来源 **≥ 60%**。
- 中文来源仅在政策、本地数据或用户明确要求时使用。

---

## 4. 质量检查清单

- [ ] 标题简洁有力，不超过 30 字
- [ ] 核心结论在文章开头（前 200 字内）
- [ ] 每个观点有具体来源链接；摘要级依据已标注
- [ ] 检索日与原文日期已区分；主要依据落在检索日前 7 天窗口内，或文中已逐条说明窗口外引用及原因
- [ ] 国际来源占比 ≥ 60%
- [ ] 无大段未经消化的英文引用
- [ ] 有实践建议或洞察
- [ ] 字数 1500-3000 字
- [ ] 与话题下近期文章角度不重复
- [ ] 文章已成功添加到话题后再清理临时文件

---

## 5. 失败经验汇总

| 问题 | 教训 |
|------|------|
| bing-search skill 没有被调用 | 必须用 Skill 工具显式调用；否则按 bing-search 的 SKILL 与同目录 `scripts/extract-results.js` 执行 |
| CSDN 链接重定向错误 | 不依赖 CSDN；优先国际来源 |
| 知乎 WebFetch 被阻止 | 不使用 WebFetch；用 Playwright MCP |
| 搜索结果偏中文站 | 英文关键词 + 白名单 `site:` 或 `-site:` 排除 |
| 报告信息堆砌 | 强化「核心结论 + 分主题论证 + 建议」结构 |
| 在某个来源卡住 | 付费墙/登录/超时即换 URL；摘要可写但要标注 |
| 笼统 `site:.com` 漏结果 | 改用域名白名单或排除项 |
| 报告像旧闻或无法判断新旧 | 用 §1.6：对照 T−7 天、看结果 `date` 与页面发布日期；检索日如实填写 |
