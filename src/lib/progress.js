// Everything a student's progress holds besides the review boxes in srs.js:
// lessons studied and finished quiz rounds. Also merges two copies of progress
// (this browser and the account in the database) without losing either.
import { emptyProgress } from './srs.js';

export const MAX_QUIZZES = 200;

/** Fills in fields that older saved progress does not have. */
export function normalizeProgress(p) {
  const base = emptyProgress();
  if (!p || typeof p !== 'object') return base;
  return {
    ...base,
    ...p,
    version: 1,
    questions: p.questions && typeof p.questions === 'object' ? p.questions : {},
    lessons: p.lessons && typeof p.lessons === 'object' ? p.lessons : {},
    quizzes: Array.isArray(p.quizzes) ? p.quizzes : [],
  };
}

export function isEmptyProgress(p) {
  const n = normalizeProgress(p);
  return !Object.keys(n.questions).length && !Object.keys(n.lessons).length && !n.quizzes.length;
}

export const lessonKey = (subjectId, lessonId) => `${subjectId}/${lessonId}`;

/** Records that a lesson was opened. Returns the same object if nothing changed much. */
export function markLessonStudied(progress, subjectId, lessonId, now = Date.now()) {
  const p = normalizeProgress(progress);
  const key = lessonKey(subjectId, lessonId);
  const prev = p.lessons[key];
  // One visit per minute is enough; avoids saving on every re-render.
  if (prev && now - prev.lastAt < 60_000) return progress;
  const next = { firstAt: prev?.firstAt ?? now, lastAt: now, visits: (prev?.visits ?? 0) + 1 };
  return { ...p, lessons: { ...p.lessons, [key]: next } };
}

/**
 * Adds a finished quiz round.
 * @param {{points:number, power:number, correct:number, neg:number, wrong:number, dead:number}} tally
 */
export function recordQuizRound(progress, tally, { total, subjects }, now = Date.now()) {
  const p = normalizeProgress(progress);
  const round = {
    at: now,
    points: tally.points,
    power: tally.power,
    correct: tally.correct,
    neg: tally.neg,
    missed: tally.wrong + tally.dead,
    total,
    subjects,
  };
  return { ...p, quizzes: [...p.quizzes, round].slice(-MAX_QUIZZES) };
}

/** Marks the moment progress was erased, so older copies on other devices don't bring it back. */
export function resetProgress(now = Date.now()) {
  return { ...emptyProgress(), resetAt: now };
}

function newer(a, b) {
  if (!a) return b;
  if (!b) return a;
  if ((a.lastSeen ?? 0) !== (b.lastSeen ?? 0)) return (a.lastSeen ?? 0) > (b.lastSeen ?? 0) ? a : b;
  return (a.attempts ?? 0) >= (b.attempts ?? 0) ? a : b;
}

/** Merges two copies of progress. Neither input is changed. */
export function mergeProgress(a, b) {
  const x = normalizeProgress(a);
  const y = normalizeProgress(b);
  const resetAt = Math.max(x.resetAt ?? 0, y.resetAt ?? 0);
  const keep = (t) => (t ?? 0) >= resetAt;

  const questions = {};
  for (const id of new Set([...Object.keys(x.questions), ...Object.keys(y.questions)])) {
    const e = newer(x.questions[id], y.questions[id]);
    if (keep(e.lastSeen)) questions[id] = e;
  }

  const lessons = {};
  for (const key of new Set([...Object.keys(x.lessons), ...Object.keys(y.lessons)])) {
    const l = x.lessons[key];
    const m = y.lessons[key];
    const e =
      l && m
        ? { firstAt: Math.min(l.firstAt, m.firstAt), lastAt: Math.max(l.lastAt, m.lastAt), visits: Math.max(l.visits ?? 1, m.visits ?? 1) }
        : l ?? m;
    if (keep(e.lastAt)) lessons[key] = e;
  }

  const byTime = new Map();
  for (const q of [...x.quizzes, ...y.quizzes]) if (keep(q.at)) byTime.set(q.at, q);
  const quizzes = [...byTime.values()].sort((s, t) => s.at - t.at).slice(-MAX_QUIZZES);

  const merged = { version: 1, questions, lessons, quizzes };
  if (resetAt) merged.resetAt = resetAt;
  return merged;
}
