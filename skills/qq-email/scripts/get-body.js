import Imap from 'imap';
import { simpleParser } from 'mailparser';

const account = process.env.QQ_EMAIL_ACCOUNT;
const authCode = process.env.QQ_EMAIL_AUTH_CODE;

if (!account || !authCode) {
  console.error('请设置环境变量 QQ_EMAIL_ACCOUNT 和 QQ_EMAIL_AUTH_CODE');
  process.exit(1);
}

const imapConfig = {
  user: account,
  password: authCode,
  host: 'imap.qq.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 10;
  let days = null;
  let index = 1;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = Math.max(1, parseInt(args[i + 1], 10) || 10);
      i++;
    } else if (args[i] === '--days' && args[i + 1]) {
      days = Math.max(1, parseInt(args[i + 1], 10) || 7);
      i++;
    } else if ((args[i] === '--index' || args[i] === '-n') && args[i + 1]) {
      index = Math.max(1, parseInt(args[i + 1], 10) || 1);
      i++;
    }
  }
  return { limit, days, index };
}

function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

/** 从 HTML 中粗略提取纯文本 */
function htmlToText(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

function getBodyText(parsed) {
  const text = parsed.text?.trim();
  if (text) return text;
  const html = parsed.html;
  if (html) return htmlToText(html);
  return '';
}

async function fetchEmails(limit, sinceDate) {
  const imap = new Imap(imapConfig);

  return new Promise((resolve, reject) => {
    const emails = [];

    imap.once('ready', () => {
      openInbox(imap)
        .then(() => {
          const searchCriteria = sinceDate ? [['SINCE', sinceDate]] : ['ALL'];
          imap.search(searchCriteria, (err, uids) => {
            if (err) {
              imap.end();
              return reject(err);
            }
            if (uids.length === 0) {
              imap.end();
              return resolve(emails);
            }
            const slice = uids.slice(-limit);
            const fetch = imap.fetch(slice, { bodies: '' });
            const parsePromises = [];

            fetch.on('message', (msg) => {
              let resolveP;
              parsePromises.push(new Promise((r) => { resolveP = r; }));
              msg.on('body', (stream) => {
                simpleParser(stream, (parseErr, parsed) => {
                  if (!parseErr) emails.push(parsed);
                  resolveP();
                });
              });
            });
            fetch.once('error', (e) => {
              imap.end();
              reject(e);
            });
            fetch.once('end', () => {
              Promise.all(parsePromises).then(() => imap.end());
            });
          });
        })
        .catch((e) => {
          imap.end();
          reject(e);
        });
    });

    imap.once('error', reject);
    imap.once('end', () => resolve(emails));
    imap.connect();
  });
}

async function main() {
  const { limit, days, index } = parseArgs();
  let sinceDate = null;
  if (days) {
    sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
  }

  try {
    const emails = await fetchEmails(limit, sinceDate);
    if (emails.length === 0) {
      console.error('暂无邮件');
      process.exit(1);
    }
    // 按日期倒序，1 = 最新一封
    emails.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
    const oneBased = Math.max(1, Math.min(index, emails.length));
    const email = emails[oneBased - 1];
    const body = getBodyText(email);
    if (!body) {
      console.error('该邮件无正文内容');
      process.exit(1);
    }
    process.stdout.write(body);
  } catch (err) {
    console.error('获取正文失败:', err.message);
    process.exit(1);
  }
}

main();
