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
    thread_id: 'thread_project_deadline',
    category: 'work',
    priority: 'high',
    entities: { persons: ['Prof. Zhang Wei'], dates: ['2026-03-08'], actions: ['complete prototype', 'attend demo presentation'] },
    embedding: null,
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
    thread_id: 'thread_pr_review',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['alice-dev'], dates: [], actions: ['review pull request', 'merge PR'] },
    embedding: null,
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
    thread_id: 'thread_ta_feedback',
    category: 'work',
    priority: 'high',
    entities: { persons: ['李明'], dates: [], actions: ['reply to feedback', 'improve search UI', 'adjust layout density'] },
    embedding: null,
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
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
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
    thread_id: 'thread_pr_review',
    category: 'notification',
    priority: 'normal',
    entities: { persons: ['alice-dev'], dates: [], actions: ['review PR'] },
    embedding: null,
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
    thread_id: null,
    category: 'notification',
    priority: 'normal',
    entities: { persons: ['alice-dev'], dates: [], actions: ['view Figma file', 'add comments'] },
    embedding: null,
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
    thread_id: null,
    category: 'finance',
    priority: 'high',
    entities: { persons: [], dates: ['2026-03-25'], actions: ['pay credit card bill ¥1234.56'] },
    embedding: null,
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
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: ['devuser_42'], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 9,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: true,
    from: { name: 'Sarah Chen', email: 'sarah.chen@startup.io', color: '#6f42c1' },
    to: ['you@mailmind.app'],
    subject: 'Coffee chat this Friday?',
    preview: 'Hey! Would you have 30 mins for a quick coffee this Friday afternoon? I\'d love to pick your brain about the MailMind UX direction…',
    body: [
      { type: 'text', content: 'Hey!' },
      { type: 'text', content: 'Would you have 30 mins for a quick coffee this Friday afternoon? I\'d love to pick your brain about the MailMind UX direction — especially the search and organization flow.' },
      { type: 'text', content: 'Let me know if 3pm or 4pm works better. My treat!' },
    ],
    signature: 'Sarah\nProduct Designer @ Startup.io',
    attachments: [],
    date: new Date('2026-03-05T14:22:00'),
    tags: ['personal'],
    thread_id: 'thread_coffee_sarah',
    category: 'personal',
    priority: 'normal',
    entities: { persons: ['Sarah Chen'], dates: ['2026-03-08'], actions: ['confirm coffee meeting time'] },
    embedding: null,
  },
  {
    id: 10,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'LinkedIn', email: 'notifications@linkedin.com', color: '#0a66c2' },
    to: ['you@mailmind.app'],
    subject: '3 people viewed your profile this week',
    preview: 'Your profile was viewed by UX designers and developers. See who\'s interested and start a conversation.',
    body: [
      { type: 'text', content: 'Your profile was viewed 3 times in the past 7 days.' },
      { type: 'text', content: 'Top viewers:\n• Product Manager at TechCorp\n• Frontend Developer at DesignStudio\n• HCI Student at University' },
      { type: 'text', content: 'Upgrade to Premium to see who viewed your profile and get InMail credits.' },
    ],
    signature: 'LinkedIn\n© 2026 LinkedIn Corporation',
    attachments: [],
    date: new Date('2026-03-04T09:15:00'),
    tags: ['info'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 11,
    folder: 'inbox',
    unread: true,
    flagged: true,
    starred: false,
    from: { name: 'HR Team', email: 'hr@company.com', color: '#0d6efd' },
    to: ['you@mailmind.app'],
    subject: 'Action required: Complete your benefits enrollment by Mar 15',
    preview: 'Your benefits enrollment window is open. Please log in to the portal and confirm your selections before the deadline.',
    body: [
      { type: 'text', content: 'Dear Employee,' },
      { type: 'text', content: 'Your annual benefits enrollment window is now open and will close on March 15, 2026.\n\nPlease log in to the HR portal to:\n• Review your current benefits\n• Add or remove dependents\n• Update your 401(k) contribution\n• Select your health plan' },
      { type: 'text', content: 'If you do not take action, your current selections will roll over. Contact HR if you have questions.' },
    ],
    signature: 'HR Team\ncompany.com',
    attachments: [
      { name: 'Benefits_Guide_2026.pdf', size: '2.1 MB', type: 'pdf' },
      { name: 'Enrollment_Checklist.xlsx', size: '89 KB', type: 'xlsx' },
    ],
    date: new Date('2026-03-06T08:00:00'),
    tags: ['work', 'urgent'],
    thread_id: null,
    category: 'work',
    priority: 'high',
    entities: { persons: [], dates: ['2026-03-15'], actions: ['complete benefits enrollment', 'log in to HR portal'] },
    embedding: null,
  },
  {
    id: 12,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Spotify', email: 'no-reply@spotify.com', color: '#1db954' },
    to: ['you@mailmind.app'],
    subject: 'Your March Discover Weekly is ready',
    preview: 'We\'ve picked 30 new songs based on your listening history. Open the app to explore your personalized playlist.',
    body: [
      { type: 'text', content: 'Your Discover Weekly playlist has been updated with 30 new tracks.' },
      { type: 'text', content: 'This week\'s picks include:\n• Indie folk and acoustic\n• Lo-fi beats\n• Chill electronic' },
      { type: 'text', content: 'Open Spotify to listen now.' },
    ],
    signature: 'Spotify\nManage your email preferences',
    attachments: [],
    date: new Date('2026-03-04T05:30:00'),
    tags: ['personal'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 13,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: 'AWS', email: 'no-reply@aws.amazon.com', color: '#ff9900' },
    to: ['you@mailmind.app'],
    subject: 'Your AWS Free Tier usage alert',
    preview: 'You have used 85% of your free tier EC2 hours for this month. Consider upgrading or optimizing usage.',
    body: [
      { type: 'text', content: 'Usage Alert' },
      { type: 'text', content: 'Your AWS Free Tier usage for EC2 is at 85% for the current billing period.\n\nCurrent usage: 680 hours / 750 hours\nRemaining: 70 hours' },
      { type: 'text', content: 'To avoid unexpected charges, review your instances in the EC2 console or set up billing alerts.' },
    ],
    signature: 'Amazon Web Services',
    attachments: [],
    date: new Date('2026-03-05T23:45:00'),
    tags: ['work', 'urgent'],
    thread_id: null,
    category: 'work',
    priority: 'high',
    entities: { persons: [], dates: [], actions: ['check AWS EC2 usage', 'set up billing alerts'] },
    embedding: null,
  },
  {
    id: 14,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: true,
    from: { name: 'Mom', email: 'mom@family.com', color: '#e91e63' },
    to: ['you@mailmind.app'],
    subject: '周末回家吃饭吗？',
    preview: '这周六你爸做了你爱吃的红烧肉，有空的话回来一起吃晚饭吧。顺便把上次落下的外套带回去。',
    body: [
      { type: 'text', content: '儿子/女儿，' },
      { type: 'text', content: '这周六你爸做了你爱吃的红烧肉，有空的话回来一起吃晚饭吧。顺便把上次落下的外套带回去。' },
      { type: 'text', content: '记得早点回来，路上注意安全。' },
    ],
    signature: '妈妈',
    attachments: [],
    date: new Date('2026-03-03T18:20:00'),
    tags: ['personal'],
    thread_id: 'thread_family_dinner',
    category: 'personal',
    priority: 'normal',
    entities: { persons: ['Mom'], dates: ['2026-03-07'], actions: ['go home for dinner', 'bring jacket'] },
    embedding: null,
  },
  {
    id: 15,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Dribbble', email: 'hello@dribbble.com', color: '#ea4c89' },
    to: ['you@mailmind.app'],
    subject: 'Your shot was featured in "Email UI"',
    preview: 'Congratulations! Your design "Inbox Redesign Concept" was added to the "Email UI" collection by @designweekly.',
    body: [
      { type: 'text', content: 'Great news!' },
      { type: 'text', content: 'Your shot "Inbox Redesign Concept" was featured in the "Email UI" collection by @designweekly. You\'ve gained 47 new followers.' },
      { type: 'text', content: 'Keep creating! View your shot on Dribbble.' },
    ],
    signature: 'Dribbble Team',
    attachments: [],
    date: new Date('2026-03-02T12:00:00'),
    tags: ['info'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 16,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: 'Stripe', email: 'billing@stripe.com', color: '#635bff' },
    to: ['you@mailmind.app'],
    subject: 'Invoice #INV-2026-0042 — Payment received',
    preview: 'We\'ve received your payment of $29.00 for your Stripe subscription. Receipt attached.',
    body: [
      { type: 'text', content: 'Payment received' },
      { type: 'text', content: 'We\'ve received your payment of $29.00 for your Stripe subscription.\n\nInvoice: #INV-2026-0042\nDate: March 6, 2026\nMethod: Visa •••• 4242' },
      { type: 'text', content: 'Thank you for your business.' },
    ],
    signature: 'Stripe\nstripe.com',
    attachments: [
      { name: 'invoice_INV-2026-0042.pdf', size: '124 KB', type: 'pdf' },
    ],
    date: new Date('2026-03-06T07:30:00'),
    tags: ['finance'],
    thread_id: null,
    category: 'finance',
    priority: 'normal',
    entities: { persons: [], dates: ['2026-03-06'], actions: [] },
    embedding: null,
  },
  {
    id: 17,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Medium', email: 'noreply@medium.com', color: '#000000' },
    to: ['you@mailmind.app'],
    subject: '5 stories you might have missed',
    preview: 'This week: Designing for accessibility, The future of email clients, Why minimalism wins in UI design.',
    body: [
      { type: 'text', content: 'Here are 5 stories from your favorite publications:' },
      { type: 'text', content: '1. Designing for accessibility — A practical guide\n2. The future of email clients — What users really want\n3. Why minimalism wins in UI design\n4. Building inclusive products\n5. The psychology of inbox zero' },
      { type: 'text', content: 'Read on Medium' },
    ],
    signature: 'Medium\nUnsubscribe from digest',
    attachments: [],
    date: new Date('2026-03-05T06:00:00'),
    tags: ['info'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 18,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Alex Rivera', email: 'alex.r@agency.co', color: '#00b4d8' },
    to: ['you@mailmind.app'],
    subject: 'Re: Design review — MailMind mockups',
    preview: 'The mockups look great! A few minor tweaks on the reading pane spacing. I\'ve attached an annotated version.',
    body: [
      { type: 'text', content: 'Hi,' },
      { type: 'text', content: 'The mockups look great overall! I have a few minor tweaks on the reading pane spacing and the attachment chip styling. I\'ve attached an annotated Figma file.' },
      { type: 'text', content: 'Let me know when you\'ve had a chance to review. Happy to jump on a call if needed.' },
    ],
    signature: 'Alex\nSenior Designer @ Agency',
    attachments: [
      { name: 'MailMind_Feedback_v2.fig', size: '3.2 MB', type: 'file' },
      { name: 'spacing_notes.pptx', size: '890 KB', type: 'pptx' },
    ],
    date: new Date('2026-03-04T11:45:00'),
    tags: ['work'],
    thread_id: 'thread_design_review',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['Alex Rivera'], dates: [], actions: ['review design feedback', 'apply spacing changes'] },
    embedding: null,
  },
  /* ── 收件箱 — 新增 ── */
  {
    id: 19,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: 'Google Calendar', email: 'calendar-notification@google.com', color: '#4285f4' },
    to: ['you@mailmind.app'],
    subject: 'Invitation: MailMind Sprint Planning — Mon Mar 9, 10:00–11:00',
    preview: 'alice-dev has invited you to MailMind Sprint Planning on Monday March 9 at 10:00 AM. Video call link included.',
    body: [
      { type: 'text', content: 'You have been invited to the following event.' },
      { type: 'text', content: 'MailMind Sprint Planning\nDate: Monday, March 9, 2026\nTime: 10:00 AM – 11:00 AM (GMT+8)\nOrganizer: alice-dev@example.com\nLocation: Google Meet — meet.google.com/xyz-abc-123' },
      { type: 'text', content: 'Agenda:\n1. Review last sprint deliverables\n2. Prioritize AI search feature tickets\n3. Assign Week 2 tasks\n\nPlease RSVP by March 8.' },
    ],
    signature: 'Google Calendar',
    attachments: [
      { name: 'sprint-planning.ics', size: '2 KB', type: 'file' },
    ],
    date: new Date('2026-03-06T12:00:00'),
    tags: ['work'],
    thread_id: 'thread_sprint_planning',
    category: 'work',
    priority: 'high',
    entities: { persons: ['alice-dev'], dates: ['2026-03-09'], actions: ['RSVP to sprint planning meeting', 'prepare sprint review'] },
    embedding: null,
  },
  {
    id: 20,
    folder: 'inbox',
    unread: true,
    flagged: true,
    starred: false,
    from: { name: 'TechCorp HR', email: 'recruiting@techcorp.com', color: '#0d6efd' },
    to: ['you@mailmind.app'],
    subject: '面试邀请 — 前端工程师（AI 产品方向）@ TechCorp',
    preview: '您好，感谢您投递前端工程师职位。我们对您的背景很感兴趣，诚邀您参加第一轮技术面试……',
    body: [
      { type: 'text', content: '您好，' },
      { type: 'text', content: '感谢您投递 TechCorp 前端工程师（AI 产品方向）职位。我们的团队仔细阅读了您的简历和作品集，对您在 MailMind 项目中的 AI 搜索设计非常感兴趣。' },
      { type: 'text', content: '诚邀您参加第一轮技术面试：\n\n时间：2026年3月12日（周四）14:00–15:30\n形式：视频面试（Zoom）\n面试官：Engineering Manager + Senior Frontend Engineer\nZoom 链接：zoom.us/j/98765432100\n\n面试内容将涵盖：前端架构设计、AI 功能集成、用户体验思维。' },
      { type: 'text', content: '请在3月10日前回复确认是否可以参加，或告知您方便的时间段以便重新安排。期待与您的交流！' },
    ],
    signature: 'Lisa Wang\nTalent Acquisition @ TechCorp\nrecruiting@techcorp.com',
    attachments: [
      { name: 'TechCorp_JD_Frontend_AI.pdf', size: '340 KB', type: 'pdf' },
    ],
    date: new Date('2026-03-06T10:30:00'),
    tags: ['work', 'urgent'],
    thread_id: 'thread_job_interview',
    category: 'work',
    priority: 'high',
    entities: { persons: ['Lisa Wang'], dates: ['2026-03-10', '2026-03-12'], actions: ['confirm interview attendance', 'prepare for technical interview'] },
    embedding: null,
  },
  {
    id: 21,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '京东物流', email: 'logistics@jd.com', color: '#e1251b' },
    to: ['you@mailmind.app'],
    subject: '【京东快递】您的包裹已发货 — 机械键盘 × 1',
    preview: '您的订单已发货，预计3月8日送达。快递单号：JD2026030600123456，可在京东 App 实时追踪。',
    body: [
      { type: 'text', content: '尊敬的用户，您好！' },
      { type: 'text', content: '您的订单已由京东自营仓发货，详情如下：\n\n订单号：JD2026-1122334\n商品：HHKB Professional Hybrid 机械键盘 × 1\n快递单号：JD2026030600123456\n承运商：京东物流\n预计送达：2026年3月8日（周日）' },
      { type: 'text', content: '您可以在京东 App 首页 → "我的订单" 中实时查看物流状态。如有问题请联系客服。' },
    ],
    signature: '京东物流\n客服热线：950618',
    attachments: [],
    date: new Date('2026-03-06T06:00:00'),
    tags: ['personal'],
    thread_id: null,
    category: 'personal',
    priority: 'normal',
    entities: { persons: [], dates: ['2026-03-08'], actions: ['track package delivery'] },
    embedding: null,
  },
  {
    id: 22,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: 'Alice Dev', email: 'alice-dev@example.com', color: '#6f42c1' },
    to: ['you@mailmind.app'],
    subject: 'Re: PR #3 — 回复你的问题',
    preview: '关于你问的两个点：中文字符高亮用的是正则 unicode flag，debounce 设的是 300ms，你觉得可以吗？',
    body: [
      { type: 'text', content: '嗨，' },
      { type: 'text', content: '关于你在草稿里提到的两个问题，我来回复一下：\n\n1. 中文字符高亮：我用的是正则表达式 + /u flag（unicode 模式），所以中文、日文、韩文都可以正确匹配和高亮，不会出现截断的问题。\n2. Debounce 延迟：目前设的是 300ms，我觉得对于搜索来说比较合适。你在 app.js 里设的是 200ms，要不要统一一下？' },
      { type: 'text', content: '另外，我在 PR 里还加了一个 "no results" 的空状态组件，你觉得这个设计方向对吗？有时间可以过一下。' },
    ],
    signature: 'Alice\nalice-dev@example.com',
    attachments: [],
    date: new Date('2026-03-06T15:10:00'),
    tags: ['work'],
    thread_id: 'thread_pr_review',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['Alice Dev'], dates: [], actions: ['review PR comment', 'decide on debounce timing', 'merge PR'] },
    embedding: null,
  },
  {
    id: 23,
    folder: 'inbox',
    unread: true,
    flagged: true,
    starred: false,
    from: { name: '支付宝', email: 'no-reply@alipay.com', color: '#1677ff' },
    to: ['you@mailmind.app'],
    subject: '您有一笔 ¥2,450 的转账待确认',
    preview: '您的朋友 David Li 向您发起了 ¥2,450 的转账，请在24小时内登录支付宝确认收款。',
    body: [
      { type: 'text', content: '尊敬的用户，' },
      { type: 'text', content: '您的联系人 David Li（david.li@university.edu）向您发起了一笔转账，等待您确认。\n\n转账金额：¥ 2,450.00\n备注：项目组服务器费用分摊（2月+3月）\n转账时间：2026-03-06 14:22\n有效期：24小时内' },
      { type: 'text', content: '请登录支付宝 App 或网页端确认收款。超时未确认将自动退回。' },
    ],
    signature: '支付宝安全团队\n如非本人操作请忽略',
    attachments: [],
    date: new Date('2026-03-06T14:25:00'),
    tags: ['finance'],
    thread_id: null,
    category: 'finance',
    priority: 'high',
    entities: { persons: ['David Li'], dates: [], actions: ['confirm Alipay transfer ¥2450'] },
    embedding: null,
  },
  {
    id: 24,
    folder: 'inbox',
    unread: true,
    flagged: true,
    starred: true,
    from: { name: 'Prof. Wang Fang', email: 'wangfang@lab.edu', color: '#5c2d91' },
    to: ['you@mailmind.app'],
    subject: '关于你的毕业论文开题报告',
    preview: '同学，你的开题报告初稿我看过了，方向没问题，但有几个地方需要在下周提交前修改……',
    body: [
      { type: 'text', content: '同学，' },
      { type: 'text', content: '你的毕业论文开题报告初稿我已经看过了，研究方向（AI 邮件管理系统的用户体验设计）是可行的，相关工作综述也做得不错。但有几个地方需要在正式提交前修改：' },
      { type: 'text', content: '1. 研究问题的表述：目前写的太宽泛，需要聚焦到"自然语言搜索对邮件处理效率的影响"这个具体问题上。\n2. 实验设计：需要增加对照组设计，说明如何和传统关键词搜索做对比评估。\n3. 时间线：把各阶段的时间节点列得更细，评委会关注这个。' },
      { type: 'text', content: '修改好后请在3月13日（周五）下午5点前发给我。如有问题周四来实验室找我，下午2点以后都在。' },
    ],
    signature: 'Wang Fang\n人机交互实验室\nlab.edu',
    attachments: [
      { name: 'thesis_proposal_comments.pdf', size: '280 KB', type: 'pdf' },
    ],
    date: new Date('2026-03-06T16:00:00'),
    tags: ['work', 'urgent'],
    thread_id: 'thread_thesis',
    category: 'work',
    priority: 'high',
    entities: { persons: ['Prof. Wang Fang'], dates: ['2026-03-13'], actions: ['revise thesis proposal', 'submit by Friday 5pm', 'visit lab Thursday'] },
    embedding: null,
  },
  {
    id: 25,
    folder: 'inbox',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Vercel', email: 'no-reply@vercel.com', color: '#000000' },
    to: ['you@mailmind.app'],
    subject: 'Deploy succeeded — mailmind.vercel.app',
    preview: 'Your deployment to mailmind.vercel.app is live. Commit: feat: upgrade data layer with AI-ready schema (a3f8c21)',
    body: [
      { type: 'text', content: 'Deployment succeeded' },
      { type: 'text', content: 'Project: mailmind\nEnvironment: Production\nURL: https://mailmind.vercel.app\nCommit: a3f8c21 — feat: upgrade data layer with AI-ready schema\nBranch: main\nDuration: 42s' },
      { type: 'text', content: 'Your project is live. Visit mailmind.vercel.app to see your changes.' },
    ],
    signature: 'Vercel\nvercel.com',
    attachments: [],
    date: new Date('2026-03-06T17:45:00'),
    tags: ['work'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 26,
    folder: 'inbox',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: 'David Li', email: 'david.li@university.edu', color: '#00b4d8' },
    to: ['you@mailmind.app', 'alice-dev@example.com', 'sarah.chen@startup.io'],
    subject: '这周组会谁来做分享？',
    preview: '大家好，本周四下午3点有我们组的例会，还没有分享人。有没有人愿意讲一下自己最近在做的项目？',
    body: [
      { type: 'text', content: '大家好，' },
      { type: 'text', content: '本周四（3月12日）下午3点有我们组的双周例会，今次还没有分享人。有没有人愿意讲一下自己最近在做的东西？20分钟左右，轻松的氛围，不用做 slides。' },
      { type: 'text', content: '我觉得 MailMind 的 AI 搜索这个方向挺有意思的，如果你愿意的话可以分享一下思路？回复一下让大家知道。' },
    ],
    signature: 'David\ndavid.li@university.edu',
    attachments: [],
    date: new Date('2026-03-06T13:00:00'),
    tags: ['work', 'personal'],
    thread_id: 'thread_group_meeting',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['David Li', 'Alice Dev', 'Sarah Chen'], dates: ['2026-03-12'], actions: ['reply to group meeting invitation', 'prepare short presentation'] },
    embedding: null,
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
    thread_id: 'thread_project_deadline',
    category: 'work',
    priority: 'high',
    entities: { persons: ['Prof. Zhang Wei'], dates: [], actions: [] },
    embedding: null,
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
    thread_id: 'thread_pr_review',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['Alice Dev'], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 103,
    folder: 'drafts',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '（草稿）', email: 'you@mailmind.app', color: '#8a8886' },
    to: ['sarah.chen@startup.io'],
    subject: 'Re: Coffee chat this Friday?',
    preview: 'Hey Sarah, 3pm works great for me! See you at the usual spot.',
    body: [
      { type: 'text', content: 'Hey Sarah,' },
      { type: 'text', content: '3pm works great for me! See you at the usual spot. Looking forward to it.' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-06T11:20:00'),
    tags: ['personal'],
    thread_id: 'thread_coffee_sarah',
    category: 'personal',
    priority: 'normal',
    entities: { persons: ['Sarah Chen'], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 104,
    folder: 'drafts',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '（草稿）', email: 'you@mailmind.app', color: '#8a8886' },
    to: ['recruiting@techcorp.com'],
    subject: 'Re: 面试邀请 — 确认参加 3月12日面试',
    preview: '您好，感谢邀请，我确认参加3月12日14:00的技术面试。请问面试前需要准备任何材料吗……',
    body: [
      { type: 'text', content: '您好 Lisa，' },
      { type: 'text', content: '感谢 TechCorp 的面试邀请！我确认可以参加3月12日（周四）14:00–15:30 的技术视频面试。' },
      { type: 'text', content: '请问面试前需要准备任何材料，比如代码样例或项目演示吗？另外，面试当天请通过 Zoom 链接直接进入还是需要等待邀请链接？' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-06T18:00:00'),
    tags: ['work'],
    thread_id: 'thread_job_interview',
    category: 'work',
    priority: 'high',
    entities: { persons: ['Lisa Wang'], dates: ['2026-03-12'], actions: [] },
    embedding: null,
  },
  {
    id: 105,
    folder: 'drafts',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '（草稿）', email: 'you@mailmind.app', color: '#8a8886' },
    to: ['wangfang@lab.edu'],
    subject: 'Re: 开题报告修改版',
    preview: '王老师，您好，感谢您的详细批注。我已经按照意见修改了研究问题表述和实验设计部分……',
    body: [
      { type: 'text', content: '王老师，您好，' },
      { type: 'text', content: '感谢您详细的批注意见！我已经按照建议完成了以下修改：\n1. 研究问题已聚焦到"自然语言搜索对邮件检索效率的影响"\n2. 增加了 A/B 测试的对照组设计说明\n3. 时间线已细化到每个里程碑节点' },
      { type: 'text', content: '修改版已附在本邮件中，请您审阅。如还有需要调整的地方，请告知。' },
    ],
    signature: '',
    attachments: [
      { name: 'thesis_proposal_v2.pdf', size: '420 KB', type: 'pdf' },
    ],
    date: new Date('2026-03-07T09:00:00'),
    tags: ['work'],
    thread_id: 'thread_thesis',
    category: 'work',
    priority: 'high',
    entities: { persons: ['Prof. Wang Fang'], dates: [], actions: [] },
    embedding: null,
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
    thread_id: 'thread_ta_feedback',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['李明'], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 202,
    folder: 'sent',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'You', email: 'you@mailmind.app', color: '#c43e00' },
    to: ['mom@family.com'],
    subject: 'Re: 周末回家吃饭吗？',
    preview: '妈，周六 3pm 左右到，红烧肉等我！',
    body: [
      { type: 'text', content: '妈，' },
      { type: 'text', content: '周六 3pm 左右到，红烧肉等我！外套我会带上。' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-03T20:15:00'),
    tags: ['personal'],
    thread_id: 'thread_family_dinner',
    category: 'personal',
    priority: 'normal',
    entities: { persons: ['Mom'], dates: ['2026-03-07'], actions: [] },
    embedding: null,
  },
  {
    id: 203,
    folder: 'sent',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'You', email: 'you@mailmind.app', color: '#c43e00' },
    to: ['alex.r@agency.co'],
    subject: 'Re: Design review — MailMind mockups',
    preview: 'Thanks for the feedback! I\'ve applied the spacing changes. Updated file attached.',
    body: [
      { type: 'text', content: 'Hi Alex,' },
      { type: 'text', content: 'Thanks for the detailed feedback! I\'ve applied the spacing changes to the reading pane and updated the attachment chip styling. Updated file is attached.' },
      { type: 'text', content: 'Let me know if you\'d like to schedule a quick sync.' },
    ],
    signature: 'YS',
    attachments: [
      { name: 'MailMind_v3.fig', size: '3.5 MB', type: 'file' },
    ],
    date: new Date('2026-03-04T16:00:00'),
    tags: ['work'],
    thread_id: 'thread_design_review',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['Alex Rivera'], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 204,
    folder: 'sent',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'You', email: 'you@mailmind.app', color: '#c43e00' },
    to: ['alice-dev@example.com'],
    subject: 'Re: PR #3 — LGTM，可以 merge',
    preview: 'Alice，看完了！整体没问题，debounce 统一用 300ms，中文高亮也测过了。LGTM，可以 merge！',
    body: [
      { type: 'text', content: 'Alice，' },
      { type: 'text', content: '看完了！整体代码质量不错，逻辑清晰。我做了以下测试：\n• 中文关键词高亮：正常\n• 英文混合搜索：正常\n• debounce 300ms：我这边也改成统一 300ms 了\n• 空状态组件：设计很好，和现有风格一致' },
      { type: 'text', content: 'LGTM 👍 可以 merge 到 main。谢谢你的工作！' },
    ],
    signature: 'YS',
    attachments: [],
    date: new Date('2026-03-06T17:00:00'),
    tags: ['work'],
    thread_id: 'thread_pr_review',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['Alice Dev'], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 205,
    folder: 'sent',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'You', email: 'you@mailmind.app', color: '#c43e00' },
    to: ['david.li@university.edu'],
    subject: 'Re: 这周组会谁来做分享？',
    preview: 'David，我来吧！我可以分享一下 MailMind AI 搜索的设计思路，大概20分钟。',
    body: [
      { type: 'text', content: 'David，' },
      { type: 'text', content: '我来吧！我最近正好在做 MailMind 的 AI 语义搜索功能，可以借这个机会分享一下设计思路和技术选型，大概 20 分钟。' },
      { type: 'text', content: '周四 3点见。' },
    ],
    signature: 'YS',
    attachments: [],
    date: new Date('2026-03-06T14:00:00'),
    tags: ['work'],
    thread_id: 'thread_group_meeting',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['David Li'], dates: ['2026-03-12'], actions: [] },
    embedding: null,
  },
  {
    id: 206,
    folder: 'sent',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'You', email: 'you@mailmind.app', color: '#c43e00' },
    to: ['recruiting@techcorp.com'],
    subject: 'Re: 面试邀请 — 确认参加',
    preview: 'Hi Lisa, 3月12日14:00 我可以参加，Zoom 链接收到了。请问面试前需要准备什么材料吗？',
    body: [
      { type: 'text', content: 'Hi Lisa,' },
      { type: 'text', content: 'Thank you for the invitation! I confirm my availability for the technical interview on Thursday, March 12 at 2:00 PM. I have the Zoom link ready.' },
      { type: 'text', content: 'Could you let me know if there are any materials I should prepare in advance, such as code samples or a project walkthrough? Looking forward to the conversation!' },
    ],
    signature: 'YS\nyou@mailmind.app',
    attachments: [],
    date: new Date('2026-03-06T11:00:00'),
    tags: ['work'],
    thread_id: 'thread_job_interview',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['Lisa Wang'], dates: ['2026-03-12'], actions: [] },
    embedding: null,
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
    thread_id: null,
    category: 'spam',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 302,
    folder: 'junk',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'URGENT: Account Suspended', email: 'noreply@fake-bank.com', color: '#8a8886' },
    to: ['you@mailmind.app'],
    subject: 'Your account has been suspended — Verify now',
    preview: 'We detected unusual activity. Click here immediately to verify your identity and restore access.',
    body: [
      { type: 'text', content: 'Your account has been temporarily suspended due to suspicious activity.' },
      { type: 'text', content: 'Click the link below to verify your identity. Failure to do so within 24 hours will result in permanent closure.' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-02T14:33:00'),
    tags: [],
    thread_id: null,
    category: 'spam',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 303,
    folder: 'junk',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Exclusive Crypto Opportunity', email: 'invest@crypto-scam.net', color: '#8a8886' },
    to: ['you@mailmind.app'],
    subject: '10x returns guaranteed — Limited spots',
    preview: 'Join our exclusive crypto investment program. Minimum $500. Returns up to 10x in 30 days.',
    body: [
      { type: 'text', content: 'You have been selected for our exclusive crypto investment program.' },
      { type: 'text', content: 'Minimum investment: $500. Guaranteed returns up to 10x in 30 days. Limited spots available.' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-01T09:00:00'),
    tags: [],
    thread_id: null,
    category: 'spam',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 304,
    folder: 'junk',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: '双十一大促销', email: 'promo@shopscam.cn', color: '#8a8886' },
    to: ['you@mailmind.app'],
    subject: '【限时特惠】全场 5 折！仅剩 2 小时，手慢无！',
    preview: '亲爱的会员，品牌清仓大促，全场低至 5 折，满¥199减¥50，下单即赠神秘礼品……',
    body: [
      { type: 'text', content: '亲爱的尊贵会员！' },
      { type: 'text', content: '品牌清仓大促销正式开启！全场商品低至 5 折，限时 2 小时。\n\n• 满 ¥199 减 ¥50\n• 满 ¥399 减 ¥120\n• 下单即赠神秘礼品一份\n\n点击下方链接立即抢购（链接已过期）' },
    ],
    signature: '',
    attachments: [],
    date: new Date('2026-03-05T08:00:00'),
    tags: [],
    thread_id: null,
    category: 'spam',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 305,
    folder: 'junk',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Apple Support', email: 'noreply@apple-id-verify.net', color: '#8a8886' },
    to: ['you@mailmind.app'],
    subject: 'Your Apple ID has been locked — Verify immediately',
    preview: 'We have detected suspicious activity on your Apple ID. Your account has been temporarily locked. Verify now to restore access.',
    body: [
      { type: 'text', content: 'Dear Apple Customer,' },
      { type: 'text', content: 'We have detected suspicious sign-in activity on your Apple ID associated with this email address. For your security, your account has been temporarily locked.' },
      { type: 'text', content: 'To restore access, please verify your identity within 24 hours by clicking the link below: http://apple-id-verify.net/unlock (DO NOT click — phishing link)' },
    ],
    signature: 'Apple Support Team',
    attachments: [],
    date: new Date('2026-03-04T03:15:00'),
    tags: [],
    thread_id: null,
    category: 'spam',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
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
    thread_id: 'thread_project_deadline',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['Prof. Zhang Wei'], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 402,
    folder: 'archive',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Netflix', email: 'info@netflix.com', color: '#e50914' },
    to: ['you@mailmind.app'],
    subject: 'Your January 2026 viewing summary',
    preview: 'You watched 12 titles and 47 hours of content. Here\'s your personalized recap.',
    body: [
      { type: 'text', content: 'Your January 2026 viewing summary' },
      { type: 'text', content: 'You watched 12 titles and 47 hours of content.\n\nTop picks:\n• Documentary series\n• Sci-fi drama\n• Comedy specials' },
    ],
    signature: 'Netflix\nUnsubscribe',
    attachments: [],
    date: new Date('2026-02-01T08:00:00'),
    tags: ['personal'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 403,
    folder: 'archive',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Slack', email: 'notifications@slack.com', color: '#4a154b' },
    to: ['you@mailmind.app'],
    subject: 'Weekly digest: #general, #design, #random',
    preview: '23 new messages across 3 channels. 2 mentions, 1 file shared.',
    body: [
      { type: 'text', content: 'Your weekly Slack digest' },
      { type: 'text', content: '23 new messages across 3 channels.\n• 2 mentions\n• 1 file shared\n• 3 threads you might have missed' },
    ],
    signature: 'Slack\nManage notifications',
    attachments: [],
    date: new Date('2026-02-15T07:00:00'),
    tags: ['work'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 404,
    folder: 'archive',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'GitHub Actions', email: 'noreply@github.com', color: '#24292f' },
    to: ['you@mailmind.app'],
    subject: '[mailmind] CI failed on branch feature/search — build #47',
    preview: 'Build #47 failed on feature/search. Error: ReferenceError: highlightText is not defined at scripts/search.js:42.',
    body: [
      { type: 'text', content: 'Build #47 failed on branch feature/search.' },
      { type: 'text', content: 'Error details:\nReferenceError: highlightText is not defined\n  at scripts/search.js:42:5\n  at HTMLInputElement.<anonymous> (scripts/app.js:1044:7)\n\nStep failed: Run tests\nDuration: 1m 12s' },
      { type: 'text', content: 'View the full build log on GitHub Actions.' },
    ],
    signature: 'GitHub Actions\nnoreply@github.com',
    attachments: [],
    date: new Date('2026-02-18T22:30:00'),
    tags: ['work'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 405,
    folder: 'archive',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: '支付宝', email: 'no-reply@alipay.com', color: '#1677ff' },
    to: ['you@mailmind.app'],
    subject: '你的 2025 年度账单来了',
    preview: '2025年你共消费 ¥28,450，支付了 1,203 笔。最常消费品类：餐饮 > 数码 > 出行。',
    body: [
      { type: 'text', content: '你的 2025 年度消费账单' },
      { type: 'text', content: '2025年全年数据：\n\n总消费：¥ 28,450.00\n总笔数：1,203 笔\n最高单笔：¥ 3,200（11月数码产品）\n\n消费品类排名：\n1. 餐饮外卖 — ¥7,820\n2. 数码电子 — ¥5,200\n3. 出行交通 — ¥3,100' },
      { type: 'text', content: '感谢你 2025 年对支付宝的支持，祝 2026 年一切顺利！' },
    ],
    signature: '支付宝\nAlipay.com',
    attachments: [],
    date: new Date('2026-01-02T09:00:00'),
    tags: ['finance'],
    thread_id: null,
    category: 'finance',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 406,
    folder: 'archive',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: '李明 (TA)', email: 'liming-ta@university.edu', color: '#107c10' },
    to: ['you@mailmind.app'],
    subject: 'MailMind 项目初期反馈 — 第一次评审',
    preview: '同学，你提交的第一版线框图我看了，整体思路是对的，但还需要在信息架构上做一些调整……',
    body: [
      { type: 'text', content: '同学，' },
      { type: 'text', content: '你提交的第一版 MailMind 线框图我看了。整体思路是对的，三栏布局符合用户心智模型，主要问题在信息架构上：\n\n1. 搜索入口太隐蔽，建议放到顶部居中位置（参考 Gmail 的处理方式）。\n2. 邮件列表的时间显示格式不一致，建议统一到"相对时间"（今天/昨天/日期）。\n3. 阅读窗格缺少"回复"的快速入口。' },
      { type: 'text', content: '这些是第一版的核心问题，修改后可以进入第二轮设计迭代。继续加油！' },
    ],
    signature: '李明\nCS 课程助教',
    attachments: [
      { name: 'wireframe_review_v1.pdf', size: '620 KB', type: 'pdf' },
    ],
    date: new Date('2026-02-10T16:45:00'),
    tags: ['work'],
    thread_id: 'thread_ta_feedback',
    category: 'work',
    priority: 'normal',
    entities: { persons: ['李明'], dates: [], actions: [] },
    embedding: null,
  },

  /* ── 已删除 ── */
  {
    id: 501,
    folder: 'deleted',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Groupon', email: 'deals@groupon.com', color: '#8a8886' },
    to: ['you@mailmind.app'],
    subject: 'Deals near you — Up to 70% off this weekend only',
    preview: 'Restaurants, spas, activities and more. See what\'s on sale near your location this weekend.',
    body: [
      { type: 'text', content: 'Weekend deals near you!' },
      { type: 'text', content: 'Up to 70% off selected local businesses this weekend only.\n• Restaurants & cafes\n• Spa & wellness\n• Entertainment & activities' },
    ],
    signature: 'Groupon\nUnsubscribe',
    attachments: [],
    date: new Date('2026-03-01T05:00:00'),
    tags: [],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 502,
    folder: 'deleted',
    unread: false,
    flagged: false,
    starred: false,
    from: { name: 'Google Alerts', email: 'googlealerts-noreply@google.com', color: '#4285f4' },
    to: ['you@mailmind.app'],
    subject: 'Google Alert — "email client AI"',
    preview: 'New results for "email client AI": 3 new articles this week including HN discussion on AI-native email tools.',
    body: [
      { type: 'text', content: 'New Google Alert results for: email client AI' },
      { type: 'text', content: '3 new articles this week:\n1. "The rise of AI-native email clients" — TechCrunch\n2. HN discussion: Ask HN: What would a truly AI-native email client look like?\n3. "Superhuman vs Spark vs Hey: Which AI email tool is best in 2026?" — The Verge' },
    ],
    signature: 'Google Alerts\nmanage alerts | unsubscribe',
    attachments: [],
    date: new Date('2026-03-02T07:00:00'),
    tags: ['info'],
    thread_id: null,
    category: 'notification',
    priority: 'low',
    entities: { persons: [], dates: [], actions: [] },
    embedding: null,
  },
  {
    id: 503,
    folder: 'deleted',
    unread: true,
    flagged: false,
    starred: false,
    from: { name: '（草稿）', email: 'you@mailmind.app', color: '#8a8886' },
    to: ['wangfang@lab.edu'],
    subject: '开题报告初稿 — 请指导',
    preview: '王老师，您好，附上我的毕业论文开题报告初稿，请您在百忙之中给予指导意见……',
    body: [
      { type: 'text', content: '王老师，您好，' },
      { type: 'text', content: '附上我的毕业论文开题报告初稿，请您在百忙之中给予指导意见。' },
      { type: 'text', content: '（此版本已废弃，见 v2 版本）' },
    ],
    signature: '',
    attachments: [
      { name: 'thesis_proposal_v1_DRAFT.pdf', size: '310 KB', type: 'pdf' },
    ],
    date: new Date('2026-03-05T23:00:00'),
    tags: ['work'],
    thread_id: 'thread_thesis',
    category: 'work',
    priority: 'low',
    entities: { persons: ['Prof. Wang Fang'], dates: [], actions: [] },
    embedding: null,
  },
];

/* ──────────────────────────────────────────────────────────────
   SECTION 1b: SUPPLEMENTARY DATA
   threadData / personData / taskData 作为独立的内存"表"
   支持 AI 功能（搜索、任务提取、联系人管理）的数据基础
   ────────────────────────────────────────────────────────────── */

const threadData = [
  {
    thread_id:    'thread_project_deadline',
    subject:      '课程 Project 第一阶段截止日期',
    mail_ids:     [1, 101, 401],
    participants: ['you@mailmind.app', 'zhangwei@university.edu'],
    last_date:    new Date('2026-03-06T10:05:00'),
  },
  {
    thread_id:    'thread_pr_review',
    subject:      'PR #3 — feat: add email search with fuzzy matching',
    mail_ids:     [2, 5, 22, 102, 204],
    participants: ['you@mailmind.app', 'alice-dev@example.com'],
    last_date:    new Date('2026-03-06T17:00:00'),
  },
  {
    thread_id:    'thread_ta_feedback',
    subject:      'MailMind 项目反馈',
    mail_ids:     [3, 201, 406],
    participants: ['you@mailmind.app', 'liming-ta@university.edu'],
    last_date:    new Date('2026-03-05T17:32:00'),
  },
  {
    thread_id:    'thread_design_review',
    subject:      'Design review — MailMind mockups',
    mail_ids:     [18, 203],
    participants: ['you@mailmind.app', 'alex.r@agency.co'],
    last_date:    new Date('2026-03-04T16:00:00'),
  },
  {
    thread_id:    'thread_coffee_sarah',
    subject:      'Coffee chat this Friday?',
    mail_ids:     [9, 103],
    participants: ['you@mailmind.app', 'sarah.chen@startup.io'],
    last_date:    new Date('2026-03-06T11:20:00'),
  },
  {
    thread_id:    'thread_family_dinner',
    subject:      '周末回家吃饭',
    mail_ids:     [14, 202],
    participants: ['you@mailmind.app', 'mom@family.com'],
    last_date:    new Date('2026-03-03T20:15:00'),
  },
  {
    thread_id:    'thread_job_interview',
    subject:      '面试邀请 — 前端工程师 @ TechCorp',
    mail_ids:     [20, 104, 206],
    participants: ['you@mailmind.app', 'recruiting@techcorp.com'],
    last_date:    new Date('2026-03-06T18:00:00'),
  },
  {
    thread_id:    'thread_thesis',
    subject:      '毕业论文开题报告',
    mail_ids:     [24, 105, 503],
    participants: ['you@mailmind.app', 'wangfang@lab.edu'],
    last_date:    new Date('2026-03-07T09:00:00'),
  },
  {
    thread_id:    'thread_group_meeting',
    subject:      '组会分享',
    mail_ids:     [26, 205],
    participants: ['you@mailmind.app', 'david.li@university.edu', 'alice-dev@example.com', 'sarah.chen@startup.io'],
    last_date:    new Date('2026-03-06T14:00:00'),
  },
  {
    thread_id:    'thread_sprint_planning',
    subject:      'MailMind Sprint Planning',
    mail_ids:     [19],
    participants: ['you@mailmind.app', 'alice-dev@example.com'],
    last_date:    new Date('2026-03-06T12:00:00'),
  },
];

const personData = [
  {
    person_id: 'zhang-wei',
    name:      'Prof. Zhang Wei',
    email:     'zhangwei@university.edu',
    color:     '#0078d4',
    mail_ids:  [1, 401],
    relation:  'professor',
  },
  {
    person_id: 'li-ming',
    name:      '李明 (TA)',
    email:     'liming-ta@university.edu',
    color:     '#107c10',
    mail_ids:  [3, 201, 406],
    relation:  'colleague',
  },
  {
    person_id: 'sarah-chen',
    name:      'Sarah Chen',
    email:     'sarah.chen@startup.io',
    color:     '#6f42c1',
    mail_ids:  [9, 26, 103],
    relation:  'personal',
  },
  {
    person_id: 'alex-rivera',
    name:      'Alex Rivera',
    email:     'alex.r@agency.co',
    color:     '#00b4d8',
    mail_ids:  [18, 203],
    relation:  'colleague',
  },
  {
    person_id: 'alice-dev',
    name:      'Alice Dev',
    email:     'alice-dev@example.com',
    color:     '#6f42c1',
    mail_ids:  [2, 5, 6, 22, 26, 102, 204],
    relation:  'colleague',
  },
  {
    person_id: 'mom',
    name:      'Mom',
    email:     'mom@family.com',
    color:     '#e91e63',
    mail_ids:  [14, 202],
    relation:  'family',
  },
  {
    person_id: 'david-li',
    name:      'David Li',
    email:     'david.li@university.edu',
    color:     '#00b4d8',
    mail_ids:  [23, 26, 205],
    relation:  'colleague',
  },
  {
    person_id: 'wang-fang',
    name:      'Prof. Wang Fang',
    email:     'wangfang@lab.edu',
    color:     '#5c2d91',
    mail_ids:  [24, 105, 503],
    relation:  'professor',
  },
  {
    person_id: 'lisa-wang',
    name:      'Lisa Wang (TechCorp HR)',
    email:     'recruiting@techcorp.com',
    color:     '#0d6efd',
    mail_ids:  [20, 104, 206],
    relation:  'colleague',
  },
];

const taskData = [
  {
    task_id:  'task_01',
    email_id: 1,
    content:  '完成课程 Demo 原型基础功能（静态界面、Mock 数据、核心交互）',
    due:      '2026-03-08',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_02',
    email_id: 1,
    content:  '周三 Office Hours 前去找 Prof. Zhang Wei 汇报进展',
    due:      '2026-03-11',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_03',
    email_id: 7,
    content:  '在3月25日前还款信用卡账单 ¥1,234.56',
    due:      '2026-03-25',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_04',
    email_id: 11,
    content:  '3月15日前完成年度福利填写并提交',
    due:      '2026-03-15',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_05',
    email_id: 13,
    content:  '检查 AWS EC2 用量并设置 billing alerts，避免超出免费额度',
    due:      null,
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_06',
    email_id: 3,
    content:  '回复 TA 李明的设计反馈并实施优化建议',
    due:      null,
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_07',
    email_id: 19,
    content:  '在3月8日前 RSVP Sprint Planning 会议（3月9日 10:00）',
    due:      '2026-03-08',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_08',
    email_id: 20,
    content:  '3月10日前回复 TechCorp 确认面试（3月12日14:00）',
    due:      '2026-03-10',
    status:   'done',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_09',
    email_id: 23,
    content:  '24小时内登录支付宝确认 David Li 的 ¥2,450 转账',
    due:      '2026-03-07',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_10',
    email_id: 24,
    content:  '3月13日下午5点前将修改后的开题报告发给 Prof. Wang Fang',
    due:      '2026-03-13',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_11',
    email_id: 24,
    content:  '周四下午2点后去实验室找 Prof. Wang Fang 讨论论文',
    due:      '2026-03-12',
    status:   'pending',
    source:   'ai_extracted',
  },
  {
    task_id:  'task_12',
    email_id: 26,
    content:  '准备组会分享（MailMind AI 搜索，约20分钟，3月12日 15:00）',
    due:      '2026-03-12',
    status:   'pending',
    source:   'ai_extracted',
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

/**
 * 根据当前 state 过滤邮件列表
 * 这是搜索和筛选功能未来的统一入口
 */
function getFilteredMails() {
  // AI 搜索模式：直接返回预计算的全局结果集，跳过文件夹/tab 过滤
  if (state.aiMode && state.aiResults.length) {
    return state.aiResults.map(r => r.mail);
  }

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

  // AI 模式：显示 LLM 推理说明 或 向量相似度百分比
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

  // AI 模式时，在列表顶部插入结果说明横幅
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
  const folders = ['inbox', 'drafts'];
  folders.forEach(f => {
    const badgeEl = document.getElementById(`badge-${f}`);
    if (!badgeEl) return;
    const count = mailData.filter(m => m.folder === f && m.unread).length;
    badgeEl.textContent = count;
    badgeEl.style.display = count ? 'flex' : 'none';
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
