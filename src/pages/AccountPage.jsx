import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { signIn, signUp, useAuth } from '../hooks/useAuth.js';
import { friendlyAuthError, passwordError, usernameError, USERNAME_RULES, MIN_PASSWORD } from '../lib/account.js';

export default function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (auth.status === 'disabled') {
    return (
      <div className="account-page">
        <h1>Accounts</h1>
        <p className="notice">
          Accounts are not set up on this site yet, so your progress is saved in this browser only.
        </p>
        <Link to="/progress">See my progress</Link>
      </div>
    );
  }
  if (auth.status === 'signedIn') return <Navigate to="/progress" replace />;

  const creating = mode === 'signUp';

  async function submit(e) {
    e.preventDefault();
    const problem =
      usernameError(username) || passwordError(password) || (creating && password !== confirm ? 'The two passwords don’t match.' : null);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await (creating ? signUp(username, password) : signIn(username, password));
      navigate('/progress');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  return (
    <div className="account-page">
      <h1>{creating ? 'Create an account' : 'Sign in'}</h1>
      <p>
        With an account your lessons, quiz scores and review pile are saved, so you can pick up on any computer.
        Anything you did before signing in is added to your account.
      </p>
      <div className="auth-tabs" role="group" aria-label="Sign in or create account">
        <button type="button" aria-pressed={!creating} onClick={() => switchMode('signIn')}>Sign in</button>
        <button type="button" aria-pressed={creating} onClick={() => switchMode('signUp')}>Create account</button>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            required
          />
          {creating && (
            <span className="hint">{USERNAME_RULES}. Make up a nickname; don’t use your real full name.</span>
          )}
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={creating ? 'new-password' : 'current-password'}
            required
          />
          {creating && <span className="hint">At least {MIN_PASSWORD} characters. Ask a parent or teacher to help you remember it.</span>}
        </label>
        {creating && (
          <label>
            Type the password again
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div>
          <button type="submit" disabled={busy || auth.status === 'loading'}>
            {busy ? 'Please wait…' : creating ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </form>
      {!creating && (
        <p className="accept">
          Forgot your password? There’s no email on your account, so ask your teacher or the site owner to reset it.
        </p>
      )}
    </div>
  );
}
