// Turns lesson Markdown into sections (split at "##" headings) and into plain
// sentences a speech voice can read.
import { marked } from 'marked';

function inlineText(tokens = []) {
  return tokens
    .map((t) => {
      if (t.tokens) return inlineText(t.tokens);
      if (t.type === 'br') return ' ';
      if (t.type === 'image' || t.type === 'html') return '';
      return t.text ?? '';
    })
    .join('');
}

function blockLines(tokens = []) {
  const lines = [];
  for (const t of tokens) {
    switch (t.type) {
      case 'heading':
      case 'paragraph':
        lines.push(inlineText(t.tokens));
        break;
      case 'text':
        lines.push(t.tokens ? inlineText(t.tokens) : t.text);
        break;
      case 'list':
        for (const item of t.items) lines.push(...blockLines(item.tokens));
        break;
      case 'blockquote':
        lines.push(...blockLines(t.tokens));
        break;
      case 'table':
        lines.push(t.header.map((c) => inlineText(c.tokens)).join(', '));
        for (const row of t.rows) lines.push(row.map((c) => inlineText(c.tokens)).join(', '));
        break;
      default:
        break;
    }
  }
  return lines;
}

/** Adds a full stop to a line that doesn't end in punctuation, so the voice pauses. */
export function sentence(line) {
  const s = line.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return /[.!?:;]["')\]]*$/.test(s) ? s : `${s}.`;
}

/** Plain text of a Markdown snippet, one sentence per heading, paragraph or list item. */
export function markdownToSpeech(source) {
  return blockLines(marked.lexer(source ?? ''))
    .map(sentence)
    .filter(Boolean)
    .join(' ');
}

/**
 * Splits a lesson body at its "##" headings. The text before the first heading
 * becomes a section with no title. Each section keeps its Markdown source.
 */
export function splitSections(source) {
  const sections = [];
  let current = { title: null, source: '' };
  for (const t of marked.lexer(source ?? '')) {
    if (t.type === 'heading' && t.depth === 2) {
      if (current.title || current.source.trim()) sections.push(current);
      current = { title: inlineText(t.tokens), source: '' };
    } else {
      current.source += t.raw;
    }
  }
  if (current.title || current.source.trim()) sections.push(current);
  return sections;
}

/** What to say for a practice answer, e.g. "Answer: Nile. Also accept Nile River." */
export function answerSpeech(answer, acceptable) {
  let text = `Answer: ${sentence(answer)}`;
  if (acceptable?.length) text += ` Also accept ${sentence(acceptable.join(', '))}`;
  return text;
}
