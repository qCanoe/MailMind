#!/usr/bin/env node
/* ============================================================
   generate-embeddings.js
   一次性脚本：为所有 mailData 生成 embedding 向量，
   输出硬编码文件 scripts/embeddings.js。

   运行方式：
     node scripts/generate-embeddings.js

   依赖：Node.js 18+（内置 fetch）。
   需要先在 scripts/config.js 里填写有效的 OPENAI_API_KEY，
   或在运行时设置环境变量 OPENAI_API_KEY=sk-xxx
   ============================================================ */

'use strict';

const fs   = require('fs');
const path = require('path');

/* ── 读取 API Key ── */
let OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

if (!OPENAI_API_KEY) {
  // 尝试从 config.js 提取（简单正则，不做完整 JS 解析）
  try {
    const configPath = path.join(__dirname, 'config.js');
    const raw = fs.readFileSync(configPath, 'utf8');
    const match = raw.match(/OPENAI_API_KEY\s*=\s*['"`]([^'"`]+)['"`]/);
    if (match && match[1] && !match[1].startsWith('sk-your')) {
      OPENAI_API_KEY = match[1];
    }
  } catch (_) {}
}

if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-your')) {
  console.error('❌ 未找到有效的 OPENAI_API_KEY。');
  console.error('   请在 scripts/config.js 中填写你的 Key，或设置环境变量：');
  console.error('   OPENAI_API_KEY=sk-xxx node scripts/generate-embeddings.js');
  process.exit(1);
}

/* ── 从 app.js 提取 mailData ──
   通过 VM 沙箱执行 app.js 中 mailData 的定义部分，避免依赖 DOM。 */
const vm   = require('vm');
const appPath = path.join(__dirname, 'app.js');
const appSrc  = fs.readFileSync(appPath, 'utf8');

/* 提取 mailData 数组（截到 ]; 结束） */
const mailDataMatch = appSrc.match(/const mailData\s*=\s*(\[[\s\S]*?\n\];)/);
if (!mailDataMatch) {
  console.error('❌ 无法从 app.js 中提取 mailData，请检查文件格式。');
  process.exit(1);
}

let mailData;
try {
  const sandbox = { mailData: null };
  vm.runInNewContext(`mailData = ${mailDataMatch[1]}`, sandbox);
  mailData = sandbox.mailData;
} catch (e) {
  console.error('❌ mailData 解析失败:', e.message);
  process.exit(1);
}

console.log(`✅ 已加载 ${mailData.length} 封邮件。`);

/* ── 工具函数 ── */
function mailToText(mail) {
  const bodyText = mail.body
    .map(b => b.content)
    .join('\n')
    .slice(0, 1200);
  return `Subject: ${mail.subject}\nFrom: ${mail.from.name}\n${bodyText}`;
}

async function generateEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`API ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

/* ── 主流程 ── */
async function main() {
  const results = {};
  const total   = mailData.length;

  console.log(`\n开始生成 embedding（模型: text-embedding-3-large）…\n`);

  for (let i = 0; i < total; i++) {
    const mail = mailData[i];
    const text = mailToText(mail);

    process.stdout.write(`  [${String(i + 1).padStart(2)}/${total}] id=${mail.id} "${mail.subject.slice(0, 40)}"… `);

    try {
      results[mail.id] = await generateEmbedding(text);
      process.stdout.write('✓\n');
    } catch (e) {
      process.stdout.write(`✗ (${e.message})\n`);
    }

    /* 每 10 条暂停 200ms，避免触发速率限制 */
    if ((i + 1) % 10 === 0 && i + 1 < total) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const successCount = Object.keys(results).length;
  console.log(`\n完成：${successCount}/${total} 封邮件生成成功。`);

  if (successCount === 0) {
    console.error('❌ 没有成功生成任何 embedding，请检查 API Key 和网络。');
    process.exit(1);
  }

  /* ── 输出 scripts/embeddings.js ── */
  const outPath = path.join(__dirname, 'embeddings.js');
  const json    = JSON.stringify(results, null, 0);

  const output = `/* ============================================================
   scripts/embeddings.js — AUTO-GENERATED, DO NOT EDIT MANUALLY
   Generated: ${new Date().toISOString()}
   Model: text-embedding-3-large (dim 3072)
   Emails: ${successCount}/${total}
   Run \`node scripts/generate-embeddings.js\` to regenerate.
   ============================================================ */

const MAIL_EMBEDDINGS = ${json};
`;

  fs.writeFileSync(outPath, output, 'utf8');

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ 已写入 scripts/embeddings.js（${sizeMB} MB）`);
  console.log('   下一步：刷新浏览器，AI 搜索将直接使用预构建向量，无需再调用 API。\n');
}

main().catch(e => {
  console.error('\n❌ 未预期错误:', e);
  process.exit(1);
});
