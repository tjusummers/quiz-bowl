// Simple Leitner-style spaced repetition.
// A missed question goes to box 1 and comes back tomorrow; each correct review
// moves it up a box and pushes it further out. Box 5 counts as mastered.

export const DAY = 24 * 60 * 60 * 1000;
export const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];
export const MASTERED_BOX = 5;

export function emptyProgress() {
  return { version: 1, questions: {} };
}

/**
 * Record one attempt. Returns a new progress object (does not mutate).
 * @param {object} progress
 * @param {{id:string, subjectId:string}} question
 * @param {boolean} correct
 * @param {number} now ms timestamp
 */
export function recordAttempt(progress, question, correct, now = Date.now()) {
  const prev = progress.questions[question.id] ?? {
    subject: question.subjectId,
    attempts: 0,
    correct: 0,
    box: 0,
    due: null,
    lastSeen: null,
  };
  const next = { ...prev, subject: question.subjectId, attempts: prev.attempts + 1, lastSeen: now };
  if (correct) {
    next.correct = prev.correct + 1;
    // Only questions already in review move through boxes.
    if (prev.box > 0) {
      next.box = Math.min(prev.box + 1, MASTERED_BOX);
      next.due = next.box >= MASTERED_BOX ? null : now + INTERVAL_DAYS[next.box] * DAY;
    }
  } else {
    next.box = 1;
    next.due = now + INTERVAL_DAYS[1] * DAY;
  }
  return { ...progress, questions: { ...progress.questions, [question.id]: next } };
}

export function inReview(entry) {
  return entry.box > 0 && entry.box < MASTERED_BOX;
}

/** Ids of questions due for review now, most overdue first. */
export function dueQuestionIds(progress, now = Date.now()) {
  return Object.entries(progress.questions)
    .filter(([, e]) => inReview(e) && e.due != null && e.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

/** All ids currently in the review pile (due or not). */
export function reviewQuestionIds(progress) {
  return Object.entries(progress.questions)
    .filter(([, e]) => inReview(e))
    .map(([id]) => id);
}

function groupStats(progress, questions, keyOf, labelOf, now) {
  const stats = new Map();
  for (const q of questions) {
    const key = keyOf(q);
    if (!stats.has(key)) {
      stats.set(key, { key, ...labelOf(q), total: 0, seen: 0, attempts: 0, correct: 0, toReview: 0, due: 0, mastered: 0 });
    }
    const s = stats.get(key);
    s.total++;
    const e = progress.questions[q.id];
    if (!e) continue;
    s.seen++;
    s.attempts += e.attempts;
    s.correct += e.correct;
    if (e.box >= MASTERED_BOX) s.mastered++;
    if (inReview(e)) {
      s.toReview++;
      if (e.due != null && e.due <= now) s.due++;
    }
  }
  return [...stats.values()].map((s) => ({ ...s, accuracy: s.attempts ? s.correct / s.attempts : null }));
}

/** Per-subject stats over the whole question bank. */
export function subjectStats(progress, questions, now = Date.now()) {
  return groupStats(progress, questions, (q) => q.subjectId, (q) => ({ subjectId: q.subjectId }), now);
}

/** Per-topic stats (topic within a subject). */
export function topicStats(progress, questions, now = Date.now()) {
  return groupStats(
    progress,
    questions,
    (q) => `${q.subjectId}::${q.topic ?? 'General'}`,
    (q) => ({ subjectId: q.subjectId, topic: q.topic ?? 'General' }),
    now,
  );
}
