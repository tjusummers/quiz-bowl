import { describe, it, expect } from 'vitest';
import { emptyProgress, recordAttempt, dueQuestionIds, reviewQuestionIds, subjectStats, topicStats, DAY, MASTERED_BOX } from './srs.js';
import { loadProgress, saveProgress, STORAGE_KEY } from './storage.js';

const q1 = { id: 'sci-1', subjectId: 'science', topic: 'Biology' };
const q2 = { id: 'sci-2', subjectId: 'science', topic: 'Physics' };
const q3 = { id: 'his-1', subjectId: 'history', topic: 'Ancient' };
const T = 1_700_000_000_000;

describe('spaced repetition', () => {
  it('a correct first try does not enter review', () => {
    const p = recordAttempt(emptyProgress(), q1, true, T);
    expect(p.questions['sci-1']).toMatchObject({ attempts: 1, correct: 1, box: 0 });
    expect(reviewQuestionIds(p)).toEqual([]);
  });

  it('a miss is due tomorrow, then climbs boxes until mastered', () => {
    let p = recordAttempt(emptyProgress(), q1, false, T);
    expect(dueQuestionIds(p, T)).toEqual([]);
    expect(dueQuestionIds(p, T + DAY)).toEqual(['sci-1']);
    let now = T + DAY;
    for (let box = 2; box <= MASTERED_BOX; box++) {
      p = recordAttempt(p, q1, true, now);
      expect(p.questions['sci-1'].box).toBe(box);
      now = p.questions['sci-1'].due ?? now;
    }
    expect(reviewQuestionIds(p)).toEqual([]);
  });

  it('missing again resets to box 1', () => {
    let p = recordAttempt(emptyProgress(), q1, false, T);
    p = recordAttempt(p, q1, true, T + DAY);
    p = recordAttempt(p, q1, false, T + 2 * DAY);
    expect(p.questions['sci-1'].box).toBe(1);
  });

  it('orders due questions by most overdue', () => {
    let p = recordAttempt(emptyProgress(), q2, false, T + 1000);
    p = recordAttempt(p, q1, false, T);
    expect(dueQuestionIds(p, T + 2 * DAY)).toEqual(['sci-1', 'sci-2']);
  });

  it('computes subject and topic stats', () => {
    let p = recordAttempt(emptyProgress(), q1, false, T);
    p = recordAttempt(p, q2, true, T);
    const subj = subjectStats(p, [q1, q2, q3], T + DAY);
    const sci = subj.find((s) => s.subjectId === 'science');
    expect(sci).toMatchObject({ total: 2, seen: 2, attempts: 2, correct: 1, toReview: 1, due: 1, accuracy: 0.5 });
    expect(subj.find((s) => s.subjectId === 'history').accuracy).toBeNull();
    const topics = topicStats(p, [q1, q2, q3], T);
    expect(topics.map((t) => t.topic)).toEqual(['Biology', 'Physics', 'Ancient']);
  });
});

describe('storage', () => {
  const memory = () => {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  };
  it('round-trips progress', () => {
    const s = memory();
    const p = recordAttempt(emptyProgress(), q1, false, T);
    saveProgress(p, s);
    expect(loadProgress(s)).toEqual(p);
  });
  it('survives corrupt data and throwing storage', () => {
    const s = memory();
    s.setItem(STORAGE_KEY, '{not json');
    expect(loadProgress(s)).toEqual(emptyProgress());
    const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(loadProgress(broken)).toEqual(emptyProgress());
    expect(saveProgress(emptyProgress(), broken)).toBe(false);
  });
});
