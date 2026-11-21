// Browser storage for review progress. Every access is guarded: storage can be
// missing or throw in private windows, so the app keeps working without it.
import { emptyProgress } from './srs.js';

export const STORAGE_KEY = 'quizbowl.progress.v1';

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && parsed.questions) return parsed;
  } catch {
    /* fall through */
  }
  return emptyProgress();
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
