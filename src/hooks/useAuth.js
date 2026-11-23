// Who is signed in. A tiny shared store over Supabase Auth.
import { useSyncExternalStore } from 'react';
import { accountsEnabled, supabase } from '../lib/supabase.js';
import { normalizeUsername, usernameToEmail } from '../lib/account.js';

// status: 'disabled' (no database set up) | 'loading' | 'signedOut' | 'signedIn'
let state = accountsEnabled ? { status: 'loading', user: null } : { status: 'disabled', user: null };
const listeners = new Set();

function toUser(u) {
  return u ? { id: u.id, username: u.user_metadata?.username ?? u.email?.split('@')[0] ?? 'student' } : null;
}

function setSession(session) {
  const user = toUser(session?.user);
  if (state.user?.id === user?.id && state.status !== 'loading') return;
  state = { status: user ? 'signedIn' : 'signedOut', user };
  listeners.forEach((l) => l(state));
}

if (supabase) {
  supabase.auth.getSession().then(({ data }) => setSession(data.session), () => setSession(null));
  supabase.auth.onAuthStateChange((_event, session) => setSession(session));
}

export function getAuth() {
  return state;
}

export function subscribeAuth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuth);
}

export async function signUp(username, password) {
  const name = normalizeUsername(username);
  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(name),
    password,
    options: { data: { username: name } },
  });
  if (error) throw error;
  if (!data.session) {
    // Supabase is still asking for email confirmation, which can never arrive.
    throw new Error('Account made, but sign-in is blocked: email confirmation is still turned on. Ask the site owner.');
  }
}

export async function signIn(username, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Deletes the account and everything saved with it. */
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
