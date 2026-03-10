/* ============================================================
   MailMind — AI 优先级分类引擎
   ai-priority.js: 本地规则 + 启发式评分，将收件箱邮件分为高/中/低三类
   由 index.html 引入，需在 mail-data.js 之后、app.js 之前加载
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   SECTION 1: 信号词库
   ────────────────────────────────────────────────────────────── */

const AI_HIGH_SIGNALS = [
  // 中文紧急词
  '截止', '到期', '过期', '紧急', '重要', '必须', '请务必', '尽快', '立即',
  '提醒', '警告', '待确认', '待处理', '请及时', '尽快处理', '不得迟误',
  '面试', '开题', '论文', '还款', '换卡', '报名截止', 'action required',
  // 英文紧急词
  'deadline', 'urgent', 'immediately', 'asap', 'action required',
  'expires', 'due date', 'rsvp', 'confirm', '确认',
];

const AI_LOW_SIGNALS = [
  // 中文低优先级
  '已完成', '已签收', '支付成功', '行程完成', '话题有更新', '订单已完成',
  '已发货', '周榜', '推荐', '热门', '摘要', '周报', '月报',
  // 英文低优先级
  'weekly', 'digest', 'newsletter', 'unsubscribe', 'summary', 'recap',
  'discover', 'top stories', 'viewed your profile', 'you have been selected',
  'congratulations', 'deals near you', 'sale', 'off this weekend',
];

/* ──────────────────────────────────────────────────────────────
   SECTION 2: 单封邮件评分算法
   ────────────────────────────────────────────────────────────── */

/**
 * 对单封邮件计算 AI 优先级分数（0–100）
 * 返回 { level: 'high'|'medium'|'low', score: number, reason: string }
 */
function _computeMailPriority(mail) {
  let score = 40; // 中性基准
  const factors = [];

  const subjectL = mail.subject.toLowerCase();
  const previewL = mail.preview.toLowerCase();
  const combined = subjectL + ' ' + previewL;

  // ── 1. 高优先级信号词 ──
  let highHits = 0;
  for (const kw of AI_HIGH_SIGNALS) {
    if (combined.includes(kw)) {
      score += 14;
      highHits++;
      if (highHits <= 1) factors.push(`检测到紧急信号词 "${kw}"`);
    }
  }

  // ── 2. 低优先级信号词 ──
  let lowHits = 0;
  for (const kw of AI_LOW_SIGNALS) {
    if (combined.includes(kw)) {
      score -= 12;
      lowHits++;
      if (lowHits <= 1) factors.push(`检测到低优先信号词 "${kw}"`);
    }
  }

  // ── 3. 标签权重 ──
  if (mail.tags.includes('urgent'))  { score += 25; factors.push('标记为紧急'); }
  if (mail.tags.includes('finance')) { score += 8;  factors.push('财务类邮件'); }
  if (mail.tags.includes('info'))    score -= 6;
  if (mail.tags.includes('personal') && !mail.tags.includes('urgent')) score -= 2;

  // ── 4. 邮件分类权重 ──
  if (mail.category === 'work')         score += 12;
  if (mail.category === 'finance')      score += 10;
  if (mail.category === 'personal')     score += 4;
  if (mail.category === 'notification') score -= 14;
  if (mail.category === 'spam')         score -= 50;

  // ── 5. 实体数据（行动项 & 明确截止日期） ──
  const hasActions = mail.entities?.actions?.length > 0;
  const hasDates   = mail.entities?.dates?.length   > 0;
  if (hasActions) { score += 12; factors.push('含有待办行动项'); }
  if (hasDates)   { score += 10; factors.push('包含明确截止日期'); }

  // ── 6. 手动标记与星标 ──
  if (mail.flagged) { score += 18; factors.push('已手动标记'); }
  if (mail.starred) { score += 6; }

  // ── 7. 未读状态微加分 ──
  if (mail.unread) score += 4;

  // ── 8. 发件人类型推断 ──
  const senderEmail = mail.from.email.toLowerCase();
  const isInstitution = senderEmail.endsWith('.edu') || senderEmail.endsWith('.gov');
  if (isInstitution) { score += 8; factors.push('来自机构邮箱'); }

  // ── 映射到三档 ──
  score = Math.min(100, Math.max(0, score));
  let level;
  if (score >= 72)      level = 'high';
  else if (score >= 38) level = 'medium';
  else                  level = 'low';

  // ── 生成主要判断原因 ──
  let reason;
  if (factors.length > 0) {
    reason = factors[0];
  } else if (level === 'high') {
    reason = '综合评估为高优先级';
  } else if (level === 'medium') {
    reason = '综合评估为中等优先级';
  } else {
    reason = '综合评估为低优先级';
  }

  return { level, score, reason };
}

/* ──────────────────────────────────────────────────────────────
   SECTION 3: 批量分类与缓存
   ────────────────────────────────────────────────────────────── */

/** 分类结果缓存: mailId → { level, score, reason } */
const _priorityCache = new Map();
let _classificationReady = false;

/**
 * 对所有收件箱邮件执行一次性分类（本地运算，立即完成）
 */
function classifyAllMails() {
  _priorityCache.clear();
  const inboxMails = mailData.filter(m => m.folder === 'inbox');
  inboxMails.forEach(mail => {
    _priorityCache.set(mail.id, _computeMailPriority(mail));
  });
  _classificationReady = true;
  console.log(`[MailMind AI] 优先级分类完成，共处理 ${inboxMails.length} 封收件箱邮件`);
}

/**
 * 获取单封邮件的 AI 优先级分类结果
 * @param {number} mailId
 * @returns {{ level: 'high'|'medium'|'low', score: number, reason: string } | null}
 */
function getMailPriority(mailId) {
  if (!_classificationReady) classifyAllMails();
  return _priorityCache.get(mailId) ?? null;
}

/**
 * 根据优先级等级筛选邮件
 * @param {'high'|'medium'|'low'} level
 * @returns {Array} 从新到旧排序的邮件数组
 */
function getMailsByPriority(level) {
  if (!_classificationReady) classifyAllMails();
  return mailData
    .filter(m => {
      if (m.folder !== 'inbox') return false;
      const p = _priorityCache.get(m.id);
      return p && p.level === level;
    })
    .sort((a, b) => {
      // 同优先级内按 score 降序，再按时间降序
      const pa = _priorityCache.get(a.id);
      const pb = _priorityCache.get(b.id);
      if (pb.score !== pa.score) return pb.score - pa.score;
      return b.date - a.date;
    });
}

/**
 * 获取各优先级邮件数量（用于徽章）
 * @returns {{ high: number, medium: number, low: number }}
 */
function getPriorityCounts() {
  if (!_classificationReady) classifyAllMails();
  const counts = { high: 0, medium: 0, low: 0 };
  for (const [, result] of _priorityCache) {
    counts[result.level]++;
  }
  return counts;
}

/* 立即执行初始分类（本地计算，耗时 < 1ms） */
classifyAllMails();
