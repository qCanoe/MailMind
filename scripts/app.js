/* ============================================================
   MailMind — Outlook 风格邮箱前端原型
   app.js: Mock 数据 + 状态管理 + 渲染层
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   SECTION 1: MOCK DATA
   mailData, threadData, personData, taskData 由 mail-data.js 提供
   需在 index.html 中先引入 mail-data.js
   ────────────────────────────────────────────────────────────── */


/* ──────────────────────────────────────────────────────────────
   SECTION 2: APPLICATION STATE
   以下四个变量是未来扩展搜索、筛选、标签等功能的核心入口
   ────────────────────────────────────────────────────────────── */
const state = {
  activeFolder:   'inbox',      // 当前激活的文件夹
  selectedMailId: null,         // 当前选中的邮件 ID
  searchQuery:    '',           // 搜索关键词
  activeTab:      'all',        // 邮件列表 Tab：'all' | 'unread' | 'flagged'
  aiMode:         false,        // true = 当前展示 AI 语义搜索结果
  aiResults:      [],           // [{ mail, score|reason }, ...] AI 搜索结果集
  aiAnswer:       '',           // LLM 对用户查询的直接自然语言回答
  aiSearchType:   'none',       // 'none' | 'llm' | 'vector' | 'keyword'
};

/* ──────────────────────────────────────────────────────────────
   SECTION 3: UTILITIES
   ────────────────────────────────────────────────────────────── */

/**
 * 根据发送时间返回人性化的时间字符串
 * 今天显示 HH:mm，昨天显示"昨天"，本周显示星期几，更早显示日期
 */
