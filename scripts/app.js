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
  selectedAutomationId: null,   // 当前查看的 automation id
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

/** 判断是否为智能文件夹（folder key 以 "sf-" 开头） */
function isSmartFolder(folderKey) {
  return typeof folderKey === 'string' && folderKey.startsWith('sf-');
}

/** 从 folder key 提取智能文件夹 ID */
function smartFolderIdFromKey(folderKey) {
  return folderKey.replace(/^sf-/, '');
}

/** 判断是否为自动化视图（folder key 以 "auto-" 开头） */
function isAutomationView(folderKey) {
  return typeof folderKey === 'string' && folderKey.startsWith('auto-');
}

/** 从 folder key 提取 automation id */
function automationIdFromKey(folderKey) {
  return folderKey.replace(/^auto-/, '');
}

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
  } else if (isSmartFolder(state.activeFolder)) {
    // 智能文件夹：从分类缓存获取
    const sfId = smartFolderIdFromKey(state.activeFolder);
    mails = typeof getMailsForSmartFolder === 'function'
      ? getMailsForSmartFolder(sfId)
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

  // AI 优先级/智能文件夹已在其各自函数内排序；其余按时间倒序
  const skipSort = AI_PRIORITY_FOLDERS.has(state.activeFolder) ||
                   isSmartFolder(state.activeFolder);
  if (!skipSort) {
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

  // 智能文件夹：在列表顶部插入说明横幅
  if (isSmartFolder(state.activeFolder)) {
    const sfId     = smartFolderIdFromKey(state.activeFolder);
    const sfConfig = typeof loadSmartFolders === 'function'
      ? loadSmartFolders().find(f => f.id === sfId)
      : null;
    if (sfConfig) {
      const header = document.createElement('li');
      header.className = 'mail-list-ai-header mail-list-ai-header--sf';
      header.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <span><strong>${escapeHtml(sfConfig.name)}</strong> · ${mails.length} 封邮件
          <span class="ai-header-desc">${escapeHtml(sfConfig.description)}</span>
        </span>
      `;
      listEl.appendChild(header);
    }
  }

  // AI 优先级文件夹：在列表顶部插入分类说明横幅
  if (AI_PRIORITY_FOLDERS.has(state.activeFolder)) {
    const level = AI_FOLDER_LEVEL[state.activeFolder];
    const levelLabels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' };
    const levelDescs  = {
      high:   '需要及时处理 — 含有截止日期、待办行动、面试邀请或已手动标记的邮件',
      medium: '值得尽快查看 — 工作往来、会议邀请、个人消息等暂无紧迫截止日期的邮件',
      low:    '无需立即回应 — 订阅通知、快递物流、支付回执及各类自动发送的邮件',
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
  const starBtn  = document.getElementById('btnStar');
  if (mail.starred) {
    starIcon.setAttribute('fill', '#ffd700');
    starIcon.querySelector('path').setAttribute('stroke', '#e6a800');
    starBtn && starBtn.classList.add('starred');
  } else {
    starIcon.setAttribute('fill', 'none');
    starIcon.querySelector('path').setAttribute('stroke', 'currentColor');
    starBtn && starBtn.classList.remove('starred');
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

  // AI 优先级文件夹徽章（显示未读邮件数）
  if (typeof getPriorityUnreadCounts === 'function') {
    const counts = getPriorityUnreadCounts();
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

  // 切换至普通文件夹时，恢复邮件列表面板，隐藏自动化详情
  const mailListPanel    = document.getElementById('mailListPanel');
  const readingAutomation = document.getElementById('readingAutomation');

  if (isAutomationView(folderName)) {
    // 显示自动化详情，隐藏邮件列表
    if (mailListPanel)    mailListPanel.style.display    = 'none';
    if (readingAutomation) readingAutomation.style.display = 'flex';
    document.getElementById('readingContent').style.display = 'none';
    document.getElementById('readingEmpty').style.display   = 'none';

    const autoId = automationIdFromKey(folderName);
    state.selectedAutomationId = autoId;

    // Update sidebar active item
    document.querySelectorAll('.folder-item').forEach(el => {
      el.classList.toggle('active', el.dataset.folder === folderName);
    });

    renderAutomationDetail(autoId);
    return;
  }

  // 离开自动化视图时恢复
  if (mailListPanel)    mailListPanel.style.display    = '';
  if (readingAutomation) readingAutomation.style.display = 'none';
  state.selectedAutomationId = null;

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

  let displayTitle = titles[folderName] || folderName;
  if (isSmartFolder(folderName)) {
    const sfId  = smartFolderIdFromKey(folderName);
    const sfCfg = typeof loadSmartFolders === 'function'
      ? loadSmartFolders().find(f => f.id === sfId)
      : null;
    displayTitle = sfCfg ? sfCfg.name : 'Smart Folder';
  }
  document.getElementById('folderTitle').textContent = displayTitle;

  // AI / 智能文件夹：在标题区域显示对应标记
  const titleEl = document.getElementById('folderTitle');
  if (AI_PRIORITY_FOLDERS.has(folderName)) {
    titleEl.classList.add('ai-folder-title');
    titleEl.dataset.level = AI_FOLDER_LEVEL[folderName];
    titleEl.classList.remove('sf-folder-title');
  } else if (isSmartFolder(folderName)) {
    titleEl.classList.add('sf-folder-title');
    titleEl.classList.remove('ai-folder-title');
    delete titleEl.dataset.level;
  } else {
    titleEl.classList.remove('ai-folder-title', 'sf-folder-title');
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
   SECTION 10: SMART FOLDER SIDEBAR + MODAL
   ────────────────────────────────────────────────────────────── */

/**
 * 渲染智能文件夹侧边栏列表项
 * 每次创建/删除/更新文件夹后调用，同时在 init() 时调用一次
 */
function renderSmartFolderSidebar() {
  const folderList = document.getElementById('folderList');
  const emptyHint  = document.getElementById('sfEmptyHint');
  if (!folderList) return;

  // 移除上次渲染的所有智能文件夹 <li> 项
  folderList.querySelectorAll('.sf-folder-item').forEach(el => el.remove());

  const folders = typeof loadSmartFolders === 'function' ? loadSmartFolders() : [];

  if (emptyHint) {
    emptyHint.style.display = folders.length ? 'none' : 'list-item';
  }

  // 在 sfEmptyHint 前（或 sfSectionLabel 后）插入各文件夹项
  const insertBefore = emptyHint || null;

  folders.forEach(folder => {
    const mails       = typeof getMailsForSmartFolder === 'function'
      ? getMailsForSmartFolder(folder.id) : [];
    const unreadCount = mails.filter(m => m.unread).length;
    const folderKey   = `sf-${folder.id}`;

    const li = document.createElement('li');
    li.className   = 'folder-item sf-folder-item sf-section-item';
    li.dataset.folder = folderKey;
    li.innerHTML = `
      <span class="sf-color-dot" style="background:${escapeHtml(folder.color)}"></span>
      <span class="folder-label">${escapeHtml(folder.name)}</span>
      <button class="sf-edit-btn" data-sf-id="${escapeHtml(folder.id)}" title="Edit folder" aria-label="Edit folder">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
      </button>
    `;

    if (state.activeFolder === folderKey) li.classList.add('active');

    // 点击导航（排除点击编辑按钮）
    li.addEventListener('click', e => {
      if (e.target.closest('.sf-edit-btn')) return;
      selectFolder(folderKey);
    });

    // 编辑按钮
    li.querySelector('.sf-edit-btn').addEventListener('click', e => {
      e.stopPropagation();
      openSmartFolderModal('edit', folder);
    });

    if (insertBefore) {
      folderList.insertBefore(li, insertBefore);
    } else {
      folderList.appendChild(li);
    }
  });
}

/* ── Modal 状态 ── */
let _sfModalMode    = 'create'; // 'create' | 'edit'
let _sfEditFolderId = null;     // 编辑模式时的目标 folder.id
let _sfSelectedColor = '#6264a7';

function openSmartFolderModal(mode = 'create', folder = null) {
  const modal      = document.getElementById('sfModal');
  const titleEl    = document.getElementById('sfModalTitle');
  const nameInput  = document.getElementById('sfName');
  const descInput  = document.getElementById('sfDescription');
  const saveBtn    = document.getElementById('sfSaveBtn');
  const deleteBtn  = document.getElementById('sfDeleteBtn');
  if (!modal) return;

  _sfModalMode    = mode;
  _sfEditFolderId = folder ? folder.id : null;

  if (mode === 'edit' && folder) {
    titleEl.textContent   = 'Edit Smart Folder';
    nameInput.value       = folder.name;
    descInput.value       = folder.description;
    saveBtn.textContent   = 'Save Changes';
    deleteBtn.style.display = 'inline-flex';
    _sfSelectedColor = folder.color || '#6264a7';
  } else {
    titleEl.textContent   = 'Create Smart Folder';
    nameInput.value       = '';
    descInput.value       = '';
    saveBtn.textContent   = 'Create Folder';
    deleteBtn.style.display = 'none';
    _sfSelectedColor = '#6264a7';
  }

  // 同步颜色选择器
  document.querySelectorAll('.sf-color-swatch').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === _sfSelectedColor);
  });

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('visible'));
  nameInput.focus();
}

function closeSmartFolderModal() {
  const modal = document.getElementById('sfModal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => { modal.hidden = true; }, 200);
}

/* ── 保存（创建 or 更新） ── */
async function handleSaveSmartFolder() {
  const name  = document.getElementById('sfName')?.value.trim();
  const desc  = document.getElementById('sfDescription')?.value.trim();
  const color = _sfSelectedColor;

  if (!name) {
    document.getElementById('sfName')?.focus();
    return;
  }

  const saveBtn = document.getElementById('sfSaveBtn');
  if (saveBtn) {
    saveBtn.disabled    = true;
    saveBtn.textContent = 'AI classifying…';
  }

  try {
    if (_sfModalMode === 'edit' && _sfEditFolderId) {
      // 更新现有文件夹
      updateSmartFolder(_sfEditFolderId, { name, description: desc, color });
      // 重新分类（先本地，再尝试 LLM）
      const folders   = loadSmartFolders();
      const sfUpdated = folders.find(f => f.id === _sfEditFolderId);
      if (sfUpdated) await classifyMailsForFolder(sfUpdated);
    } else {
      // 创建新文件夹
      const folder = createSmartFolder({ name, description: desc, color });
      await classifyMailsForFolder(folder);
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled    = false;
      saveBtn.textContent = _sfModalMode === 'edit' ? 'Save Changes' : 'Create Folder';
    }
  }

  closeSmartFolderModal();
  renderSmartFolderSidebar();
  renderBadges();

  // 如果当前正在查看被编辑的文件夹，刷新邮件列表
  if (_sfModalMode === 'edit' && state.activeFolder === `sf-${_sfEditFolderId}`) {
    renderMailList();
  }
}

/* ── 删除确认 ── */
function handleDeleteSmartFolder() {
  if (!_sfEditFolderId) return;
  const folders = loadSmartFolders();
  const folder  = folders.find(f => f.id === _sfEditFolderId);
  if (!folder) return;

  if (!confirm(`Delete smart folder "${folder.name}"? This cannot be undone.`)) return;

  deleteSmartFolder(_sfEditFolderId);
  closeSmartFolderModal();

  // 如果当前正在查看被删除的文件夹，跳回收件箱
  if (state.activeFolder === `sf-${_sfEditFolderId}`) {
    selectFolder('inbox');
  }

  renderSmartFolderSidebar();
  renderBadges();
}

/* ──────────────────────────────────────────────────────────────
   SECTION 11: AUTOMATIONS — SIDEBAR + DETAIL + MODAL
   ────────────────────────────────────────────────────────────── */

/**
 * 渲染 Automations 侧边栏列表项
 * 每次创建/删除/更新自动化后调用，init() 时也调用一次
 */
function renderAutomationSidebar() {
  const folderList = document.getElementById('folderList');
  const emptyHint  = document.getElementById('autoEmptyHint');
  if (!folderList) return;

  // 移除上次渲染的所有 automation <li> 项
  folderList.querySelectorAll('.auto-folder-item').forEach(el => el.remove());

  const automations = typeof loadAutomations === 'function' ? loadAutomations() : [];

  if (emptyHint) {
    emptyHint.style.display = automations.length ? 'none' : 'list-item';
  }

  const insertBefore = emptyHint || null;

  automations.forEach(function(auto) {
    const folderKey = 'auto-' + auto.id;
    const li = document.createElement('li');
    li.className = 'folder-item auto-folder-item auto-section-item';
    li.dataset.folder = folderKey;
    li.innerHTML =
      '<span class="auto-status-dot' + (auto.enabled ? '' : ' disabled') + '"></span>' +
      '<span class="folder-label">' + escapeHtml(auto.name) + '</span>' +
      '<button class="auto-edit-btn" data-auto-id="' + escapeHtml(auto.id) + '" title="Edit automation" aria-label="Edit automation">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none">' +
          '<path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
        '</svg>' +
      '</button>';

    if (state.activeFolder === folderKey) li.classList.add('active');

    li.addEventListener('click', function(e) {
      if (e.target.closest('.auto-edit-btn')) return;
      selectFolder(folderKey);
    });

    li.querySelector('.auto-edit-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      openAutomationModal('edit', auto);
    });

    if (insertBefore) {
      folderList.insertBefore(li, insertBefore);
    } else {
      folderList.appendChild(li);
    }
  });
}

/**
 * 渲染 pipeline 步骤卡片到指定容器
 * direction: 'horizontal'（读邮件面板）或 'vertical'（modal 预览）
 */
var AUTO_TYPE_LABELS = { trigger: '触发器', filter: '处理', action: '动作' };

function renderPipelineSteps(steps, containerSelector) {
  var container = typeof containerSelector === 'string'
    ? document.querySelector(containerSelector)
    : containerSelector;
  if (!container) return;
  container.innerHTML = '';

  steps.forEach(function(step, idx) {
    var card = document.createElement('div');
    card.className = 'auto-step-card auto-step-card--' + step.type;
    card.style.animationDelay = (idx * 60) + 'ms';
    var typeLabel = AUTO_TYPE_LABELS[step.type] || step.type;
    card.innerHTML =
      '<span class="auto-step-num">' + (idx + 1) + '</span>' +
      '<div class="auto-step-icon-wrap">' + step.icon + '</div>' +
      '<span class="auto-step-type-label auto-step-type-label--' + step.type + '">' + escapeHtml(typeLabel) + '</span>' +
      '<span class="auto-step-title">' + escapeHtml(step.title) + '</span>' +
      '<span class="auto-step-desc">' + escapeHtml(step.description) + '</span>';
    container.appendChild(card);

    if (idx < steps.length - 1) {
      var arrow = document.createElement('div');
      arrow.className = 'auto-step-arrow';
      arrow.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
          '<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
      container.appendChild(arrow);
    }
  });
}

/**
 * 渲染 Automation 详情到阅读面板
 */
function renderAutomationDetail(autoId) {
  var auto = typeof getAutomationById === 'function' ? getAutomationById(autoId) : null;
  if (!auto) return;

  document.getElementById('autoDetailName').textContent        = auto.name;
  document.getElementById('autoDetailDescription').textContent = auto.description || '';
  document.getElementById('autoDetailToggle').checked          = auto.enabled;
  document.getElementById('autoDetailStatus').textContent      = auto.enabled ? '已启用' : '已停用';

  var created = new Date(auto.createdAt);
  document.getElementById('autoDetailCreated').textContent =
    '创建于 ' + created.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' });

  renderPipelineSteps(auto.steps, '#autoDetailSteps');
}

/* ── Automation Modal 状态 ── */
var _autoModalMode  = 'create'; // 'create' | 'edit'
var _autoEditId     = null;
var _autoPendingKey  = null;   // mock AI 选定的 template key
var _autoPendingName = '';     // mock AI 建议的名称
var _autoPendingDesc = '';     // 用户输入的描述文字

function openAutomationModal(mode, automation) {
  mode = mode || 'create';
  automation = automation || null;

  var modal    = document.getElementById('autoModal');
  var titleEl  = document.getElementById('autoModalTitle');
  var saveBtn  = document.getElementById('autoModalSave');
  var messages = document.getElementById('autoChatMessages');
  var input    = document.getElementById('autoChatInput');
  var preview  = document.getElementById('autoPreviewSteps');
  var empty    = document.getElementById('autoPreviewEmpty');
  if (!modal) return;

  _autoModalMode  = mode;
  _autoEditId     = automation ? automation.id : null;
  _autoPendingKey  = automation ? automation.templateKey : null;
  _autoPendingName = automation ? automation.name : '';
  _autoPendingDesc = automation ? (automation.description || '') : '';

  // 清空聊天区域
  if (messages) messages.innerHTML = '';
  if (input)    input.value = '';
  if (saveBtn)  saveBtn.disabled = (mode === 'create');
  var sendBtnEl = document.getElementById('autoChatSend');
  if (sendBtnEl) sendBtnEl.disabled = true;

  titleEl.textContent = mode === 'edit' ? '编辑自动化' : '新建自动化';

  // 注入欢迎 AI 气泡
  var welcome = mode === 'edit' && automation
    ? '你正在编辑 "<strong>' + escapeHtml(automation.name) + '</strong>"。描述需要修改的地方，或直接点击保存。'
    : '你好！描述一下你希望这个自动化流程做什么。<br><br>例如：<em>"帮我总结长邮件"</em> 或 <em>"当收到紧急邮件时提醒我"</em>。';
  appendChatBubble('ai', welcome);

  // 编辑模式：立即展示已有 pipeline
  if (mode === 'edit' && automation) {
    if (preview) preview.style.display = 'flex';
    if (empty)   empty.style.display   = 'none';
    renderPipelineSteps(automation.steps, '#autoPreviewSteps');
  } else {
    if (preview) preview.style.display = 'none';
    if (empty)   empty.style.display   = 'flex';
  }

  modal.hidden = false;
  requestAnimationFrame(function() { modal.classList.add('visible'); });
  if (input) input.focus();
}

function closeAutomationModal() {
  var modal = document.getElementById('autoModal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(function() { modal.hidden = true; }, 200);
}

function renderMarkdown(text) {
  // Convert **bold** → <strong>, *italic* → <em>, keep existing HTML tags
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
}

function appendChatBubble(role, html) {
  var messages = document.getElementById('autoChatMessages');
  if (!messages) return;
  var bubble = document.createElement('div');
  bubble.className = 'auto-chat-bubble auto-chat-bubble--' + role;
  bubble.innerHTML = renderMarkdown(html);
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

async function handleAutomationSend() {
  var input    = document.getElementById('autoChatInput');
  var sendBtn  = document.getElementById('autoChatSend');
  var typing   = document.getElementById('autoChatTyping');
  var preview  = document.getElementById('autoPreviewSteps');
  var empty    = document.getElementById('autoPreviewEmpty');
  var saveBtn  = document.getElementById('autoModalSave');
  if (!input) return;

  var text = input.value.trim();
  if (!text) return;

  // 显示用户气泡
  appendChatBubble('user', escapeHtml(text));
  input.value = '';
  if (sendBtn) sendBtn.disabled = true;

  // 显示 typing 指示器
  if (typing) typing.style.display = 'flex';
  var messagesEl = document.getElementById('autoChatMessages');
  if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    var result = await mockAiProcess(text);
    _autoPendingKey  = result.templateKey;
    _autoPendingName = result.suggestedName;
    _autoPendingDesc = text;

    // 隐藏 typing，显示 AI 回复
    if (typing) typing.style.display = 'none';
    appendChatBubble('ai', result.template.aiReply);

    // 展示 pipeline 预览
    if (preview) preview.style.display = 'flex';
    if (empty)   empty.style.display   = 'none';
    renderPipelineSteps(result.template.steps, '#autoPreviewSteps');

    // 启用保存按钮
    if (saveBtn) saveBtn.disabled = false;
  } catch (err) {
    if (typing) typing.style.display = 'none';
    appendChatBubble('ai', '抱歉，出了点问题，请重新描述一下。');
  }

  if (sendBtn) sendBtn.disabled = false;
}

function handleSaveAutomation() {
  if (!_autoPendingKey && _autoModalMode === 'create') return;

  var name = _autoPendingName || (
    _autoModalMode === 'edit' && _autoEditId
      ? (getAutomationById(_autoEditId) || {}).name || 'My Automation'
      : 'My Automation'
  );

  if (_autoModalMode === 'edit' && _autoEditId) {
    var template = AUTOMATION_TEMPLATES[_autoPendingKey];
    var patch = { name: name };
    if (template) {
      patch.templateKey = template.key;
      patch.steps = template.steps;
    }
    var updated = updateAutomation(_autoEditId, patch);
    // 若当前正在查看该 automation，刷新详情
    if (state.selectedAutomationId === _autoEditId && updated) {
      renderAutomationDetail(_autoEditId);
    }
  } else {
    createAutomation({
      name: name,
      description: _autoPendingDesc,
      templateKey: _autoPendingKey || 'default',
    });
  }

  closeAutomationModal();
  renderAutomationSidebar();
}

function handleDeleteAutomation() {
  var autoId = _autoEditId || state.selectedAutomationId;
  if (!autoId) return;
  var auto = getAutomationById(autoId);
  var label = auto ? auto.name : 'this automation';
  if (!confirm('Delete "' + label + '"? This cannot be undone.')) return;

  deleteAutomation(autoId);
  closeAutomationModal();

  // 若当前正在查看该 automation，跳回收件箱
  if (state.activeFolder === 'auto-' + autoId) {
    selectFolder('inbox');
  }
  renderAutomationSidebar();
}

/* ──────────────────────────────────────────────────────────────
   SECTION 12: EVENT LISTENERS
   ────────────────────────────────────────────────────────────── */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function init() {
  /* Folder navigation（智能文件夹项已在 renderSmartFolderSidebar 内单独绑定） */
  document.getElementById('folderList').addEventListener('click', e => {
    const item = e.target.closest('.folder-item');
    if (item && item.dataset.folder &&
        !item.classList.contains('sf-folder-item') &&
        !item.classList.contains('auto-folder-item')) {
      selectFolder(item.dataset.folder);
    }
  });

  /* Sidebar toggle */
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  /* Smart Priority 折叠/展开 */
  const aiSectionLabel = document.getElementById('aiSectionLabel');
  if (aiSectionLabel) {
    const toggleAiSection = () => {
      const expanded = aiSectionLabel.getAttribute('aria-expanded') === 'true';
      aiSectionLabel.setAttribute('aria-expanded', String(!expanded));
      document.querySelectorAll('.ai-priority-item').forEach(el => {
        el.classList.toggle('collapsed', expanded);
      });
    };
    aiSectionLabel.addEventListener('click', toggleAiSection);
    aiSectionLabel.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAiSection(); }
    });
  }

  /* 智能文件夹区块折叠/展开 */
  const sfSectionLabel = document.getElementById('sfSectionLabel');
  if (sfSectionLabel) {
    const toggleSfSection = e => {
      if (e.target && e.target.closest('.sf-add-btn')) return;
      const expanded = sfSectionLabel.getAttribute('aria-expanded') === 'true';
      sfSectionLabel.setAttribute('aria-expanded', String(!expanded));
      document.querySelectorAll('.sf-section-item').forEach(el => {
        el.classList.toggle('collapsed', expanded);
      });
    };
    sfSectionLabel.addEventListener('click', toggleSfSection);
    sfSectionLabel.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSfSection(e); }
    });
  }

  /* 创建智能文件夹按钮 */
  const createSfBtn = document.getElementById('createSmartFolderBtn');
  if (createSfBtn) {
    createSfBtn.addEventListener('click', e => {
      e.stopPropagation();
      openSmartFolderModal('create');
    });
  }

  /* Modal — 取消 / 关闭 */
  document.getElementById('sfCancelBtn')?.addEventListener('click', closeSmartFolderModal);
  document.getElementById('sfModalClose')?.addEventListener('click', closeSmartFolderModal);
  document.getElementById('sfModalBackdrop')?.addEventListener('click', closeSmartFolderModal);

  /* Modal — 保存 */
  document.getElementById('sfSaveBtn')?.addEventListener('click', handleSaveSmartFolder);

  /* Modal — 删除 */
  document.getElementById('sfDeleteBtn')?.addEventListener('click', handleDeleteSmartFolder);

  /* Modal — 颜色选择器 */
  document.getElementById('sfColorSwatches')?.addEventListener('click', e => {
    const swatch = e.target.closest('.sf-color-swatch');
    if (!swatch) return;
    _sfSelectedColor = swatch.dataset.color;
    document.querySelectorAll('.sf-color-swatch').forEach(s => {
      s.classList.toggle('selected', s === swatch);
    });
  });

  /* Modal — Enter 快捷键保存，Escape 关闭 */
  document.getElementById('sfModal')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'sfName') handleSaveSmartFolder();
    if (e.key === 'Escape') closeSmartFolderModal();
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

  /* Automations 区块折叠/展开 */
  var autoSectionLabel = document.getElementById('autoSectionLabel');
  if (autoSectionLabel) {
    autoSectionLabel.addEventListener('click', function(e) {
      if (e.target.closest('.sf-add-btn')) return;
      var expanded = autoSectionLabel.getAttribute('aria-expanded') === 'true';
      autoSectionLabel.setAttribute('aria-expanded', String(!expanded));
      document.querySelectorAll('.auto-section-item').forEach(function(el) {
        el.classList.toggle('collapsed', expanded);
      });
    });
  }

  /* 创建自动化按钮 */
  var createAutoBtn = document.getElementById('createAutomationBtn');
  if (createAutoBtn) {
    createAutoBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      openAutomationModal('create');
    });
  }

  /* Automation Modal — 关闭/取消 */
  document.getElementById('autoModalClose')?.addEventListener('click', closeAutomationModal);
  document.getElementById('autoModalBackdrop')?.addEventListener('click', closeAutomationModal);
  document.getElementById('autoModalCancel')?.addEventListener('click', closeAutomationModal);

  /* Automation Modal — 输入时更新发送按钮状态 */
  var _autoChatInputEl = document.getElementById('autoChatInput');
  var _autoChatSendEl  = document.getElementById('autoChatSend');
  if (_autoChatInputEl && _autoChatSendEl) {
    _autoChatSendEl.disabled = true;
    _autoChatInputEl.addEventListener('input', function() {
      _autoChatSendEl.disabled = !_autoChatInputEl.value.trim();
    });
  }

  /* Automation Modal — 发送 */
  document.getElementById('autoChatSend')?.addEventListener('click', handleAutomationSend);
  document.getElementById('autoChatInput')?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAutomationSend();
    }
  });

  /* Automation Modal — 保存 */
  document.getElementById('autoModalSave')?.addEventListener('click', handleSaveAutomation);

  /* Automation Modal — Escape 关闭 */
  document.getElementById('autoModal')?.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAutomationModal();
  });

  /* Automation 详情 — 启用/禁用切换 */
  document.getElementById('autoDetailToggle')?.addEventListener('change', function() {
    if (!state.selectedAutomationId) return;
    var enabled = this.checked;
    updateAutomation(state.selectedAutomationId, { enabled: enabled });
    document.getElementById('autoDetailStatus').textContent = enabled ? 'Enabled' : 'Disabled';
    // 更新侧边栏状态点颜色
    var dot = document.querySelector('[data-folder="auto-' + state.selectedAutomationId + '"] .auto-status-dot');
    if (dot) dot.classList.toggle('disabled', !enabled);
  });

  /* Automation 详情 — 编辑 */
  document.getElementById('btnAutoEdit')?.addEventListener('click', function() {
    if (!state.selectedAutomationId) return;
    var auto = getAutomationById(state.selectedAutomationId);
    if (auto) openAutomationModal('edit', auto);
  });

  /* Automation 详情 — 删除 */
  document.getElementById('btnAutoDelete')?.addEventListener('click', function() {
    if (!state.selectedAutomationId) return;
    _autoEditId = state.selectedAutomationId;
    handleDeleteAutomation();
  });

  /* Initial render */
  renderSmartFolderSidebar();
  renderAutomationSidebar();
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
