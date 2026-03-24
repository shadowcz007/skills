# solo-topics 操作流程总结

## 一、列出专题

```bash
node scripts/solo-topics.js topics
```

返回所有专题的 `id`、`label`、`description`。

## 二、查看专题文章

```bash
node scripts/solo-topics.js articles <TOPIC_ID>
```

返回该专题下所有文章的 `title`、`url`、`date`、`summary`。

## 三、往专题投稿

```bash
node scripts/solo-topics.js add <TOPIC_ID> <文件.md|->
```

- 脚本从 Markdown 文件自动提取 `title`、`content`、`date`、`summary` 等字段。
- 文件路径相对于当前工作目录（非脚本目录）。
- 成功返回文章 `id`，失败原样说明原因。

---

## 本次操作完整步骤

1. 确认环境变量：`MIXDAO_API_KEY` 已配置。
2. 确认专题 ID（从 `topics` 命令获取）。
3. 生成简报 Markdown（本地临时文件）。
4. 并行上传到各专题（`add` 命令支持同时执行多个）。
5. 清理临时文件。

## 关键约定

- `topics` 输出只展示 `id + label`，不默认贴 `keywords/reportPrompt`。
- `articles` 输出展示 `title + url + date`，必要时带 `summary`。
- 列表为空时需说明。
- `add` 仅为 POST 创建，不支持按 ID 更新或删除。