import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <header className="site-header">
        <NavLink to="/" className="brand">
          <span aria-hidden="true">🔔</span> Quiz Bowl Playground
        </NavLink>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/" end>Subjects</NavLink>
          {/* Quiz and Review links go here. */}
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">Built for middle school quiz bowl practice.</footer>
    </div>
  );
}
