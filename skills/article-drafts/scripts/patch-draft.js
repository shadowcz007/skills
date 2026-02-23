#!/usr/bin/env node

/**
 * Article Drafts: 批量创建/更新初稿（仅支持批量，以文件路径为入参）
 * PATCH https://www.mixdao.world/api/article-drafts
 * Body: { date, items: [{ slug, title, content?, url? }, ...] }
 * 每条：从文件路径读正文，文件名（不含扩展名）作为 title，slug 由 title+content 的 hash 计算
 *
 * 用法:
 *   node scripts/patch-draft.js [--date YYYY-MM-DD] <文件路径1> <文件路径2> ...
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://www.mixdao.world';
const DATE_TZ = 'Asia/Shanghai';

function getTodayDateStr() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: DATE_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

function slugFromTitleAndContent(title, content) {
    const str = (title || '') + (content || '');
    const hash = crypto.createHash('sha256').update(str, 'utf8').digest('hex');
    return `article-${hash.slice(0, 12)}`;
}

/** 从文件路径得到 title：basename 去掉扩展名 */
function titleFromPath(filePath) {
    const base = path.basename(filePath);
    const ext = path.extname(base);
    return ext ? base.slice(0, -ext.length) : base;
}

/** 将一条「文件路径」转为 API 用的 item：{ slug, title, content?, url? } */
function pathToItem(itemPath, cwd) {
    const resolved = path.resolve(cwd, itemPath);
    if (!fs.existsSync(resolved)) {
        throw new Error(`文件不存在: ${resolved}`);
    }
    const content = fs.readFileSync(resolved, 'utf8');
    const title = titleFromPath(itemPath);
    const slug = slugFromTitleAndContent(title, content);
    const payload = { slug, title };
    if (content) payload.content = content;
    return payload;
}

function parseArgs() {
    const args = process.argv.slice(2);
    const out = { date: null, paths: [] };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--date' && args[i + 1] != null) {
            out.date = args[++i];
        } else if (!args[i].startsWith('--')) {
            out.paths.push(args[i]);
        }
    }
    return out;
}

function buildBatchBody(opts) {
    const cwd = process.cwd();
    const date = opts.date || getTodayDateStr();
    if (opts.paths.length === 0) return null;
    const items = opts.paths.map((p) => pathToItem(p, cwd));
    return { date, items };
}

function patchDraft(body) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.MIXDAO_API_KEY;
        if (!apiKey) {
            reject(new Error('MIXDAO_API_KEY is not set.'));
            return;
        }
        const url = new URL(`${API_BASE}/api/article-drafts`);
        const payload = JSON.stringify(body);
        const opts = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload, 'utf8'),
            },
        };
        const req = https.request(opts, (res) => {
            res.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('PATCH 请求超时'));
            });
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const data = Buffer.concat(chunks).toString('utf8');
                if (res.statusCode >= 300) {
                    reject(new Error(`PATCH 返回 ${res.statusCode}: ${data.slice(0, 300)}`));
                    return;
                }
                try {
                    resolve(data ? JSON.parse(data) : {});
                } catch {
                    resolve({ raw: data });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function main() {
    let opts;
    try {
        opts = parseArgs();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
    let body;
    try {
        body = buildBatchBody(opts);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
    if (!body) {
        console.error('用法: node scripts/patch-draft.js [--date YYYY-MM-DD] <文件路径1> <文件路径2> ...');
        process.exit(1);
    }
    patchDraft(body)
        .then((result) => {
            console.log(JSON.stringify(result, null, 2));
        })
        .catch((err) => {
            console.error('Error:', err.message);
            process.exit(1);
        });
}

main();
