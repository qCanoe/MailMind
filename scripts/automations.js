'use strict';

/* ============================================================
   AUTOMATIONS — CRUD, Mock AI, Pipeline Templates
   Follows the same module structure as smart-folders.js
   ============================================================ */

// ─── Section 1: Storage ────────────────────────────────────────────────────────
const AUTO_STORAGE_KEY = 'mailmind_automations';

// ─── Section 2: Pipeline Templates ────────────────────────────────────────────
// SVG icon strings for pipeline steps (consistent with the app's SVG icon language)
var AUTO_SVG = {
  email:    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 6l7 5 7-5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  brain:    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="3" r="1.2" stroke="currentColor" stroke-width="1.2"/><circle cx="15" cy="9" r="1.2" stroke="currentColor" stroke-width="1.2"/><circle cx="3" cy="9" r="1.2" stroke="currentColor" stroke-width="1.2"/><circle cx="13.2" cy="4.8" r="1.2" stroke="currentColor" stroke-width="1.2"/><circle cx="4.8" cy="13.2" r="1.2" stroke="currentColor" stroke-width="1.2"/><line x1="9" y1="6.5" x2="9" y2="4.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="11.3" y1="9" x2="13.8" y2="9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="6.7" y1="9" x2="4.2" y2="9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="10.8" y1="7.2" x2="12.4" y2="5.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="7.2" y1="10.8" x2="5.6" y2="12.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  task:     '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 9l2.5 2.5L12.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bell:     '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 0 1 5 5v3l1.5 2H2.5L4 10V7a5 5 0 0 1 5-5z" stroke="currentColor" stroke-width="1.4"/><path d="M7 14a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.4"/></svg>',
  summary:  '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.4"/><line x1="5" y1="6" x2="13" y2="6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="5" y1="9" x2="13" y2="9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="5" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  tag:      '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 2H5a1 1 0 0 0-.7.3l-2 2A1 1 0 0 0 2 5v5l8 8 8-8-8-8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="6" cy="7" r="1" fill="currentColor"/></svg>',
  pen:      '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 2.5l2 2L5 15H3v-2L13.5 2.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  queue:    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="7.5" width="14" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="13" width="9" height="3" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>',
  search:   '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.4"/><line x1="12" y1="12" x2="16" y2="16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  alert:    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L1 15h16L9 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><line x1="9" y1="8" x2="9" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="9" cy="13" r="0.8" fill="currentColor"/></svg>',
  flag:     '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 2v14M4 2h10l-3 4.5L14 11H4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  classify: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>',
};

const AUTOMATION_TEMPLATES = {
  task: {
    key: 'task',
    name: '任务提取',
    aiReply: "好的！我已为你构建了一个 **任务提取** 流程。它将自动扫描收到的邮件，识别行动项，并将任务添加到你的待办列表。",
    steps: [
      { type: 'trigger', icon: AUTO_SVG.email,    title: '收到邮件',    description: '每封新邮件到达时触发' },
      { type: 'filter',  icon: AUTO_SVG.brain,    title: '分析内容',    description: 'AI 扫描行动项和截止日期' },
      { type: 'action',  icon: AUTO_SVG.task,     title: '创建任务',    description: '将提取的任务加入待办列表' },
      { type: 'action',  icon: AUTO_SVG.bell,     title: '发送通知',    description: '推送任务摘要通知' },
    ],
  },
  summarize: {
    key: 'summarize',
    name: '邮件摘要',
    aiReply: "好的！我已为你构建了一个 **邮件摘要** 流程。它会将长邮件压缩成简洁摘要，并自动标注到邮件头部，方便快速浏览。",
    steps: [
      { type: 'trigger', icon: AUTO_SVG.email,    title: '收到邮件',    description: '每封新邮件到达时触发' },
      { type: 'filter',  icon: AUTO_SVG.summary,  title: '生成摘要',    description: 'AI 生成简洁可读的摘要' },
      { type: 'action',  icon: AUTO_SVG.tag,      title: '标注邮件',    description: '将摘要附加到邮件头部' },
    ],
  },
  reply: {
    key: 'reply',
    name: '智能回复',
    aiReply: "好的！我已为你构建了一个 **智能回复** 流程。它将自动起草上下文相关的回复，放入待审队列，由你确认后再发送。",
    steps: [
      { type: 'trigger', icon: AUTO_SVG.email,    title: '收到邮件',    description: '每封新邮件到达时触发' },
      { type: 'filter',  icon: AUTO_SVG.pen,      title: '起草回复',    description: 'AI 撰写符合上下文的回复草稿' },
      { type: 'action',  icon: AUTO_SVG.queue,    title: '进入审核队列', description: '草稿移至待审队列等待确认' },
    ],
  },
  urgent: {
    key: 'urgent',
    name: '优先级提醒',
    aiReply: "好的！我已为你构建了一个 **优先级提醒** 流程。它将对每封邮件进行紧急程度评分，关键邮件到达时立即提醒你。",
    steps: [
      { type: 'trigger', icon: AUTO_SVG.email,    title: '收到邮件',    description: '每封新邮件到达时触发' },
      { type: 'filter',  icon: AUTO_SVG.search,   title: '优先级检查',  description: '评估紧急程度与发件人重要性' },
      { type: 'action',  icon: AUTO_SVG.alert,    title: '立即提醒',    description: '发送高优先级通知' },
      { type: 'action',  icon: AUTO_SVG.flag,     title: '标记邮件',    description: '在收件箱中标记为紧急' },
    ],
  },
  default: {
    key: 'default',
    name: '自动标签',
    aiReply: "好的！我已为你构建了一个 **自动标签** 流程。它将对每封邮件按主题和发件人分类，并自动添加对应标签。",
    steps: [
      { type: 'trigger', icon: AUTO_SVG.email,    title: '收到邮件',    description: '每封新邮件到达时触发' },
      { type: 'filter',  icon: AUTO_SVG.classify, title: '智能分类',    description: 'AI 按主题和发件人分类' },
      { type: 'action',  icon: AUTO_SVG.tag,      title: '应用标签',    description: '自动为邮件添加对应标签' },
    ],
  },
};

