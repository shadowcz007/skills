#!/usr/bin/env node
/**
 * Markdown 字符串 → 完整 HTML 文档字符串（文艺复兴主题样式，与项目 themes.ts 对齐）
 * 用法:
 *   echo '# 标题' | node scripts/md_to_renaissance_html.mjs
 *   node scripts/md_to_renaissance_html.mjs --input ./article.md
 *   node scripts/md_to_renaissance_html.mjs --input ./article.md --title '我的文章'
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');
const CSS_PATH = path.join(SKILL_ROOT, 'assets', 'renaissance.css');

function parseArgs(argv) {
  let inputPath = null;
  let title = 'Document';
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' && argv[i + 1]) {
      inputPath = argv[++i];
    } else if (a === '--title' && argv[i + 1]) {
      title = argv[++i];
    } else if (a === '--help' || a === '-h') {
      console.error(`Usage:
  stdin:  cat file.md | node scripts/md_to_renaissance_html.mjs [--title "标题"]
  file:   node scripts/md_to_renaissance_html.mjs --input file.md [--title "标题"]`);
      process.exit(0);
    }
  }
  return { inputPath, title };
}

function readMarkdown({ inputPath }) {
  if (inputPath) {
    return fs.readFileSync(path.resolve(inputPath), 'utf8');
  }
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function escapeHtmlText(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDocument(markdown, title) {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  marked.setOptions({
    gfm: true,
    breaks: false,
  });
  const bodyHtml = marked.parse(markdown);
  const safeTitle = escapeHtmlText(title);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
${css}
  </style>
</head>
<body>
  <article class="wmr-renaissance">
${bodyHtml}
  </article>
</body>
</html>
`;
}

const args = parseArgs(process.argv);
const md = readMarkdown(args);
if (!md.trim()) {
  console.error('renaissance-md-html: 未收到 Markdown（请通过 stdin 或 --input 传入）');
  process.exit(1);
}
process.stdout.write(buildDocument(md, args.title));