function formatDate(date) {
  const now  = new Date();
  const diff = now - date;
  const oneDay  = 86400000;
  const oneWeek = 604800000;

  const pad = n => String(n).padStart(2, '0');

  if (diff < oneDay && now.getDate() === date.getDate()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) return '昨天';
  if (diff < oneWeek) {
    return ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()];
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 将颜色字符串转为头像背景色（直接用数据中预设的 color 字段）
 */
function getAvatarInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * 安全的文本高亮替换（只操作文本节点，避免 XSS）
 */
function highlightText(container, query) {
  if (!query) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const nodes  = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  nodes.forEach(n => {
    if (!re.test(n.textContent)) return;
    const frag = document.createDocumentFragment();
    n.textContent.split(re).forEach((part, i) => {
      if (i % 2 === 1) {
        const mark = document.createElement('mark');
        mark.className = 'highlight';
        mark.textContent = part;
        frag.appendChild(mark);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    });
    n.parentNode.replaceChild(frag, n);
  });
}

/* ──────────────────────────────────────────────────────────────
   SECTION 4: FILTERING
   ────────────────────────────────────────────────────────────── */

/** AI 优先级文件夹的 folder key 集合 */
const AI_PRIORITY_FOLDERS = new Set(['ai-high', 'ai-medium', 'ai-low']);

/** folder key → 优先级等级映射 */
const AI_FOLDER_LEVEL = { 'ai-high': 'high', 'ai-medium': 'medium', 'ai-low': 'low' };

/**
 * 根据当前 state 过滤邮件列表
 * 这是搜索和筛选功能未来的统一入口
 */
function getFilteredMails() {
  // AI 搜索模式：直接返回预计算的全局结果集，跳过文件夹/tab 过滤
  if (state.aiMode && state.aiResults.length) {
    return state.aiResults.map(r => r.mail);
  }

  let mails;

  if (AI_PRIORITY_FOLDERS.has(state.activeFolder)) {
    // AI 优先级虚拟文件夹：通过分类引擎获取
    const level = AI_FOLDER_LEVEL[state.activeFolder];
    mails = typeof getMailsByPriority === 'function'
      ? getMailsByPriority(level)
      : [];
  } else if (state.activeFolder === 'starred') {
    // "已加星标"是跨文件夹的虚拟视图
    mails = mailData.filter(m => m.starred);
  } else {
    mails = mailData.filter(m => m.folder === state.activeFolder);
  }

  // Tab 筛选（AI 优先级文件夹也支持 unread/flagged 筛选）
  if (state.activeTab === 'unread')  mails = mails.filter(m => m.unread);
  if (state.activeTab === 'flagged') mails = mails.filter(m => m.flagged || m.starred);

  // 搜索关键词过滤（主题 + 发件人 + 摘要内容）
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    mails = mails.filter(m =>
      m.subject.toLowerCase().includes(q) ||
      m.from.name.toLowerCase().includes(q) ||
      m.from.email.toLowerCase().includes(q) ||
      m.preview.toLowerCase().includes(q)
    );
  }

  // AI 优先级文件夹已在 getMailsByPriority() 内排序；其余按时间倒序
  if (!AI_PRIORITY_FOLDERS.has(state.activeFolder)) {
    mails.sort((a, b) => b.date - a.date);
  }

  return mails;
}

function getMailItemMarkup(mail) {
  const hasIcons = mail.starred || mail.attachments.length > 0;

  // AI 搜索模式：显示 LLM 推理说明 或 向量相似度百分比
  let aiHintHtml = '';
  if (state.aiMode) {
    const result = state.aiResults.find(r => r.mail.id === mail.id);
    if (result) {
      if (state.aiSearchType === 'llm' && result.reason) {
        aiHintHtml = '';
      } else if (result.score !== undefined) {
        const pct = Math.round(result.score * 100);
        aiHintHtml = `<span class="relevance-badge">${pct}%</span>`;
      }
    }
  }

  // LLM 模式：在 preview 下方显示推理说明
  let reasonHtml = '';
  if (state.aiMode && state.aiSearchType === 'llm') {
    const result = state.aiResults.find(r => r.mail.id === mail.id);
    if (result && result.reason) {
      reasonHtml = `<div class="mail-ai-reason">${escapeHtml(result.reason)}</div>`;
    }
  }

  // AI 优先级文件夹：显示分类理由
  let priorityBadgeHtml = '';
  let priorityReasonHtml = '';
  if (AI_PRIORITY_FOLDERS.has(state.activeFolder) && typeof getMailPriority === 'function') {
    const p = getMailPriority(mail.id);
    if (p) {
      priorityReasonHtml = `<div class="mail-priority-reason">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        ${escapeHtml(p.reason)}
      </div>`;
    }
  }

  return `
      <div class="mail-item-top">
        <span class="mail-sender">${escapeHtml(mail.from.name)}</span>
        <div class="mail-top-right">
          ${hasIcons ? `
            <div class="mail-item-icons">
              ${mail.starred ? `<svg class="mail-flag-icon" width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M6.5 1.5l1.2 3.7h3.8L8.4 7.4l1.2 3.7-3.1-2.3L3.4 11l1.2-3.7L1.5 5.2h3.8L6.5 1.5z"/></svg>` : ''}
              ${mail.attachments.length ? `<svg class="mail-attach-icon" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 5L6 9a2.8 2.8 0 01-4-4l4.5-4.5a1.8 1.8 0 012.5 2.5L4.5 8.5a.8.8 0 01-1.1-1.1l4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>` : ''}
            </div>
          ` : ''}
          ${aiHintHtml || `<span class="mail-time">${formatDate(mail.date)}</span>`}
        </div>
      </div>
      <div class="mail-subject">${escapeHtml(mail.subject)}</div>
      <div class="mail-preview">${escapeHtml(mail.preview)}</div>
      ${priorityReasonHtml}
      ${reasonHtml}
    `;
}

function syncMailListItem(mailId) {
  const mail = mailData.find(m => m.id === mailId);
  const itemEl = document.querySelector(`.mail-item[data-id="${mailId}"]`);

  if (!mail || !itemEl) return;

  itemEl.className = [
    'mail-item',
    mail.unread ? 'unread' : '',
    mail.id === state.selectedMailId ? 'selected' : '',
  ].filter(Boolean).join(' ');
  itemEl.innerHTML = getMailItemMarkup(mail);
}

function syncVisibleSelection(previousSelectedId, nextSelectedId) {
  if (previousSelectedId !== null) {
    syncMailListItem(previousSelectedId);
  }
  if (nextSelectedId !== null && nextSelectedId !== previousSelectedId) {
    syncMailListItem(nextSelectedId);
  }
}

/* ──────────────────────────────────────────────────────────────
   SECTION 5: RENDER — MAIL LIST
   ────────────────────────────────────────────────────────────── */

function renderMailList() {
  const listEl   = document.getElementById('mailList');
  const emptyEl  = document.getElementById('emptyState');
  const mails    = getFilteredMails();

  listEl.innerHTML = '';

  // AI 搜索模式时，在列表顶部插入结果说明横幅
  if (state.aiMode) {
    const modeLabel = state.aiSearchType === 'llm'
      ? 'AI 理解搜索'
      : state.aiSearchType === 'vector'
      ? 'AI 语义搜索'
      : '关键词搜索';
    const header = document.createElement('li');
    header.className = 'mail-list-ai-header';
    header.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      ${modeLabel} · ${mails.length} 条结果，跨所有文件夹
    `;
    listEl.appendChild(header);
  }

  // AI 优先级文件夹：在列表顶部插入分类说明横幅
  if (AI_PRIORITY_FOLDERS.has(state.activeFolder)) {
    const level = AI_FOLDER_LEVEL[state.activeFolder];
    const levelLabels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' };
    const levelDescs  = {
      high:   'Emails with deadlines, action items, or urgent signals detected by AI',
      medium: 'Work and personal emails that need attention but have no immediate deadline',
      low:    'Notifications, subscriptions, and automated emails',
    };
    const header = document.createElement('li');
    header.className = `mail-list-ai-header mail-list-ai-header--priority mail-list-ai-header--${level}`;
    header.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <span><strong>${levelLabels[level]}</strong> · ${mails.length} 封邮件 &nbsp;<span class="ai-header-desc">${levelDescs[level]}</span></span>
    `;
    listEl.appendChild(header);
  }

  if (mails.length === 0) {
    emptyEl.style.display = 'flex';
    return;
  }
  emptyEl.style.display = 'none';

  mails.forEach((mail, index) => {
    const li = document.createElement('li');
    li.className = [
      'mail-item',
      mail.unread   ? 'unread'   : '',
      mail.id === state.selectedMailId ? 'selected' : '',
    ].filter(Boolean).join(' ');
    li.dataset.id = mail.id;
    li.style.animationDelay = `${index * 0.05}s`;
    li.innerHTML = getMailItemMarkup(mail);

    li.addEventListener('click', () => selectMail(mail.id));
    listEl.appendChild(li);
  });

  // 普通模式高亮搜索词；AI 模式不做文字高亮（避免与相关度徽章冲突）
  if (!state.aiMode && state.searchQuery.trim()) {
    highlightText(listEl, state.searchQuery.trim());
  }
}

/* ──────────────────────────────────────────────────────────────
   SECTION 6: RENDER — READING PANE
   ────────────────────────────────────────────────────────────── */

function renderReadingPane(mail) {
  const emptyEl   = document.getElementById('readingEmpty');
  const contentEl = document.getElementById('readingContent');

  if (!mail) {
    emptyEl.style.display  = 'flex';
    contentEl.style.display = 'none';
    return;
  }

  emptyEl.style.display  = 'none';
  contentEl.style.display = 'flex';

  // Subject
  document.getElementById('readingSubject').textContent = mail.subject;

  // Tags
  const tagsEl = document.getElementById('readingTags');
  tagsEl.innerHTML = mail.tags.map(t => {
    const labels = { work: '工作', urgent: '紧急', info: '通知', finance: '财务', personal: '个人' };
    return `<span class="tag-chip tag-${t}">${labels[t] || t}</span>`;
  }).join('');

  // Sender avatar
  const avatarEl = document.getElementById('readingSenderAvatar');
  avatarEl.textContent = getAvatarInitials(mail.from.name);
  avatarEl.style.background = mail.from.color;

  // Sender name
  document.getElementById('readingSenderName').textContent =
    `${mail.from.name} <${mail.from.email}>`;

  // Date (full)
  const d = mail.date;
  document.getElementById('readingDate').textContent =
    `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ` +
    `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  // Recipients
  document.getElementById('readingRecipients').textContent = mail.to.join(', ');

  // Attachments
  const attachWrap = document.getElementById('readingAttachments');
  const attachList = document.getElementById('attachmentsList');
  if (mail.attachments.length) {
    attachList.innerHTML = mail.attachments.map(a => `
      <div class="attachment-chip">
        <div class="attachment-icon ${a.type}">${a.type.toUpperCase()}</div>
        <div class="attachment-info">
          <div class="attachment-name">${escapeHtml(a.name)}</div>
          <div class="attachment-size">${a.size}</div>
        </div>
      </div>
    `).join('');
    attachWrap.style.display = 'block';
  } else {
    attachWrap.style.display = 'none';
  }

  // Body
  const bodyEl = document.getElementById('readingBody');
  bodyEl.innerHTML = '';
  mail.body.forEach(block => {
    if (block.type === 'text') {
      const p = document.createElement('p');
      p.textContent = block.content;
      bodyEl.appendChild(p);
    }
  });
  if (mail.signature) {
    const sig = document.createElement('div');
    sig.className = 'signature';
    sig.textContent = mail.signature;
    bodyEl.appendChild(sig);
  }

  // Star button visual state
  const starIcon = document.getElementById('starIcon');
  if (mail.starred) {
    starIcon.setAttribute('fill', '#ffd700');
    starIcon.querySelector('path').setAttribute('stroke', '#e6a800');
  } else {
    starIcon.setAttribute('fill', 'none');
    starIcon.querySelector('path').setAttribute('stroke', 'currentColor');
  }

  // Highlight search terms in reading pane
  if (state.searchQuery.trim()) {
    highlightText(bodyEl, state.searchQuery.trim());
    highlightText(document.getElementById('readingSubject'), state.searchQuery.trim());
  }
}

/* ──────────────────────────────────────────────────────────────
   SECTION 7: RENDER — FOLDER SIDEBAR BADGES
   ────────────────────────────────────────────────────────────── */

function renderBadges() {
  // 标准文件夹徽章（显示未读数）
  ['inbox', 'drafts'].forEach(f => {
    const badgeEl = document.getElementById(`badge-${f}`);
    if (!badgeEl) return;
    const count = mailData.filter(m => m.folder === f && m.unread).length;
    badgeEl.textContent = count;
    badgeEl.style.display = count ? 'flex' : 'none';
  });

  // AI 优先级文件夹徽章（显示每类邮件总数）
  if (typeof getPriorityCounts === 'function') {
    const counts = getPriorityCounts();
    [['high', counts.high], ['medium', counts.medium], ['low', counts.low]].forEach(([level, count]) => {
      const badgeEl = document.getElementById(`badge-ai-${level}`);
      if (!badgeEl) return;
      badgeEl.textContent = count;
      badgeEl.style.display = count ? 'flex' : 'none';
    });
  }
}

/* ──────────────────────────────────────────────────────────────
   SECTION 8: ACTIONS
   ────────────────────────────────────────────────────────────── */

function selectFolder(folderName) {
  state.activeFolder   = folderName;
  state.selectedMailId = null;

  // Update sidebar active item
  document.querySelectorAll('.folder-item').forEach(el => {
    el.classList.toggle('active', el.dataset.folder === folderName);
  });

  // Update folder title
  const titles = {
    inbox:     '收件箱',
    starred:   '已加星标',
    drafts:    '草稿箱',
    sent:      '已发送',
    junk:      '垃圾邮件',
    archive:   '归档',
    deleted:   '已删除',
    'ai-high':   'High Priority',
    'ai-medium': 'Medium Priority',
    'ai-low':    'Low Priority',
  };
  document.getElementById('folderTitle').textContent = titles[folderName] || folderName;

  // AI 文件夹：在标题区域显示 AI 标记
  const titleEl = document.getElementById('folderTitle');
  if (AI_PRIORITY_FOLDERS.has(folderName)) {
    titleEl.classList.add('ai-folder-title');
    titleEl.dataset.level = AI_FOLDER_LEVEL[folderName];
  } else {
    titleEl.classList.remove('ai-folder-title');
    delete titleEl.dataset.level;
  }

  renderMailList();
  renderReadingPane(null);
}

function selectMail(id) {
  const previousSelectedId = state.selectedMailId;
  state.selectedMailId = id;
  const mail = mailData.find(m => m.id === id);
  const wasUnread = Boolean(mail && mail.unread);

  // Mark as read
  if (mail && mail.unread) {
    mail.unread = false;
    renderBadges();
  }

  // 仅在筛选结果会变化时重绘列表，其余情况只同步当前可见项，避免点击时整列刷新
  if (state.activeTab === 'unread' && wasUnread) {
    renderMailList();
  } else {
    syncVisibleSelection(previousSelectedId, id);
  }

  renderReadingPane(mail || null);
}

function toggleStar(mail) {
  mail.starred = !mail.starred;
  renderBadges();

  const mailStillVisible = getFilteredMails().some(item => item.id === mail.id);

  if (!mailStillVisible) {
    state.selectedMailId = null;
    renderMailList();
    renderReadingPane(null);
    return;
  }

  syncMailListItem(mail.id);
  renderReadingPane(mail);
}

/* ──────────────────────────────────────────────────────────────
   SECTION 9: SEARCH
   ────────────────────────────────────────────────────────────── */

/**
 * 更新搜索框下方的 AI 状态提示
 * @param {'idle'|'building'|'searching'|'done'|'error'|'ready'|'no-key'} status
 * @param {number} [count] 结果数量或已完成数量
 * @param {number} [total] 总数量（构建索引时使用）
 */
function setSearchStatus(status, count, total) {
  const el     = document.getElementById('searchAiStatus');
  const textEl = document.getElementById('searchAiStatusText');
  if (!el || !textEl) return;

  switch (status) {
    case 'idle':
      el.style.display = 'none';
      break;
    case 'building':
      el.style.display = 'flex';
      el.dataset.status = 'loading';
      textEl.textContent = count
        ? `正在构建 AI 索引… ${count}/${total}`
        : '正在构建 AI 索引…';
      break;
    case 'searching':
      el.style.display = 'flex';
      el.dataset.status = 'loading';
      textEl.textContent = 'AI 语义搜索中…';
      break;
    case 'done':
      el.style.display = 'flex';
      el.dataset.status = 'done';
      textEl.textContent = `找到 ${count} 条相关邮件`;
      break;
    case 'ready':
      el.style.display = 'none';
      break;
    case 'error':
      el.style.display = 'flex';
      el.dataset.status = 'error';
      textEl.textContent = '⚠ AI 不可用，已降级到关键词搜索';
      break;
    case 'no-key':
      el.style.display = 'none';
      break;
  }
}

async function handleSearch(query) {
  const clearBtn = document.getElementById('searchClear');
  clearBtn.style.display = query ? 'flex' : 'none';

  // 无输入：退出 AI 模式，恢复当前文件夹视图
  if (!query.trim()) {
    state.aiMode      = false;
    state.aiResults   = [];
    state.aiAnswer    = '';
    state.aiSearchType = 'none';
    state.searchQuery  = '';
    setSearchStatus('idle');
    renderAiAnswer(null);
    renderMailList();
    renderReadingPane(null);
    return;
  }

  state.searchQuery    = query;
  state.selectedMailId = null;

  // ── 优先路径：LLM 理解搜索（真正让 AI 读懂邮件）──
  const aiToggleEl = document.getElementById('aiToggle');
  const aiEnabled  = !aiToggleEl || aiToggleEl.checked;

  if (aiEnabled && typeof llmSearch === 'function' &&
      typeof OPENAI_API_KEY !== 'undefined' &&
      OPENAI_API_KEY && !OPENAI_API_KEY.startsWith('sk-your')) {
    setSearchStatus('searching');
    try {
      const { answer, results } = await llmSearch(query);
      state.aiMode       = true;
      state.aiResults    = results;
      state.aiAnswer     = answer;
      state.aiSearchType = 'llm';
      setSearchStatus('done', results.length);
      renderAiAnswer({ answer, query, count: results.length });
      renderMailList();
      renderReadingPane(null);
      return;
    } catch (e) {
      console.warn('[MailMind AI] LLM 搜索失败，尝试向量搜索:', e.message);
    }
  }

  // ── 次选路径：向量语义搜索 ──
  if (aiEnabled && typeof indexReady !== 'undefined' && indexReady) {
    setSearchStatus('searching');
    try {
      const results = await semanticSearch(query);
      state.aiMode       = true;
      state.aiResults    = results;
      state.aiAnswer     = '';
      state.aiSearchType = 'vector';
      setSearchStatus('done', results.length);
      renderAiAnswer(null);
      renderMailList();
      renderReadingPane(null);
      return;
    } catch (e) {
      console.warn('[MailMind AI] 向量搜索失败，降级到关键词搜索:', e.message);
      setSearchStatus('error');
    }
  }

  // ── 兜底：关键词搜索 ──
  state.aiMode       = false;
  state.aiResults    = [];
  state.aiAnswer     = '';
  state.aiSearchType = 'keyword';
  renderAiAnswer(null);
  renderMailList();
  renderReadingPane(null);
}

/**
 * 渲染 AI 答案面板（LLM 搜索时显示在邮件列表上方）
 * @param {{ answer: string, query: string, count: number } | null} data
 */
function renderAiAnswer(data) {
  const panel = document.getElementById('aiAnswerPanel');
  if (!panel) return;

  if (!data || !data.answer) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  const answerTextEl = document.getElementById('aiAnswerText');
  const answerMetaEl = document.getElementById('aiAnswerMeta');
  if (answerTextEl) answerTextEl.textContent = data.answer;
  if (answerMetaEl) answerMetaEl.textContent = `找到 ${data.count} 封相关邮件`;
}

/* ──────────────────────────────────────────────────────────────
   SECTION 10: EVENT LISTENERS
   ────────────────────────────────────────────────────────────── */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function init() {
  /* Folder navigation */
  document.getElementById('folderList').addEventListener('click', e => {
    const item = e.target.closest('.folder-item');
    if (item && item.dataset.folder) selectFolder(item.dataset.folder);
  });

  /* Sidebar toggle */
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  /* Search input (debounced at 600ms to minimize AI API calls) */
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(e.target.value), 600);
  });

  /* Clear search */
  document.getElementById('searchClear').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    handleSearch('');
  });

  /* Tab buttons */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedMailId = null;
      renderMailList();
      renderReadingPane(null);
    });
  });

  /* Star button in reading pane */
  document.getElementById('btnStar').addEventListener('click', () => {
    if (state.selectedMailId === null) return;
    const mail = mailData.find(m => m.id === state.selectedMailId);
    if (mail) toggleStar(mail);
  });

  /* Compose button (placeholder) */
  document.getElementById('composeBtn').addEventListener('click', () => {
    alert('新建邮件（功能占位 — 可在后续版本中扩展）');
  });

  /* AI 开关：切换时立即重新触发搜索 */
  const aiToggle = document.getElementById('aiToggle');
  if (aiToggle) {
    aiToggle.addEventListener('change', () => {
      const q = document.getElementById('searchInput').value;
      if (q.trim()) handleSearch(q);
    });
  }

  /* Keyboard: press Escape to clear search and exit AI mode */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.searchQuery) {
      document.getElementById('searchInput').value = '';
      handleSearch('');
    }
  });

  /* Initial render */
  renderBadges();
  renderMailList();
  renderReadingPane(null);

  /* Auto-select first mail in inbox for better first impression */
  const firstMail = getFilteredMails()[0];
  if (firstMail) selectMail(firstMail.id);

  /* Build AI vector index asynchronously (non-blocking) */
  if (typeof buildVectorIndex === 'function') {
    buildVectorIndex();
  }
}

/* Run on DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
