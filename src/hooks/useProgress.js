// Shared review progress, persisted to localStorage.
import { useSyncExternalStore, useCallback } from 'react';
import { loadProgress, saveProgress, clearProgress } from '../lib/storage.js';
import { emptyProgress, recordAttempt } from '../lib/srs.js';

let current = loadProgress();
const listeners = new Set();

function set(next) {
  current = next;
  saveProgress(current);
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, () => current);
  const record = useCallback((question, correct) => set(recordAttempt(current, question, correct)), []);
  const reset = useCallback(() => {
    clearProgress();
    set(emptyProgress());
  }, []);
  return { progress, record, reset };
}
