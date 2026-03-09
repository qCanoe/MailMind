/* ============================================================
   MailMind — AI Search Module
   ai-search.js: 语义搜索 + LLM 理解搜索核心模块
   依赖：config.js、mail-data.js（需先引入）、app.js
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
   5. 语义搜索（向量相似度）
   ────────────────────────────────────────────────────────────── */
async function semanticSearch(query, topK = 8) {
  if (!indexReady) {
    throw new Error('向量索引尚未就绪，请稍候再搜索。');
  }

  const queryVector = await generateEmbedding(query);

  const scored = mailData
    .filter(mail => vectorIndex[mail.id])
    .map(mail => ({
      mail,
      score: cosineSimilarity(queryVector, vectorIndex[mail.id]),
    }));

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter(r => r.score >= 0.35)
    .slice(0, topK);
}

/* ──────────────────────────────────────────────────────────────
   6. LLM 理解搜索：让模型真正阅读并理解邮件内容
      - 将所有邮件的结构化摘要发给 GPT
      - GPT 理解用户意图，返回相关邮件 ID + 自然语言解释 + 直接回答
   ────────────────────────────────────────────────────────────── */

/**
 * 将邮件序列化为 LLM 可读的紧凑文本摘要
 * 控制 token 用量：每封邮件约 60-80 tokens
 */
function mailToLLMSummary(mail) {
  const date = mail.date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  const bodySnippet = mail.body.map(b => b.content).join(' ').slice(0, 200);
  return {
    id:      mail.id,
    from:    mail.from.name,
    subject: mail.subject,
    date:    date,
    tags:    mail.tags.join(','),
    body:    bodySnippet,
    folder:  mail.folder,
  };
}

/**
 * 调用 OpenAI Chat Completions API，让 LLM 理解搜索意图
 * @param {string} query 用户的自然语言查询
 * @returns {{ answer: string, results: Array<{id: number, reason: string}> }}
 */
async function llmSearch(query) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-your')) {
    throw new Error('API Key 未配置');
  }

  // 构建邮件摘要列表（控制总 token 在 3000 以内）
  const summaries = mailData.map(mailToLLMSummary);
  const emailsJson = JSON.stringify(summaries, null, 0);

  const systemPrompt = `你是 MailMind 的智能邮件搜索助手。你能真正理解邮件内容、用户意图和上下文关系。

你的任务：
1. 深度理解用户的搜索意图（不只是关键词，要理解需求背后的目的）
2. 仔细阅读每封邮件的内容，判断哪些与查询相关
3. 给出简洁的自然语言回答（直接回应用户问题）
4. 为每封相关邮件提供一句中文说明，解释为何相关

返回格式（严格遵守 JSON）：
{
  "answer": "对用户问题的直接自然语言回答（1-3句，中文）",
  "results": [
    { "id": 邮件ID数字, "reason": "这封邮件相关是因为..." }
  ]
}

注意：
- results 只包含真正相关的邮件，不相关的不要包含
- results 按相关度从高到低排列
- answer 要像人类助手一样直接回答，而不只是列出邮件
- 如果用户问的是问题（如"我有哪些截止日期"），先直接回答这个问题
- 邮件数量建议：相关性强的保留，宁可少不要滥`;

  const userPrompt = `用户查询：${query}

邮件数据：
${emailsJson}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model:           'gpt-5.4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      response_format:      { type: 'json_object' },
      temperature:          0.3,
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error ${response.status}: ${err?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('LLM 返回格式解析失败');
  }

  // 标准化：将 LLM 结果与实际 mailData 对应
  const results = (parsed.results || [])
    .map(r => {
      const mail = mailData.find(m => m.id === r.id);
      if (!mail) return null;
      return { mail, reason: r.reason || '', score: 1.0 };
    })
    .filter(Boolean);

  return {
    answer:  parsed.answer || '',
    results,
  };
}
