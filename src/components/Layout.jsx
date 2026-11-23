import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useProgress } from '../hooks/useProgress.js';
import './account.css';

const LESSON_PATH = /^\/subject\/([^/]+)\/lesson\/([^/]+)\/?$/;

export default function Layout() {
  const { pathname } = useLocation();
  const auth = useAuth();
  const { recordLesson } = useProgress();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Opening a lesson counts as studying it.
  useEffect(() => {
    const m = LESSON_PATH.exec(pathname);
    if (m) recordLesson(decodeURIComponent(m[1]), decodeURIComponent(m[2]));
  }, [pathname, recordLesson]);

  return (
    <div className="app">
      <header className="site-header">
        <NavLink to="/" className="brand">
          <span aria-hidden="true">🔔</span> Quiz Bowl Playground
        </NavLink>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/" end>Subjects</NavLink>
          <NavLink to="/quiz">Quiz</NavLink>
          <NavLink to="/review">Review</NavLink>
          <NavLink to="/progress">My progress</NavLink>
          {auth.status === 'signedIn' && (
            <NavLink to="/progress" className="account-chip" title="Signed in">
              <span aria-hidden="true">👤</span> {auth.user.username}
            </NavLink>
          )}
          {auth.status === 'signedOut' && (
            <NavLink to="/account" className="account-chip">Sign in</NavLink>
          )}
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">Built for middle school quiz bowl practice.</footer>
    </div>
  );
}
