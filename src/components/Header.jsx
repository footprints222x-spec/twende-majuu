import { Link, NavLink, useNavigate } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext';
import Icon from './Icon';
import { LogoMark } from './Logo';
import { linksFor } from './navConfig';

export default function Header() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const links = linksFor(user);

  async function onLogout() {
    navigate('/', { replace: true }); // leave the protected page first so it cannot redirect to /login
    await logout();
  }

  return (
    <header className="site-header on-dark">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="container site-header__bar">
        <Link to={user ? homePathFor(user) : '/'} className="brand" aria-label="Twende Majuu home">
          <LogoMark />
          <span>Twende Majuu</span>
        </Link>

        {links.length > 0 && (
          <nav className="main-nav" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="header-actions">
          {status === 'loading' ? null : user ? (
            <>
              <span className="header-user" title={user.email}>
                {user.email}
              </span>
              <button type="button" className="btn btn--ghost-light btn--sm" onClick={onLogout}>
                <Icon name="logout" size={18} />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost-light btn--sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
