// Reads tossups aloud with the browser's built-in speech (Web Speech API),
// reporting which word is being spoken so the text reveal can follow the voice.

const SETTING_KEY = 'quizbowl.readAloud.v1';
const MAX_CHUNK_WORDS = 25; // Chrome stops long utterances after ~15s, so speak in pieces.

// Voice speed for each reading speed (keyed by the word delay in ms).
const RATES = { 450: 0.85, 300: 1, 180: 1.3 };

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function rateFor(wordMs) {
  return RATES[wordMs] ?? 1;
}

export function loadReadAloud(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(SETTING_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveReadAloud(on, storage = globalThis.localStorage) {
  try {
    storage?.setItem(SETTING_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

/**
 * Splits words into chunks that end at sentence breaks (or MAX_CHUNK_WORDS).
 * Each chunk has the text to speak, the index of its first word, and the
 * character offset where each word starts inside the text.
 */
export function chunkWords(words, start = 0, max = MAX_CHUNK_WORDS) {
  const chunks = [];
  let current = null;
  for (let i = start; i < words.length; i++) {
    if (!current) current = { first: i, text: '', starts: [] };
    if (current.text) current.text += ' ';
    current.starts.push(current.text.length);
    current.text += words[i];
    const endsSentence = /[.!?;:]["')\]]*$/.test(words[i]);
    if (endsSentence || current.starts.length >= max) {
      chunks.push(current);
      current = null;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Index of the word (within the chunk) that a boundary charIndex falls in. */
export function wordAt(starts, charIndex) {
  let lo = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] <= charIndex) lo = i;
    else break;
  }
  return lo;
}

let cachedVoice;
function pickVoice() {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null; // not loaded yet; try again next time
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang));
  cachedVoice =
    english.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ??
    english.find((v) => /en[-_]US/i.test(v.lang)) ??
    english[0] ??
    null;
  return cachedVoice;
}

/**
 * Speaks words[start..]. Calls onWord(index) as each word is spoken (when the
 * voice reports word boundaries) and onEnd() when everything has been read or
 * speech fails. Returns a stop() function; stopping does not call onEnd.
 */
export function speakWords(words, { start = 0, rate = 1, onWord, onEnd } = {}) {
  const synth = window.speechSynthesis;
  const chunks = chunkWords(words, start);
  let stopped = false;
  let finished = false;

  const finish = () => {
    if (stopped || finished) return;
    finished = true;
    onEnd?.();
  };

  synth.cancel();
  if (!chunks.length) {
    queueMicrotask(finish);
    return () => {};
  }

  const voice = pickVoice();
  chunks.forEach((chunk, n) => {
    const u = new SpeechSynthesisUtterance(chunk.text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'en-US';
    u.rate = rate;
    u.onboundary = (e) => {
      if (stopped || (e.name && e.name !== 'word')) return;
      onWord?.(chunk.first + wordAt(chunk.starts, e.charIndex));
    };
    u.onend = () => {
      if (n === chunks.length - 1) finish();
    };
    u.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') finish();
    };
    synth.speak(u);
  });
  // Some browsers start paused after a previous cancel.
  if (synth.paused) synth.resume();

  return () => {
    stopped = true;
    synth.cancel();
  };
}

/** True while the browser is still speaking or has speech queued. */
export function stillSpeaking() {
  return speechSupported() && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
}
