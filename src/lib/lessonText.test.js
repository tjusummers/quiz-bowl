import { describe, it, expect } from 'vitest';
import { markdownToSpeech, splitSections, sentence, answerSpeech } from './lessonText.js';

describe('markdownToSpeech', () => {
  it('drops Markdown marks and ends each block with a stop', () => {
    const md = 'The **Nile** flows *north*\n\n- Tigris\n- Euphrates river!\n\n> A [quote](http://x)';
    expect(markdownToSpeech(md)).toBe('The Nile flows north. Tigris. Euphrates river! A quote.');
  });

  it('reads table cells row by row', () => {
    const md = '| Planet | Moons |\n| --- | --- |\n| Mars | 2 |';
    expect(markdownToSpeech(md)).toBe('Planet, Moons. Mars, 2.');
  });
});

describe('splitSections', () => {
  it('splits at level-two headings and keeps the intro', () => {
    const sections = splitSections('Intro text.\n\n## First\n\nOne.\n\n### Sub\n\nTwo.\n\n## Second\n\nThree.');
    expect(sections.map((s) => s.title)).toEqual([null, 'First', 'Second']);
    expect(sections[1].source).toContain('### Sub');
    expect(markdownToSpeech(sections[2].source)).toBe('Three.');
  });

  it('returns one untitled section when there are no headings', () => {
    expect(splitSections('Just text.')).toEqual([{ title: null, source: 'Just text.' }]);
  });
});

describe('answers', () => {
  it('reads the answer and acceptable alternatives', () => {
    expect(answerSpeech('Nile', ['Nile River'])).toBe('Answer: Nile. Also accept Nile River.');
    expect(sentence('  done?  ')).toBe('done?');
  });
});
