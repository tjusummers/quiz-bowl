// Quiz bowl tossup scoring.
export const POWER_MARK = '(*)';
export const POINTS = { power: 15, correct: 10, neg: -5, wrong: 0 };

/**
 * Split question text into display words and find where power ends.
 * @param {string} question
 * @param {number|null} [powerChar] character index in `question` where power ends
 * @returns {{words:string[], powerIndex:number}} powerIndex is the number of words
 *   inside power (buzzing with that many or fewer words shown earns power), or -1.
 */
export function tokenize(question, powerChar = null) {
  const text = String(question ?? '');
  const words = [];
  let powerIndex = -1;
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) {
    const word = m[0] === POWER_MARK ? '' : m[0].replace(POWER_MARK, '');
    if (m[0].includes(POWER_MARK) && powerIndex < 0) powerIndex = words.length + (word ? 1 : 0);
    if (!word) continue;
    if (powerChar != null && powerIndex < 0 && m.index >= powerChar) powerIndex = words.length;
    words.push(word);
  }
  if (powerChar != null && powerIndex < 0 && powerChar >= text.length) powerIndex = words.length;
  return { words, powerIndex };
}

/**
 * @param {object} p
 * @param {boolean} p.correct
 * @param {number} p.wordsRevealed words shown when the player buzzed
 * @param {number} p.totalWords
 * @param {number} p.powerIndex from tokenize()
 * @returns {{points:number, kind:'power'|'correct'|'neg'|'wrong'}}
 */
export function scoreBuzz({ correct, wordsRevealed, totalWords, powerIndex }) {
  if (correct) {
    const inPower = powerIndex > 0 && wordsRevealed <= powerIndex;
    return inPower ? { points: POINTS.power, kind: 'power' } : { points: POINTS.correct, kind: 'correct' };
  }
  const interrupted = wordsRevealed < totalWords;
  return interrupted ? { points: POINTS.neg, kind: 'neg' } : { points: POINTS.wrong, kind: 'wrong' };
}
