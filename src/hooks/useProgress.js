// Shared progress: review boxes, lessons studied and quiz rounds.
// Always kept in localStorage. When a student is signed in it is also saved to
// their account in the database, so it follows them to any computer.
import { useSyncExternalStore, useCallback } from 'react';
import { loadProgress, saveProgress, clearProgress, storageKeyFor } from '../lib/storage.js';
import { recordAttempt } from '../lib/srs.js';
import { isEmptyProgress, markLessonStudied, mergeProgress, recordQuizRound, resetProgress } from '../lib/progress.js';
import { supabase } from '../lib/supabase.js';
import { getAuth, subscribeAuth } from './useAuth.js';

const PUSH_DELAY_MS = 1500;

let userId = null;
let current = loadProgress(globalThis.localStorage, storageKeyFor(null));
// sync: 'local' (not signed in) | 'loading' | 'saving' | 'saved' | 'error'
let sync = 'local';
let snapshot = { progress: current, sync };
const listeners = new Set();
let pushTimer = null;
let switchToken = 0;

function notify() {
  snapshot = { progress: current, sync };
  listeners.forEach((l) => l());
}

function setSync(next) {
  if (sync !== next) {
    sync = next;
    notify();
  }
}

function set(next) {
  if (next === current) return;
  current = next;
  saveProgress(current, globalThis.localStorage, storageKeyFor(userId));
  if (userId) schedulePush();
  notify();
}

function schedulePush() {
  clearTimeout(pushTimer);
  sync = 'saving';
  pushTimer = setTimeout(push, PUSH_DELAY_MS);
}

async function push() {
  clearTimeout(pushTimer);
  pushTimer = null;
  if (!userId || !supabase) return;
  const id = userId;
  const data = current;
  const { error } = await supabase
    .from('progress')
    .upsert({ user_id: id, data, updated_at: new Date().toISOString() });
  if (id !== userId) return;
  if (error) {
    console.warn('Could not save progress', error);
    setSync('error');
  } else if (!pushTimer) {
    setSync('saved');
  }
}

/** Saves right away if a save is waiting (before sign-out or leaving the page). */
export function flushProgress() {
  return pushTimer ? push() : Promise.resolve();
}

async function switchUser(user) {
  const token = ++switchToken;
  clearTimeout(pushTimer);
  pushTimer = null;

  if (!user) {
    // Leave nothing behind for the next student on a shared computer, unless
    // there are changes the server never got.
    if (userId && sync === 'saved') clearProgress(globalThis.localStorage, storageKeyFor(userId));
    userId = null;
    current = loadProgress(globalThis.localStorage, storageKeyFor(null));
    sync = 'local';
    notify();
    return;
  }

  // Progress made before signing in joins the account, then the guest copy is
  // cleared so the next student on this computer starts fresh.
  const guestKey = storageKeyFor(null);
  const guest = loadProgress(globalThis.localStorage, guestKey);
  userId = user.id;
  current = mergeProgress(loadProgress(globalThis.localStorage, storageKeyFor(userId)), guest);
  saveProgress(current, globalThis.localStorage, storageKeyFor(userId));
  if (!isEmptyProgress(guest)) clearProgress(globalThis.localStorage, guestKey);
  sync = 'loading';
  notify();

  const { data, error } = await supabase.from('progress').select('data').eq('user_id', user.id).maybeSingle();
  if (token !== switchToken) return;
  if (error) {
    console.warn('Could not load progress', error);
    setSync('error');
    return;
  }
  const merged = data?.data ? mergeProgress(data.data, current) : current;
  current = merged;
  saveProgress(current, globalThis.localStorage, storageKeyFor(userId));
  notify();
  await push();
}

if (supabase) {
  subscribeAuth((auth) => {
    if ((auth.user?.id ?? null) !== userId) switchUser(auth.user);
  });
  const auth = getAuth();
  if (auth.user) switchUser(auth.user);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushProgress();
    });
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress() {
  const { progress, sync: syncState } = useSyncExternalStore(subscribe, () => snapshot);
  const record = useCallback((question, correct) => set(recordAttempt(current, question, correct)), []);
  const recordLesson = useCallback((subjectId, lessonId) => set(markLessonStudied(current, subjectId, lessonId)), []);
  const recordRound = useCallback((tally, info) => set(recordQuizRound(current, tally, info)), []);
  const reset = useCallback(() => set(resetProgress()), []);
  return { progress, sync: syncState, record, recordLesson, recordRound, reset };
}
