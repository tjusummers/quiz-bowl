// Usernames for students. Supabase Auth needs an email address, so a username is
// turned into an address on a domain nobody receives mail for. No email is ever
// sent, and students never type or see it.

export const USERNAME_RULES = '3 to 20 letters, numbers or underscores';
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD = 6;

const DOMAIN = import.meta.env?.VITE_ACCOUNT_EMAIL_DOMAIN || 'students.quizbowl.local';

export function normalizeUsername(name) {
  return String(name ?? '').trim().toLowerCase();
}

/** Returns an error message, or null when the username is fine. */
export function usernameError(name) {
  const u = normalizeUsername(name);
  if (!u) return 'Pick a username.';
  if (!USERNAME_RE.test(u)) return `Usernames are ${USERNAME_RULES}.`;
  return null;
}

export function passwordError(password) {
  if (!password || password.length < MIN_PASSWORD) return `Passwords need at least ${MIN_PASSWORD} characters.`;
  return null;
}

export function usernameToEmail(name, domain = DOMAIN) {
  return `${normalizeUsername(name)}@${domain}`;
}

/** Turns Supabase error messages into something a student can act on. */
export function friendlyAuthError(error) {
  const msg = String(error?.message ?? error ?? '');
  if (/already registered|already exists|duplicate/i.test(msg)) return 'That username is taken. Try another one.';
  if (/invalid login credentials/i.test(msg)) return 'Username or password is wrong.';
  if (/email.*invalid|invalid.*email/i.test(msg)) {
    return 'Sign-up is not set up correctly yet (the account email domain was rejected). Ask your teacher or the site owner.';
  }
  if (/rate limit|too many/i.test(msg)) return 'Too many tries. Wait a minute and try again.';
  if (/fetch|network/i.test(msg)) return 'Could not reach the server. Check your internet connection.';
  return msg || 'Something went wrong. Try again.';
}
