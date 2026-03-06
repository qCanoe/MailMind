/* ============================================================
   MailMind — Outlook 风格邮箱前端原型
   app.js: Mock 数据 + 状态管理 + 渲染层
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   SECTION 1: MOCK DATA
   后续可将此数组替换为 fetch() 调用 / localStorage 存储
   ────────────────────────────────────────────────────────────── */
const mailData = [
  /* ── 收件箱 ── */
  {
    id: 1,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: 'Prof. Zhang Wei', email: 'zhangwei@university.edu', color: '#0078d4' },
    to: ['you@mailmind.app'],
    subject: '【提醒】课程 Project 第一阶段截止日期',
    preview: '同学，请注意课程项目第一阶段的 Demo 展示将在本周五进行，请确保你的原型已经完成基础功能……',
    body: [
      { type: 'text', content: '同学，' },
      { type: 'text', content: '这封邮件提醒你，课程项目第一阶段的 Demo 展示将在本周五（3月8日）14:00–17:00 进行，地点为工程楼 B-201。' },
      { type: 'text', content: '请确保你的原型已经完成以下基础功能：\n• 静态界面搭建完成\n• 至少包含 Mock 数据展示\n• 能够演示 1–2 个核心交互' },
      { type: 'text', content: '如有问题请在周三前来 Office Hours 提前沟通。' },
    ],
    signature: 'Zhang Wei\n计算机科学与技术系\nuniversity.edu',
    attachments: [],
    date: new Date('2026-03-06T09:14:00'),
    tags: ['urgent', 'work'],
  },
  {
    id: 2,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: 'GitHub', email: 'noreply@github.com', color: '#24292f' },
    to: ['you@mailmind.app'],
    subject: '[mailmind] Pull request #3 opened by alice-dev',
    preview: 'alice-dev opened a pull request: "feat: add email search with fuzzy matching" — 9 files changed +412 −28',
    body: [
      { type: 'text', content: 'alice-dev opened a pull request in your repository mailmind.' },
      { type: 'text', content: 'Pull Request: feat: add email search with fuzzy matching\n\nThis PR adds a client-side fuzzy search feature that filters emails in real-time as the user types. Changed files:\n• scripts/search.js (new)\n• scripts/app.js\n• styles/search.css (new)\n• index.html\n• ... and 5 more' },
    ],
    signature: 'You received this email because you are subscribed to GitHub notifications.\nManage your notifications at github.com',
    attachments: [],
    date: new Date('2026-03-06T08:47:00'),
    tags: ['work'],
  },
  {
    id: 3,
    folder: 'inbox',
    unread: true,
    flagged: true,
    starred: true,
    from: { name: '李明 (TA)', email: 'liming-ta@university.edu', color: '#107c10' },
    to: ['you@mailmind.app'],
    subject: '关于你的 MailMind 项目的反馈',
    preview: '我看了你昨天提交的设计稿，整体思路很清晰。有几点建议想和你分享……',
    body: [
      { type: 'text', content: '同学，' },
      { type: 'text', content: '我看了你昨天提交的 MailMind 设计稿，整体思路很清晰，Outlook 的三栏布局选得也合适。有几点建议想和你分享：' },
      { type: 'text', content: '1. 搜索功能：建议除了关键字匹配之外，可以考虑加一个"发件人"和"日期范围"的高级筛选，这样在演示的时候会更有说服力。\n2. 邮件分类：可以引入标签系统，让用户能给邮件打上自定义标签（比如"工作"、"重要"），这和你的"整理"功能方向很契合。\n3. 界面密度：目前列表项间距偏大，可以参考 Outlook Web 的 compact view，把密度调高一些，显得更专业。' },
      { type: 'text', content: '总体来说进展不错，继续加油！' },
    ],
    signature: '李明\nCS 课程助教\nuniversity.edu',
    attachments: [
      { name: 'design-feedback.docx', size: '48 KB', type: 'docx' },
    ],
    date: new Date('2026-03-05T17:32:00'),
    tags: ['work', 'urgent'],
  },
  {
    id: 4,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Notion', email: 'notify@mail.notion.so', color: '#000000' },
    to: ['you@mailmind.app'],
    subject: 'Your weekly summary is ready',
    preview: 'You have 12 pages updated, 3 tasks completed, and 2 new comments since last week. Here is your weekly digest.',
    body: [
      { type: 'text', content: 'Here is your Notion weekly summary for the week of March 2–6, 2026.' },
      { type: 'text', content: 'Activity this week:\n• 12 pages updated or created\n• 3 tasks marked as done\n• 2 new comments from teammates\n• 1 database with 8 new entries' },
      { type: 'text', content: 'Most active workspace: MailMind Project (4 pages updated)' },
    ],
    signature: 'Notion\nUnsubscribe | Manage email preferences',
    attachments: [],
    date: new Date('2026-03-05T07:00:00'),
    tags: ['info'],
  },
  {
    id: 5,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Microsoft Teams', email: 'noreply@email.teams.microsoft.com', color: '#464eb8' },
    to: ['you@mailmind.app'],
    subject: '你有一条未读消息 — #project-mailmind 频道',
    preview: 'alice-dev: "@你 我已经把新版搜索的 PR 推上去了，你有时间 review 一下吗？" — 昨天 16:24',
    body: [
      { type: 'text', content: '你在 project-mailmind 频道中有 1 条未读消息。' },
      { type: 'text', content: 'alice-dev（昨天 16:24）：\n"@你 我已经把新版搜索的 PR 推上去了，你有时间 review 一下吗？加了 fuzzy matching，覆盖了主题和发件人的联合搜索。"' },
    ],
    signature: 'Microsoft Teams\n你收到此邮件是因为你开启了频道通知。',
    attachments: [],
    date: new Date('2026-03-04T16:30:00'),
    tags: ['work'],
  },
  {
    id: 6,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Figma', email: 'no-reply@figma.com', color: '#ff7262' },
    to: ['you@mailmind.app'],
    subject: 'alice-dev shared a file with you in Figma',
    preview: '"MailMind UI Kit v2" — alice-dev shared this file with you. You can now view and comment.',
    body: [
      { type: 'text', content: 'alice-dev shared a design file with you.' },
      { type: 'text', content: 'File: MailMind UI Kit v2\nPermission: Can view and comment\n\nThis file contains the updated component library for the MailMind prototype, including the revised search bar and email list item variants.' },
    ],
    signature: 'Figma\nManage notifications at figma.com/settings',
    attachments: [],
    date: new Date('2026-03-03T11:05:00'),
    tags: ['work'],
  },
  {
    id: 7,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '招商银行信用卡', email: 'service@cmbchina.com', color: '#c50a2e' },
    to: ['you@mailmind.app'],
    subject: '您的信用卡 3月账单已出账',
    preview: '您尾号 6888 的信用卡本期账单金额为 ¥ 1,234.56，最晚还款日为 3月25日，请及时还款以避免产生利息……',
    body: [
      { type: 'text', content: '尊敬的客户，' },
      { type: 'text', content: '您尾号 6888 的招商银行信用卡 3月账单已出账，详情如下：\n\n本期账单金额：¥ 1,234.56\n最低还款额：¥ 123.46\n账单日：2026年3月5日\n最晚还款日：2026年3月25日' },
      { type: 'text', content: '请登录招行 App 或网上银行查看详细账单并进行还款。如已还款请忽略此邮件。' },
    ],
    signature: '招商银行信用卡中心\n客服热线：400-820-5555',
    attachments: [
      { name: '账单明细_202603.pdf', size: '156 KB', type: 'pdf' },
    ],
    date: new Date('2026-03-05T06:20:00'),
    tags: ['finance'],
  },
  {
    id: 8,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Stack Overflow', email: 'noreply@stackoverflow.com', color: '#f48024' },
    to: ['you@mailmind.app'],
    subject: 'New answer on your question: "How to highlight search terms in innerHTML safely?"',
    preview: 'A new answer has been posted by user@example.com: "You should use a DocumentFragment or text node replacer instead of innerHTML manipulation to avoid XSS…"',
    body: [
      { type: 'text', content: 'A new answer has been posted to your question:' },
      { type: 'text', content: '"How to highlight search terms in innerHTML safely?"\n\nAnswer by devuser_42:\n"You should use a DocumentFragment or text node replacer instead of innerHTML manipulation to avoid XSS vulnerabilities. Here is a utility function that walks the DOM tree and wraps matching text nodes in <mark> elements..."' },
      { type: 'text', content: 'View the full answer and vote at stackoverflow.com' },
    ],
    signature: 'Stack Overflow\nYou are receiving this because you subscribed to answer notifications.',
    attachments: [],
    date: new Date('2026-03-04T22:11:00'),
    tags: ['info'],
  },

  /* ── 草稿箱 ── */
  {
    id: 101,
    folder: 'drafts',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '（草稿）', email: 'you@mailmind.app', color: '#8a8886' },
    to: ['zhangwei@university.edu'],
    subject: 'Re: 【提醒】课程 Project 第一阶段截止日期',
    preview: '张老师，您好，感谢提醒。我的原型目前已经完成了静态界面部分，计划在本周四完成基础交互……',
    body: [
      { type: 'text', content: '张老师，您好，' },
      { type: 'text', content: '感谢您的提醒。我的原型目前已经完成了静态界面部分，计划在本周四前完成基础的点击交互和搜索过滤功能。' },
      { type: 'text', content: '如果时间允许，周三 Office Hours 我会去向您汇报一下当前进展。' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-06T10:05:00'),
    tags: ['work'],
  },
  {
    id: 102,
    folder: 'drafts',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '（草稿）', email: 'you@mailmind.app', color: '#8a8886' },
    to: ['alice-dev@example.com'],
    subject: 'Re: PR #3 — 需要确认几个设计问题',
    preview: 'Alice，PR 我看了，思路挺好的。有几个地方想和你确认……',
    body: [
      { type: 'text', content: 'Alice，' },
      { type: 'text', content: 'PR 我看了，fuzzy matching 的方向挺好的。有几个地方想和你确认：\n1. 搜索结果高亮是否对中文字符做了特殊处理？\n2. 防抖（debounce）延迟设的是多少？' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-05T20:48:00'),
    tags: ['work'],
  },

  /* ── 已发送 ── */
  {
    id: 201,
    folder: 'sent',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'You', email: 'you@mailmind.app', color: '#c43e00' },
    to: ['liming-ta@university.edu'],
    subject: '课程项目进展汇报 — MailMind Week 1',
    preview: '李助教，您好，附上我第一周的项目进展报告，包括界面截图和下周计划……',
    body: [
      { type: 'text', content: '李助教，您好，' },
      { type: 'text', content: '附上我第一周的项目进展报告。本周主要完成了：\n• Outlook 风格三栏界面原型（纯 HTML/CSS/JS）\n• Mock 邮件数据结构设计\n• 基础的文件夹切换交互' },
      { type: 'text', content: '下周计划实现搜索功能和邮件标签系统，请您指导。' },
    ],
    signature: 'YS\nyou@mailmind.app',
    attachments: [
      { name: 'week1-report.pdf', size: '220 KB', type: 'pdf' },
      { name: 'screenshots.zip', size: '1.2 MB', type: 'zip' },
    ],
    date: new Date('2026-03-04T19:30:00'),
    tags: ['work'],
  },

  /* ── 垃圾邮件 ── */
  {
    id: 301,
    folder: 'junk',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Win a Prize!!!', email: 'promo@spam-example.net', color: '#8a8886' },
    to: ['you@mailmind.app'],
    subject: 'Congratulations! You have been selected — Claim your $1000 gift card',
    preview: 'You have been exclusively selected to receive a $1000 Amazon gift card. Click here to claim within 24 hours…',
    body: [
      { type: 'text', content: 'Congratulations! You have been exclusively selected to receive a $1,000 Amazon gift card.' },
      { type: 'text', content: 'Click the link below to claim your prize within 24 hours. This offer expires soon!' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-03T02:19:00'),
    tags: [],
  },

  /* ── 归档 ── */
  {
    id: 401,
    folder: 'archive',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Prof. Zhang Wei', email: 'zhangwei@university.edu', color: '#0078d4' },
    to: ['you@mailmind.app'],
    subject: '【课程通知】MailMind 项目说明书已发布',
    preview: '同学们，本学期 HCI 课程项目说明书已经发布，请在学校 LMS 系统下载，项目题目可在以下三个方向中选择……',
    body: [
      { type: 'text', content: '同学们，' },
      { type: 'text', content: '本学期 HCI 课程项目说明书已经发布，请在学校 LMS 系统下载。项目题目可在以下三个方向中选择：\n1. 邮箱界面改进与智能整理\n2. 任务管理工具原型设计\n3. 自选题目（需提前申请）' },
    ],
    signature: 'Zhang Wei\n计算机科学与技术系',
    attachments: [
      { name: 'HCI-project-brief.pdf', size: '380 KB', type: 'pdf' },
    ],
    date: new Date('2026-02-20T10:00:00'),
    tags: ['work'],
  },
];

/* ──────────────────────────────────────────────────────────────
   SECTION 2: APPLICATION STATE
   以下四个变量是未来扩展搜索、筛选、标签等功能的核心入口
   ────────────────────────────────────────────────────────────── */
const state = {
  activeFolder:   'inbox',      // 当前激活的文件夹
  selectedMailId: null,         // 当前选中的邮件 ID
  searchQuery:    '',           // 搜索关键词
  activeTab:      'all',        // 邮件列表 Tab：'all' | 'unread' | 'flagged'
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

/**
 * 根据当前 state 过滤邮件列表
 * 这是搜索和筛选功能未来的统一入口
 */
function getFilteredMails() {
  // "已加星标"是跨文件夹的虚拟视图，按 starred 属性筛选；其余按 folder 字段筛选
  let mails = state.activeFolder === 'starred'
    ? mailData.filter(m => m.starred)
    : mailData.filter(m => m.folder === state.activeFolder);

  // Tab 筛选
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

  // 默认按时间倒序
  mails.sort((a, b) => b.date - a.date);
  return mails;
}

function getMailItemMarkup(mail) {
  const hasIcons = mail.starred || mail.attachments.length > 0;
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
          <span class="mail-time">${formatDate(mail.date)}</span>
        </div>
      </div>
      <div class="mail-subject">${escapeHtml(mail.subject)}</div>
      <div class="mail-preview">${escapeHtml(mail.preview)}</div>
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

  // 高亮搜索词
  if (state.searchQuery.trim()) {
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
  const folders = ['inbox', 'drafts', 'starred'];
  folders.forEach(f => {
    const badgeEl = document.getElementById(`badge-${f}`);
    if (!badgeEl) return;
    const count = mailData.filter(m => m.folder === f && m.unread).length;
    if (f === 'starred') {
      const starredCount = mailData.filter(m => m.starred).length;
      badgeEl.textContent = starredCount;
      badgeEl.style.display = starredCount ? 'flex' : 'none';
    } else {
      badgeEl.textContent = count;
      badgeEl.style.display = count ? 'flex' : 'none';
    }
  });
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
    inbox:   '收件箱',
    starred: '已加星标',
    drafts:  '草稿箱',
    sent:    '已发送',
    junk:    '垃圾邮件',
    archive: '归档',
    deleted: '已删除',
  };
  document.getElementById('folderTitle').textContent = titles[folderName] || folderName;

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

function handleSearch(query) {
  state.searchQuery    = query;
  state.selectedMailId = null;

  const clearBtn = document.getElementById('searchClear');
  clearBtn.style.display = query ? 'flex' : 'none';

  renderMailList();
  renderReadingPane(null);
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

  /* Search input (debounced) */
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => handleSearch(e.target.value), 200);
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

  /* Keyboard: press Escape to clear search */
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
}

/* Run on DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
