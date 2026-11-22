import { describe, it, expect } from 'vitest';
import { checkAnswer, normalize } from './answer.js';

describe('normalize', () => {
  it('drops case, accents, punctuation and leading articles', () => {
    expect(normalize('  The Café-Society! ')).toBe('cafe society');
  });
});

describe('checkAnswer', () => {
  it('accepts exact and alternate answers', () => {
    expect(checkAnswer('photosynthesis', 'Photosynthesis')).toBe(true);
    expect(checkAnswer('USA', 'United States', ['USA', 'America'])).toBe(true);
  });
  it('allows small typos on longer answers', () => {
    expect(checkAnswer('photosynthsis', 'photosynthesis')).toBe(true);
    expect(checkAnswer('fotosinthasis', 'photosynthesis')).toBe(false);
  });
  it('is strict on short answers', () => {
    expect(checkAnswer('Fe', 'Fe')).toBe(true);
    expect(checkAnswer('Fa', 'Fe')).toBe(false);
  });
  it('accepts a surname for a full name', () => {
    expect(checkAnswer('lincoln', 'Abraham Lincoln')).toBe(true);
  });
  it('rejects empty responses', () => {
    expect(checkAnswer('   ', 'Mars')).toBe(false);
  });
});
