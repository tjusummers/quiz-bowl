import { describe, expect, it } from 'vitest';
import { isEmptyProgress, markLessonStudied, mergeProgress, normalizeProgress, recordQuizRound, resetProgress } from './progress.js';
import { emptyProgress, recordAttempt } from './srs.js';

const q1 = { id: 'sci-1', subjectId: 'science' };
const q2 = { id: 'his-1', subjectId: 'history' };
const tally = { points: 25, power: 1, correct: 1, neg: 0, wrong: 1, dead: 0 };

describe('progress', () => {
  it('upgrades older saved progress', () => {
    const old = { version: 1, questions: { a: { attempts: 1 } } };
    expect(normalizeProgress(old)).toEqual({ version: 1, questions: { a: { attempts: 1 } }, lessons: {}, quizzes: [] });
    expect(isEmptyProgress(old)).toBe(false);
    expect(isEmptyProgress(null)).toBe(true);
  });

  it('records lesson visits at most once a minute', () => {
    let p = markLessonStudied(emptyProgress(), 'science', 'cells', 1000);
    expect(p.lessons['science/cells']).toEqual({ firstAt: 1000, lastAt: 1000, visits: 1 });
    expect(markLessonStudied(p, 'science', 'cells', 2000)).toBe(p);
    p = markLessonStudied(p, 'science', 'cells', 70_000);
    expect(p.lessons['science/cells']).toEqual({ firstAt: 1000, lastAt: 70_000, visits: 2 });
  });

  it('records quiz rounds', () => {
    const p = recordQuizRound(emptyProgress(), tally, { total: 2, subjects: ['science'] }, 5);
    expect(p.quizzes).toEqual([{ at: 5, points: 25, power: 1, correct: 1, neg: 0, missed: 1, total: 2, subjects: ['science'] }]);
  });

  it('merges two devices without losing work', () => {
    let a = recordAttempt(emptyProgress(), q1, false, 100);
    a = markLessonStudied(a, 'science', 'cells', 100);
    a = recordQuizRound(a, tally, { total: 2, subjects: [] }, 100);
    let b = recordAttempt(emptyProgress(), q2, true, 200);
    b = recordAttempt(b, q1, true, 300);
    b = markLessonStudied(b, 'science', 'cells', 400);
    b = recordQuizRound(b, tally, { total: 2, subjects: [] }, 200);

    const m = mergeProgress(a, b);
    expect(Object.keys(m.questions).sort()).toEqual(['his-1', 'sci-1']);
    expect(m.questions['sci-1'].lastSeen).toBe(300);
    expect(m.lessons['science/cells']).toEqual({ firstAt: 100, lastAt: 400, visits: 1 });
    expect(m.quizzes.map((q) => q.at)).toEqual([100, 200]);
    expect(mergeProgress(b, a)).toEqual(m);
    expect(mergeProgress(m, m)).toEqual(m);
  });

  it('a reset wins over older copies', () => {
    const old = recordAttempt(emptyProgress(), q1, false, 100);
    const fresh = recordAttempt(resetProgress(150), q2, false, 200);
    const m = mergeProgress(old, fresh);
    expect(Object.keys(m.questions)).toEqual(['his-1']);
    expect(m.resetAt).toBe(150);
  });
});
