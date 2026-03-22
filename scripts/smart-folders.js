/* ============================================================
   MailMind — 智能文件夹引擎
   smart-folders.js: CRUD 管理 + AI 分类（LLM 降级到本地关键词匹配）
   由 index.html 引入，需在 mail-data.js、config.js 之后、app.js 之前加载
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   SECTION 1: 存储键
   ────────────────────────────────────────────────────────────── */

const SF_STORAGE_KEY  = 'mailmind_smart_folders';
const SF_CACHE_PREFIX = 'mailmind_sf_cache_';

/* ──────────────────────────────────────────────────────────────
   SECTION 2: CRUD 管理
   ────────────────────────────────────────────────────────────── */

/**
 * 从 localStorage 读取所有智能文件夹配置
 * @returns {{ id, name, description, color, createdAt }[]}
 */
function loadSmartFolders() {
  try {
    return JSON.parse(localStorage.getItem(SF_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/** 将文件夹配置列表写入 localStorage */
function saveSmartFolders(folders) {
  localStorage.setItem(SF_STORAGE_KEY, JSON.stringify(folders));
}

/**
 * 创建智能文件夹（仅写入配置，不自动触发分类）
 * 分类由调用方显式调用 classifyMailsForFolder() 完成
 * @returns {{ id, name, description, color, createdAt }}
 */
function createSmartFolder({ name, description, color = '#6264a7' }) {
  const folders = loadSmartFolders();
  const id = `sf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const folder = {
    id,
    name: name.trim(),
    description: description.trim(),
    color,
    createdAt: new Date().toISOString(),
  };
  folders.push(folder);
  saveSmartFolders(folders);
  return folder;
}

/**
 * 更新智能文件夹配置（仅写入，不触发分类）
 * @returns {Object|null} 更新后的文件夹对象，不存在时返回 null
 */
function updateSmartFolder(id, { name, description, color }) {
  const folders = loadSmartFolders();
  const idx = folders.findIndex(f => f.id === id);
  if (idx === -1) return null;
  if (name        !== undefined) folders[idx].name        = name.trim();
  if (description !== undefined) folders[idx].description = description.trim();
  if (color       !== undefined) folders[idx].color       = color;
  saveSmartFolders(folders);
  return folders[idx];
}

/**
 * 删除智能文件夹及其分类缓存
 */
function deleteSmartFolder(id) {
  const folders = loadSmartFolders();
  saveSmartFolders(folders.filter(f => f.id !== id));
  localStorage.removeItem(SF_CACHE_PREFIX + id);
}

/* ──────────────────────────────────────────────────────────────
   SECTION 3: 分类缓存读写
   ────────────────────────────────────────────────────────────── */

function loadFolderCache(folderId) {
  try {
    return JSON.parse(localStorage.getItem(SF_CACHE_PREFIX + folderId) || '[]');
  } catch {
    return [];
  }
}

function saveFolderCache(folderId, mailIds) {
  localStorage.setItem(SF_CACHE_PREFIX + folderId, JSON.stringify(mailIds));
}

/* ──────────────────────────────────────────────────────────────
   SECTION 4: 本地关键词分类引擎
   ────────────────────────────────────────────────────────────── */

/** 中英文通用停用词 */
const SF_STOP_WORDS = new Set([
  '的','了','是','在','我','有','和','就','不','人','都','一','上','也',
  '很','到','说','要','去','你','会','着','没有','看','好','这','那',
  '些','个','中','为','对','与','等','以','于','把','被','由','从',
  'a','an','the','is','are','was','were','be','been','have','has',
  'do','does','did','will','would','could','should','may','might',
  'this','that','these','those','i','you','he','she','it','we','they',
  'and','or','but','if','for','nor','in','on','at','by','from','to',
  'of','with','about','into','through','during','before','after',
]);

/**
 * 从文本中提取有意义的关键词（去停用词 + 去短词）
 * @param {string} text
 * @returns {string[]}
 */
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !SF_STOP_WORDS.has(w));
}

/**
 * 语义字段映射：将常见描述词映射到邮件的结构化字段
 * 用于提升本地分类的准确率
 */
const SF_FIELD_SHORTCUTS = {
  '工作': m => m.category === 'work'     || (m.tags || []).includes('work'),
  'work': m => m.category === 'work'     || (m.tags || []).includes('work'),
  '财务': m => m.category === 'finance'  || (m.tags || []).includes('finance'),
  '金融': m => m.category === 'finance'  || (m.tags || []).includes('finance'),
  'finance': m => m.category === 'finance' || (m.tags || []).includes('finance'),
  '紧急': m => (m.tags || []).includes('urgent'),
  'urgent': m => (m.tags || []).includes('urgent'),
  '个人': m => m.category === 'personal' || (m.tags || []).includes('personal'),
  'personal': m => m.category === 'personal',
  '通知': m => m.category === 'notification' || (m.tags || []).includes('info'),
  'notification': m => m.category === 'notification',
  '垃圾': m => m.category === 'spam' || m.folder === 'junk',
  '未读': m => m.unread === true,
  '已标记': m => m.flagged === true,
  '星标': m => m.starred === true,
};

/**
 * 对单封邮件打分，返回 0–1 的相关度分数
 */
function _localScoreMail(mail, keywords) {
  if (!keywords.length) return 0;

  const fields = [
    mail.subject.toLowerCase(),
    mail.preview.toLowerCase(),
    (mail.tags || []).join(' ').toLowerCase(),
    (mail.category || '').toLowerCase(),
    mail.from.name.toLowerCase(),
    mail.from.email.toLowerCase(),
  ].join(' ');

  let hits = 0;

  for (const kw of keywords) {
    // 优先用结构化字段映射
    if (SF_FIELD_SHORTCUTS[kw] && SF_FIELD_SHORTCUTS[kw](mail)) {
      hits += 2; // 结构化命中权重加倍
      continue;
    }
    // 文本关键词匹配
    if (fields.includes(kw)) hits++;
  }

  return hits / keywords.length;
}

/**
 * 本地批量分类：返回匹配的邮件 ID 列表
 */
function _localClassify(folder, mails) {
  const keywords = extractKeywords(folder.name + ' ' + folder.description);
  if (!keywords.length) return [];

  // 阈值：至少 10% 的关键词命中（最低 1 个）
  const THRESHOLD = Math.max(0.10, 1 / keywords.length);

  return mails
    .filter(m => _localScoreMail(m, keywords) >= THRESHOLD)
    .map(m => m.id);
}

/* ──────────────────────────────────────────────────────────────
   SECTION 5: LLM 分类引擎
   ────────────────────────────────────────────────────────────── */

/**
 * 使用 GPT 批量分类：返回匹配的邮件 ID 列表
 * 失败时抛出异常，由调用方降级处理
 */
async function _llmClassifyFolder(folder, mails) {
  const apiKey = typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : '';
  if (!apiKey || apiKey.startsWith('sk-your')) throw new Error('no-key');

  const summaries = mails.map(m => ({
    id:       m.id,
    subject:  m.subject,
    from:     m.from.name,
    preview:  m.preview.slice(0, 120),
    tags:     m.tags,
    category: m.category,
  }));

  const systemPrompt =
    `你是一个邮件分类助手。用户创建了一个名为"${folder.name}"的智能文件夹，` +
    `描述如下：\n${folder.description}\n\n` +
    `请从以下邮件列表中挑选出符合该文件夹定义的邮件，` +
    `返回一个 JSON 整数数组（邮件 id 列表），格式示例：[1, 5, 12]。` +
    `不要包含任何额外文字，只返回 JSON 数组。`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: JSON.stringify(summaries) },
      ],
      temperature: 0.1,
      max_tokens:  256,
    }),
  });

  if (!response.ok) throw new Error(`API ${response.status}`);
  const data    = await response.json();
  const content = data.choices?.[0]?.message?.content || '[]';

  const match = content.match(/\[[\d,\s]*\]/);
  if (!match) return [];

  const ids = JSON.parse(match[0]);
  return Array.isArray(ids) ? ids.filter(id => typeof id === 'number') : [];
}

/* ──────────────────────────────────────────────────────────────
   SECTION 6: 主分类函数（降级策略）
   ────────────────────────────────────────────────────────────── */

/**
 * 对指定智能文件夹执行分类，结果写入 localStorage 缓存
 * 优先使用 LLM，失败时降级到本地关键词匹配
 * @param {Object} folder
 * @returns {Promise<number[]>} 匹配的邮件 ID 列表
 */
async function classifyMailsForFolder(folder) {
  const allMails = typeof mailData !== 'undefined' ? mailData : [];
  // 只对收件箱、归档、垃圾邮件分类；草稿/已发送/已删除不纳入
  const targetMails = allMails.filter(
    m => !['sent', 'drafts', 'deleted'].includes(m.folder)
  );

  let matchedIds = [];
  const apiKey   = typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : '';
  const hasKey   = apiKey && !apiKey.startsWith('sk-your');

  if (hasKey) {
    try {
      matchedIds = await _llmClassifyFolder(folder, targetMails);
      console.log(
        `[MailMind SF] LLM 分类完成: "${folder.name}"，命中 ${matchedIds.length} 封`
      );
    } catch (e) {
      console.warn('[MailMind SF] LLM 分类失败，降级到本地关键词匹配:', e.message);
      matchedIds = _localClassify(folder, targetMails);
      console.log(
        `[MailMind SF] 本地分类完成: "${folder.name}"，命中 ${matchedIds.length} 封`
      );
    }
  } else {
    matchedIds = _localClassify(folder, targetMails);
    console.log(
      `[MailMind SF] 本地分类完成: "${folder.name}"，命中 ${matchedIds.length} 封`
    );
  }

  saveFolderCache(folder.id, matchedIds);
  return matchedIds;
}

/* ──────────────────────────────────────────────────────────────
   SECTION 7: 查询 API
   ────────────────────────────────────────────────────────────── */

/**
 * 获取指定智能文件夹的邮件列表（从缓存读取，按时间倒序）
 */
function getMailsForSmartFolder(folderId) {
  const matchedIds = new Set(loadFolderCache(folderId));
  if (!matchedIds.size) return [];
  return (typeof mailData !== 'undefined' ? mailData : [])
    .filter(m => matchedIds.has(m.id))
    .sort((a, b) => b.date - a.date);
}

/**
 * 获取每个智能文件夹的未读邮件数量（用于侧边栏徽章）
 * @returns {{ [folderId: string]: number }}
 */
function getSmartFolderUnreadCounts() {
  const folders = loadSmartFolders();
  const counts  = {};
  for (const folder of folders) {
    const mails = getMailsForSmartFolder(folder.id);
    counts[folder.id] = mails.filter(m => m.unread).length;
  }
  return counts;
}

/* ──────────────────────────────────────────────────────────────
   SECTION 8: 初始化
   ────────────────────────────────────────────────────────────── */

/**
 * 初始化：对尚无缓存的文件夹执行一次本地分类（同步，无 API 调用）
 */
function initSmartFolders() {
  const folders  = loadSmartFolders();
  const allMails = typeof mailData !== 'undefined' ? mailData : [];
  const targets  = allMails.filter(
    m => !['sent', 'drafts', 'deleted'].includes(m.folder)
  );

  for (const folder of folders) {
    const cached = loadFolderCache(folder.id);
    if (!cached.length && folder.description) {
      const ids = _localClassify(folder, targets);
      saveFolderCache(folder.id, ids);
    }
  }

  if (folders.length) {
    console.log(`[MailMind SF] 初始化完成，共 ${folders.length} 个智能文件夹`);
  }
}

initSmartFolders();
