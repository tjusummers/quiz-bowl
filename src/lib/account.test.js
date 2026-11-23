import { describe, expect, it } from 'vitest';
import { friendlyAuthError, normalizeUsername, passwordError, usernameError, usernameToEmail } from './account.js';

describe('account helpers', () => {
  it('normalizes and validates usernames', () => {
    expect(normalizeUsername('  Quiz_Kid7 ')).toBe('quiz_kid7');
    expect(usernameError('Quiz_Kid7')).toBeNull();
    expect(usernameError('ab')).toMatch(/3 to 20/);
    expect(usernameError('has space')).toMatch(/3 to 20/);
    expect(usernameError('')).toMatch(/Pick/);
  });

  it('checks password length', () => {
    expect(passwordError('12345')).toMatch(/6/);
    expect(passwordError('123456')).toBeNull();
  });

  it('builds a hidden email from the username', () => {
    expect(usernameToEmail('Quiz_Kid7', 'x.test')).toBe('quiz_kid7@x.test');
  });

  it('explains common errors', () => {
    expect(friendlyAuthError({ message: 'User already registered' })).toMatch(/taken/);
    expect(friendlyAuthError({ message: 'Invalid login credentials' })).toMatch(/wrong/);
  });
});
