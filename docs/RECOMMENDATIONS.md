# 改进建议

本文档记录对本仓库的改进建议，便于后续迭代。

## 文档与结构

- **README 已补充**：根目录 README 已包含目录结构、技能一览表、环境要求、使用方式与添加新技能的说明。
- **统一 SKILL 头部**：各 SKILL.md 已使用 YAML front matter（`name`、`description`），建议新增技能时保持同一格式，便于 Cursor 解析与匹配触发词。
- **版本与变更**：可为仓库或各 skill 增加版本号/CHANGELOG（如 `skills/daily-briefing/CHANGELOG.md`），便于追踪脚本与流程变更。

## 代码与脚本

- **依赖与安全**：fill-content、daily-briefing 均依赖 `@anthropic-ai/sdk`、`jsonrepair`，建议在根目录或各 skill 下定期 `npm audit`，并考虑锁版本（已有 package-lock 的保留即可）。
- **错误处理与日志**：脚本中可统一约定错误码、日志格式（如 `[skill-name] message`），便于在 Agent 或 CI 中排查。
- **临时目录**：`temp/` 在各 skill 内使用，建议在 SKILL 或 README 中说明可加入 `.gitignore`，避免误提交临时数据。

## 配置与密钥

- **环境变量集中说明**：README 中已汇总主要环境变量；建议在仓库中保留一份 `.env.example`（不包含真实密钥），列出 `MIXDAO_API_KEY`、`ANTHROPIC_API_KEY`、`ANTHROPIC_BASE_URL` 等变量名与说明，方便新用户配置。
- **多环境**：若将来区分开发/生产，可考虑用不同 env 文件或 Cursor 规则区分 API 端点与 Key。

## 测试与自动化

- **脚本可测性**：对 01/02/03 类脚本，可考虑抽出「拉取/解析/请求 API」为可注入的依赖，便于单测或 mock。
- **轻量 CI**：若仓库需多人协作，可加 GitHub Actions：在 PR 时运行 `node scripts/01-*.js` 等做冒烟测试（不提交真实 API 调用时可 mock 或跳过需 Key 的步骤）。

## 技能扩展

- **mixlab-solo-scope**：当前为纯 Agent 流程，若 RSS 条目很多，可考虑提供可选的小脚本（如 Node 拉取 + 输出 JSON），再由 Agent 做分类与摘要，以统一「有脚本 / 无脚本」两类技能的文档风格。
- **复用与共享**：若 fill-content 与 daily-briefing 共用较多逻辑（如 mixdao API 封装、Anthropic/MiniMax 调用），可考虑抽成 `skills/_shared/` 或独立 npm 包，减少重复维护。

---

以上建议按需采纳，优先完成文档与 .env.example 即可明显提升可读性与上手速度。
