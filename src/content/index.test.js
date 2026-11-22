import { describe, expect, it } from 'vitest';
import {
  getAllBonuses,
  getAllTossups,
  getLesson,
  getLessonsByTopic,
  getQuestionsForLesson,
  getSubject,
  getSubjects,
} from './index.js';

describe('content loader', () => {
  it('loads all eight subjects in display order', () => {
    expect(getSubjects().map((s) => s.id)).toEqual([
      'science',
      'history',
      'literature',
      'geography',
      'fine-arts',
      'math',
      'mythology',
      'current-events',
    ]);
  });

  it('finds subjects and lessons by id', () => {
    const science = getSubject('science');
    expect(science.name).toBe('Science');
    const first = science.lessons[0];
    expect(getLesson('science', first.id)).toBe(first);
    expect(getLesson('science', 'nope')).toBeUndefined();
    expect(getSubject('nope')).toBeUndefined();
  });

  it('groups every lesson under its topic', () => {
    for (const s of getSubjects()) {
      const groups = getLessonsByTopic(s.id);
      expect(groups.flatMap((g) => g.lessons)).toHaveLength(s.lessons.length);
      for (const g of groups) expect(g.lessons.every((l) => l.topic === g.topic)).toBe(true);
    }
  });

  it('tags flattened questions with their subject', () => {
    const tossups = getAllTossups();
    expect(tossups.length).toBeGreaterThan(0);
    expect(tossups.every((q) => getSubject(q.subjectId))).toBe(true);
    expect(getAllBonuses().every((q) => getSubject(q.subjectId))).toBe(true);
  });

  it('returns the questions for a lesson', () => {
    const q = getAllTossups()[0];
    const { tossups } = getQuestionsForLesson(q.subjectId, q.lessonId);
    expect(tossups.map((t) => t.id)).toContain(q.id);
  });
});
