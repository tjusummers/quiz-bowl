import { describe, it, expect } from 'vitest';
import { chunkWords, wordAt, rateFor, loadReadAloud, saveReadAloud } from './speech.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

describe('chunkWords', () => {
  it('splits at sentence ends and tracks word offsets', () => {
    const words = ['This', 'man', 'won.', 'For', '10', 'points,', 'name', 'him.'];
    const chunks = chunkWords(words);
    expect(chunks.map((c) => c.text)).toEqual(['This man won.', 'For 10 points, name him.']);
    expect(chunks[1].first).toBe(3);
    expect(chunks[1].starts).toEqual([0, 4, 7, 15, 20]);
  });

  it('caps chunk length and can start mid-question', () => {
    const words = Array.from({ length: 7 }, (_, i) => `w${i}`);
    const chunks = chunkWords(words, 2, 3);
    expect(chunks.map((c) => c.first)).toEqual([2, 5]);
    expect(chunks.map((c) => c.text)).toEqual(['w2 w3 w4', 'w5 w6']);
  });

  it('returns nothing when there is nothing left to read', () => {
    expect(chunkWords(['a'], 1)).toEqual([]);
  });
});

describe('wordAt', () => {
  it('maps a character offset to the word containing it', () => {
    const starts = [0, 4, 7];
    expect(wordAt(starts, 0)).toBe(0);
    expect(wordAt(starts, 5)).toBe(1);
    expect(wordAt(starts, 7)).toBe(2);
    expect(wordAt(starts, 99)).toBe(2);
  });
});

describe('settings', () => {
  it('reads aloud by default and remembers the choice', () => {
    const s = memoryStorage();
    expect(loadReadAloud(s)).toBe(true);
    saveReadAloud(false, s);
    expect(loadReadAloud(s)).toBe(false);
    saveReadAloud(true, s);
    expect(loadReadAloud(s)).toBe(true);
  });

  it('survives storage that throws', () => {
    const bad = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); } };
    expect(loadReadAloud(bad)).toBe(true);
    expect(() => saveReadAloud(false, bad)).not.toThrow();
  });

  it('maps reading speeds to voice rates', () => {
    expect(rateFor(450)).toBeLessThan(rateFor(300));
    expect(rateFor(180)).toBeGreaterThan(rateFor(300));
    expect(rateFor(123)).toBe(1);
  });
});
