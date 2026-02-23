#!/usr/bin/env node

/**
 * Article Drafts: 获取初稿列表
 * GET https://www.mixdao.world/api/article-drafts
 * 无参数：最新日期的初稿列表
 * 有参数：指定日期 YYYY-MM-DD 的初稿列表
 *
 * 用法:
 *   node scripts/list-drafts.js
 *   node scripts/list-drafts.js 2026-02-15
 */

import https from 'https';

const API_BASE = 'https://www.mixdao.world';

function getDrafts(date) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.MIXDAO_API_KEY;
        if (!apiKey) {
            reject(new Error('MIXDAO_API_KEY is not set.'));
            return;
        }
        const url = new URL(`${API_BASE}/api/article-drafts`);
        if (date) url.searchParams.set('date', date);
        const opts = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}` },
        };
        const req = https.request(opts, (res) => {
            res.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('GET 请求超时'));
            });
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const data = Buffer.concat(chunks).toString('utf8');
                if (res.statusCode !== 200) {
                    reject(new Error(`GET 返回 ${res.statusCode}: ${data.slice(0, 300)}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error('接口返回非 JSON: ' + data.slice(0, 100)));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function main() {
    const dateArg = process.argv[2] || null;
    getDrafts(dateArg || undefined)
        .then((result) => {
            console.log(JSON.stringify(result, null, 2));
        })
        .catch((err) => {
            console.error('Error:', err.message);
            process.exit(1);
        });
}

main();
