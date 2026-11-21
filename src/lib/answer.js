// Answer checking for typed responses.
// Lenient on purpose: middle schoolers misspell, so close-enough answers count.

const LEADING_ARTICLES = /^(the|a|an)\s+/;

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(LEADING_ARTICLES, '');
}

export function editDistance(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// Allow about one typo per five letters, never on very short answers.
function closeEnough(given, target) {
  if (target.length <= 3) return given === target;
  const allowed = Math.floor(target.length / 5);
  return editDistance(given, target) <= allowed;
}

/**
 * @param {string} response what the player typed
 * @param {string} answer canonical answer
 * @param {string[]} [accept] alternate acceptable answers
 */
export function checkAnswer(response, answer, accept = []) {
  const given = normalize(response);
  if (!given) return false;
  const targets = [answer, ...accept].map(normalize).filter(Boolean);
  for (const target of targets) {
    if (closeEnough(given, target)) return true;
    // A surname alone is fine for people ("Lincoln" for "Abraham Lincoln").
    const words = target.split(' ');
    if (words.length > 1 && given.length > 3 && closeEnough(given, words[words.length - 1])) return true;
  }
  return false;
}
