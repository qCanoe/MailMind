/* ============================================================
   MailMind — AI Search Module
   ai-search.js: 语义搜索核心模块
   依赖：config.js（需先引入）、app.js 中的 mailData
   ============================================================ */

'use strict';

/* ── 内存向量索引：{ [mailId]: number[] } ── */
const vectorIndex = {};
let indexReady = false;

/* ──────────────────────────────────────────────────────────────
   1. 余弦相似度（纯 JS，零依赖）
   ────────────────────────────────────────────────────────────── */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* ──────────────────────────────────────────────────────────────
   2. 调用 OpenAI Embeddings API
   ────────────────────────────────────────────────────────────── */
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error ${response.status}: ${err?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding; // number[]
}

/* ──────────────────────────────────────────────────────────────
   3. 将邮件对象序列化为 embedding 输入文本
   ────────────────────────────────────────────────────────────── */
function mailToText(mail) {
  const bodyText = mail.body
    .map(b => b.content)
    .join('\n')
    .slice(0, 1200); // 控制 token 用量
  return `Subject: ${mail.subject}\nFrom: ${mail.from.name}\n${bodyText}`;
}

/* ──────────────────────────────────────────────────────────────
   4. 构建向量索引（直接读取预生成的硬编码向量，零 API 调用）
   ────────────────────────────────────────────────────────────── */
async function buildVectorIndex() {
  /* 优先使用预生成的硬编码向量（scripts/embeddings.js） */
  if (typeof MAIL_EMBEDDINGS !== 'undefined' && Object.keys(MAIL_EMBEDDINGS).length > 0) {
    Object.assign(vectorIndex, MAIL_EMBEDDINGS);
    indexReady = true;
    setSearchStatus('ready');
    console.log('[MailMind AI] 向量索引已从预生成文件加载，共', Object.keys(vectorIndex).length, '封邮件。');
    return;
  }

  /* 回退：embeddings.js 不存在时，检查 API Key 并实时生成 */
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-your')) {
    console.warn('[MailMind AI] API Key 未配置，且预生成向量文件不存在，AI 搜索不可用。');
    console.warn('[MailMind AI] 请运行 `node scripts/generate-embeddings.js` 生成向量文件。');
    setSearchStatus('no-key');
    return;
  }

  /* 尝试从 sessionStorage 读取缓存 */
  try {
    const cached = sessionStorage.getItem('mm_embeddings');
    if (cached) {
      const parsed = JSON.parse(cached);
      Object.assign(vectorIndex, parsed);
      indexReady = true;
      setSearchStatus('ready');
      console.log('[MailMind AI] 向量索引已从 sessionStorage 缓存恢复，共', Object.keys(vectorIndex).length, '封邮件。');
      return;
    }
  } catch (e) {
    console.warn('[MailMind AI] 缓存读取失败，重新构建索引。', e);
  }

  /* 实时生成（最慢路径，仅在无预生成文件且无缓存时触发） */
  console.log('[MailMind AI] 开始实时构建向量索引，共', mailData.length, '封邮件…');
  setSearchStatus('building');

  let built = 0;
  for (const mail of mailData) {
    try {
      const text   = mailToText(mail);
      const vector = await generateEmbedding(text);
      vectorIndex[mail.id] = vector;
      built++;

      if (built % 10 === 0) {
        setSearchStatus('building', built, mailData.length);
      }
    } catch (e) {
      console.warn(`[MailMind AI] 邮件 ${mail.id} embedding 生成失败:`, e.message);
    }
  }

  try {
    sessionStorage.setItem('mm_embeddings', JSON.stringify(vectorIndex));
  } catch (e) {
    console.warn('[MailMind AI] 缓存写入失败:', e);
  }

  indexReady = true;
  setSearchStatus('ready');
  console.log('[MailMind AI] 实时向量索引构建完成，共', built, '封邮件。');
}

/* ──────────────────────────────────────────────────────────────
   5. 语义搜索主函数
   ────────────────────────────────────────────────────────────── */
async function semanticSearch(query, topK = 8) {
  if (!indexReady) {
    throw new Error('向量索引尚未就绪，请稍候再搜索。');
  }

  /* 生成查询向量 */
  const queryVector = await generateEmbedding(query);

  /* 计算所有邮件的余弦相似度 */
  const scored = mailData
    .filter(mail => vectorIndex[mail.id])
    .map(mail => ({
      mail,
      score: cosineSimilarity(queryVector, vectorIndex[mail.id]),
    }));

  /* 按相似度降序排列，过滤低分，取 topK */
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter(r => r.score >= 0.35)
    .slice(0, topK);
}
