import { describe, it, expect } from 'vitest';
import { tokenize, scoreBuzz } from './scoring.js';

describe('tokenize', () => {
  it('maps a power character index to a word count', () => {
    const q = 'This planet is red. For 10 points, name it.';
    const { words, powerIndex } = tokenize(q, q.indexOf('For'));
    expect(words).toHaveLength(9);
    expect(powerIndex).toBe(4);
  });
  it('handles an inline (*) marker', () => {
    const { words, powerIndex } = tokenize('Alpha beta (*) gamma delta');
    expect(words).toEqual(['Alpha', 'beta', 'gamma', 'delta']);
    expect(powerIndex).toBe(2);
  });
  it('reports -1 without power', () => {
    expect(tokenize('one two three', null).powerIndex).toBe(-1);
  });
});

describe('scoreBuzz', () => {
  const base = { totalWords: 10, powerIndex: 4 };
  it('gives 15 in power, 10 after', () => {
    expect(scoreBuzz({ ...base, correct: true, wordsRevealed: 3 }).points).toBe(15);
    expect(scoreBuzz({ ...base, correct: true, wordsRevealed: 4 }).points).toBe(15);
    expect(scoreBuzz({ ...base, correct: true, wordsRevealed: 5 }).points).toBe(10);
  });
  it('negs an interrupt but not a wrong answer at the end', () => {
    expect(scoreBuzz({ ...base, correct: false, wordsRevealed: 5 }).points).toBe(-5);
    expect(scoreBuzz({ ...base, correct: false, wordsRevealed: 10 }).points).toBe(0);
  });
  it('never gives power when the question has none', () => {
    expect(scoreBuzz({ totalWords: 10, powerIndex: -1, correct: true, wordsRevealed: 1 }).points).toBe(10);
  });
});
