# Skills

本仓库是一组 **Cursor / Agent 可调用的技能（Skills）**，用于 mixdao、MIXLAB Solo Scope 等场景下的数据拉取、分类整理、简报生成与内容补全。

## 目录结构

```
skills/
├── README.md                 # 本文件
├── LICENSE                   # MIT
└── skills/
    ├── solo-scope/           # Solo Scope RSS 简报（纯 Agent 执行）
    │   └── SKILL.md
    ├── fill-content/         # 无正文条目抓取正文并 AI 梳理回写
    │   ├── SKILL.md
    │   ├── package.json
    │   └── scripts/
    │       ├── 01-fetch-no-content.js
    │       ├── 02-fetch-content.js
    │       └── 03-update-from-temp.js
    ├── daily-briefing/       # mixdao latest → MiniMax 分类 → 简报与推荐语上传
    │   ├── SKILL.md
    │   ├── package.json
    │   └── scripts/
    │       ├── 01-fetch.js
    │       └── 02-briefing.js
    ├── todo-list/            # 智能待办（自然语言时间解析、持久化 Markdown）
    │   ├── SKILL.md
    │   ├── package.json
    │   └── scripts/
    │       ├── time.js
    │       └── todo.js
    ├── qq-email/             # QQ 邮箱 IMAP 收信、SMTP 发信
    │   ├── SKILL.md
    │   ├── package.json
    │   └── scripts/
    │       ├── send.js
    │       ├── receive.js
    │       └── get-body.js
    ├── techno-humanist-prophet/  # 简报 + 用户记忆 → KK + Jobs 双视角推文
    │   └── SKILL.md
    └── insight-from-chat/    # 从聊天/用户反馈挖掘洞察（结构化 JSON）
        └── SKILL.md
```

## 技能一览

| 技能 | 说明 | 触发示例 | 依赖 |
|------|------|----------|------|
| **solo-scope** | 从 Solo Scope RSS 拉取条目，按主题整理 3～6 类，每类 140 字摘要 + 条目列表，输出 Markdown 简报 | 「做 Solo Scope」「整理 mixdao feed」「RSS 分类简报」 | 无（Agent 用 curl 拉 RSS） |
| **fill-content** | 筛出 mixdao 无正文条目，按 URL 抓正文，AI 梳理为约 250 字案例描述并回写 | 「补全正文」「fill content」「无正文」「补全内容」「mixdao 正文」 | `MIXDAO_API_KEY`；更新时需 `ANTHROPIC_API_KEY` |
| **daily-briefing** | 从 mixdao latest 拉数据 → MiniMax-M2.5 分组（至多 5 组、每组至少 3 条）→ 生成分组摘要与推荐语 → 上传简报并提交推荐语 | 「执行 daily briefing」「做今日 mixdao 简报」 | `MIXDAO_API_KEY`、`ANTHROPIC_API_KEY` |
| **todo-list** | 智能待办：自然语言时间解析（dayjs）、事项记录/更新/完成/删除，持久化到 temp/todo-list.md | 「提醒我」「待办」「记住」「计划」「列出待办」 | Node + dayjs |
| **qq-email** | QQ 邮箱 IMAP 收信、SMTP 发信；支持按条数/天数收信、按序号取完整正文 | 「发 QQ 邮件」「收邮件」「查邮件」「代发邮件」 | `QQ_EMAIL_ACCOUNT`、`QQ_EMAIL_AUTH_CODE` |
| **techno-humanist-prophet** | 从简报 + 用户记忆挑选素材，用乔布斯与凯文·凯利双视角写 120～150 字科技人文推文 | 「用科技人文主义视角解读」「KK + Jobs 风格推文」 | 无（需传入简报与记忆） |
| **insight-from-chat** | 从聊天/用户反馈中由模型归纳类别，产出情绪倾向、需求痛点、业务机会的结构化 JSON | 「从聊天挖洞察」「用户反馈分析」「痛点挖掘」「需求洞察」 | 无（Agent 传上下文给 LLM） |

各技能详细说明、步骤与命令见各自目录下的 **SKILL.md**。

## 环境要求

- **Node.js**：fill-content、daily-briefing、todo-list、qq-email 的脚本需要 Node（建议 18+），且使用 `"type": "module"`。
- **环境变量**（按技能需要配置）：复制 [.env.example](.env.example) 为 `.env` 并填入实际值。
  - `MIXDAO_API_KEY`：mixdao API Bearer token（fill-content、daily-briefing）
  - `ANTHROPIC_API_KEY`：MiniMax API Key（daily-briefing 的 02-briefing、fill-content 的 03-update）
  - `ANTHROPIC_BASE_URL`：可选，默认 `https://api.minimaxi.com/anthropic`（daily-briefing）
  - `QQ_EMAIL_ACCOUNT`、`QQ_EMAIL_AUTH_CODE`：QQ 邮箱账号与授权码（qq-email）

## 如何使用

### 在 Cursor 中使用

将本仓库或 `skills/` 下的技能目录配置到 Cursor 的 Agent Skills 中，Agent 会根据用户自然语言匹配各 SKILL.md 的 `description` 与触发示例，按 SKILL 内流程执行（包括调用脚本）。

### 本地直接运行脚本

- **fill-content**：在 `skills/fill-content/` 下执行 `npm install`，然后按 SKILL.md 中「流程」依次运行 `01-fetch-no-content.js` → `02-fetch-content.js` → `03-update-from-temp.js`（list/更新）。
- **daily-briefing**：在 `skills/daily-briefing/` 下执行 `npm install`，先运行 `01-fetch.js`，再将输出的 temp 文件路径传给 `02-briefing.js`。
- **todo-list**：在 `skills/todo-list/` 下执行 `npm install`，使用 `node scripts/time.js` 解析时间、`node scripts/todo.js add|list|update|done|delete` 管理待办。
- **qq-email**：在 `skills/qq-email/` 下执行 `npm install`，使用 `scripts/send.js` 发信、`receive.js` 收信、`get-body.js` 取单封正文。

具体命令与参数见各技能 **SKILL.md**。

## 许可证

MIT License，见 [LICENSE](LICENSE)。

---

## 添加新技能

新技能请放在 `skills/<skill-name>/` 下，并包含至少一个 **SKILL.md**。SKILL.md 建议包含：

- 头部 YAML：`name`、`description`（含自然语言触发示例）。
- 何时使用、脚本/流程说明、环境变量、输出要求等。

带 Node 脚本的技能可增加 `package.json` 与 `scripts/`，并在 SKILL 中写明执行顺序与参数。

更多改进建议见 [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md)。
