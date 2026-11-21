// Checks every src/content/<subject>.json against the format in docs/CONTENT_FORMAT.md.
// Usage: npm run validate
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const errors = [];
const seenIds = new Map();

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isStrArray = (v) => Array.isArray(v) && v.every(isStr);

function claimId(id, where) {
  if (!isStr(id)) return errors.push(`${where}: missing "id"`);
  if (seenIds.has(id)) errors.push(`${where}: id "${id}" already used in ${seenIds.get(id)}`);
  else seenIds.set(id, where);
}

function req(obj, field, check, where, desc) {
  if (!check(obj[field])) errors.push(`${where}: "${field}" must be ${desc}`);
}

function checkQuestionCommon(q, where, lessonIds) {
  claimId(q.id, where);
  req(q, 'topic', isStr, where, 'a non-empty string');
  req(q, 'difficulty', (v) => DIFFICULTIES.includes(v), where, DIFFICULTIES.join(' | '));
  if (q.lessonId != null && !lessonIds.has(q.lessonId))
    errors.push(`${where}: lessonId "${q.lessonId}" is not a lesson in this file`);
  if (q.tags !== undefined) req(q, 'tags', isStrArray, where, 'an array of strings');
}

const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
if (files.length === 0) errors.push('no subject files found in src/content');

for (const file of files) {
  let s;
  try {
    s = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON (${e.message})`);
    continue;
  }
  const where = file;
  if (s.id !== file.replace(/\.json$/, '')) errors.push(`${file}: "id" must match the file name`);
  req(s, 'name', isStr, where, 'a non-empty string');
  req(s, 'icon', isStr, where, 'an emoji');
  req(s, 'description', isStr, where, 'a non-empty string');
  for (const key of ['lessons', 'tossups', 'bonuses'])
    if (!Array.isArray(s[key])) errors.push(`${file}: "${key}" must be an array`);
  if (!Array.isArray(s.lessons)) continue;

  const lessonIds = new Set();
  s.lessons.forEach((l, i) => {
    const w = `${file} lessons[${i}]${l.id ? ` (${l.id})` : ''}`;
    claimId(l.id, w);
    lessonIds.add(l.id);
    req(l, 'title', isStr, w, 'a non-empty string');
    req(l, 'topic', isStr, w, 'a non-empty string');
    req(l, 'difficulty', (v) => DIFFICULTIES.includes(v), w, DIFFICULTIES.join(' | '));
    req(l, 'body', isStr, w, 'Markdown text');
    req(l, 'keyFacts', isStrArray, w, 'an array of strings');
  });

  (s.tossups ?? []).forEach((q, i) => {
    const w = `${file} tossups[${i}]${q.id ? ` (${q.id})` : ''}`;
    checkQuestionCommon(q, w, lessonIds);
    req(q, 'question', isStr, w, 'a non-empty string');
    req(q, 'answer', isStr, w, 'a non-empty string');
    req(q, 'acceptable', Array.isArray, w, 'an array (may be empty)');
    const p = q.powerIndex;
    if (p !== null && !(Number.isInteger(p) && p > 0 && isStr(q.question) && p < q.question.length))
      errors.push(`${w}: "powerIndex" must be null or an index inside "question"`);
  });

  (s.bonuses ?? []).forEach((b, i) => {
    const w = `${file} bonuses[${i}]${b.id ? ` (${b.id})` : ''}`;
    checkQuestionCommon(b, w, lessonIds);
    req(b, 'leadin', isStr, w, 'a non-empty string');
    if (!Array.isArray(b.parts) || b.parts.length === 0) errors.push(`${w}: "parts" must be a non-empty array`);
    (b.parts ?? []).forEach((p, j) => {
      const pw = `${w} parts[${j}]`;
      req(p, 'question', isStr, pw, 'a non-empty string');
      req(p, 'answer', isStr, pw, 'a non-empty string');
      req(p, 'acceptable', Array.isArray, pw, 'an array (may be empty)');
    });
  });
}

if (errors.length) {
  console.error(`Content check failed with ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`Content OK: ${files.length} subject files, ${seenIds.size} ids.`);
