// Browser storage for progress. Every access is guarded: storage can be
// missing or throw in private windows, so the app keeps working without it.
// Guests use one key; each signed-in account keeps its own copy, so students
// sharing a computer don't see each other's progress.
import { emptyProgress } from './srs.js';
import { normalizeProgress } from './progress.js';

export const STORAGE_KEY = 'quizbowl.progress.v1';

export const storageKeyFor = (userId) => (userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY);

export function loadProgress(storage = globalThis.localStorage, key = STORAGE_KEY) {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && parsed.questions) return normalizeProgress(parsed);
  } catch {
    /* fall through */
  }
  return emptyProgress();
}

export function saveProgress(progress, storage = globalThis.localStorage, key = STORAGE_KEY) {
  try {
    storage?.setItem(key, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(storage = globalThis.localStorage, key = STORAGE_KEY) {
  try {
    storage?.removeItem(key);
  } catch {
    /* ignore */
  }
}