// ─── Section 3: CRUD ──────────────────────────────────────────────────────────
function loadAutomations() {
  try {
    return JSON.parse(localStorage.getItem(AUTO_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveAutomations(list) {
  localStorage.setItem(AUTO_STORAGE_KEY, JSON.stringify(list));
}

function createAutomation({ name, description, templateKey }) {
  const list = loadAutomations();
  const template = AUTOMATION_TEMPLATES[templateKey] || AUTOMATION_TEMPLATES.default;
  const auto = {
    id: 'auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: name.trim(),
    description: description.trim(),
    enabled: true,
    createdAt: new Date().toISOString(),
    templateKey: template.key,
    steps: template.steps,
  };
  list.push(auto);
  saveAutomations(list);
  return auto;
}

function updateAutomation(id, patch) {
  const list = loadAutomations();
  const idx = list.findIndex(function(a) { return a.id === id; });
  if (idx === -1) return null;
  Object.assign(list[idx], patch);
  saveAutomations(list);
  return list[idx];
}

function deleteAutomation(id) {
  saveAutomations(loadAutomations().filter(function(a) { return a.id !== id; }));
}

// ─── Section 4: Mock AI ───────────────────────────────────────────────────────
var AUTO_KEYWORD_MAP = [
  { keys: ['task', '任务', 'action item', '行动', 'todo', 'to-do', '待办'],         templateKey: 'task'      },
  { keys: ['summarize', '摘要', '总结', 'summary', 'brief', '简报', '概括'],         templateKey: 'summarize' },
  { keys: ['reply', '回复', 'respond', 'response', '自动回', '自动回复'],             templateKey: 'reply'     },
  { keys: ['urgent', '紧急', 'priority', '优先', 'important', 'alert', '重要', '提醒'], templateKey: 'urgent'  },
];

/**
 * Match description text to a template key.
 * Scans AUTO_KEYWORD_MAP in order; first match wins; falls back to 'default'.
 */
function matchAutomationTemplate(text) {
  var lower = text.toLowerCase();
  for (var i = 0; i < AUTO_KEYWORD_MAP.length; i++) {
    var entry = AUTO_KEYWORD_MAP[i];
    for (var j = 0; j < entry.keys.length; j++) {
      if (lower.indexOf(entry.keys[j]) !== -1) {
        return entry.templateKey;
      }
    }
  }
  return 'default';
}

/**
 * Simulate async AI processing (1.2–1.8s simulated latency).
 * Resolves with { templateKey, template, suggestedName }.
 */
function mockAiProcess(description) {
  return new Promise(function(resolve) {
    var delay = 1200 + Math.random() * 600;
    setTimeout(function() {
      var templateKey = matchAutomationTemplate(description);
      var template = AUTOMATION_TEMPLATES[templateKey];
      // Generate a short name: take first 5 words, title-case first letter
      var words = description.trim().split(/\s+/).slice(0, 5).join(' ');
      var suggestedName = words.charAt(0).toUpperCase() + words.slice(1);
      resolve({ templateKey: templateKey, template: template, suggestedName: suggestedName });
    }, delay);
  });
}

// ─── Section 5: Query API ─────────────────────────────────────────────────────
function getAutomationById(id) {
  return loadAutomations().find(function(a) { return a.id === id; }) || null;
}

// ─── Section 6: Init ──────────────────────────────────────────────────────────
function initAutomations() {
  var count = loadAutomations().length;
  if (count > 0) {
    console.log('[MailMind Auto] ' + count + ' automation(s) loaded');
  }
}

initAutomations();
