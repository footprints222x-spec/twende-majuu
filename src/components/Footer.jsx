import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';

export default function Footer() {
  return (
    <footer className="site-footer on-dark">
      <div className="container site-footer__grid">
        <div>
          <p className="brand">
            <LogoMark /> <span>Twende Majuu</span>
          </p>
          <p className="site-footer__about">Crew registration for cruise ships, yachts and offshore vessels.</p>
        </div>
        <nav aria-label="Footer" className="site-footer__links">
          <Link to="/register">Create your profile</Link>
          <Link to="/login">Log in</Link>
        </nav>
      </div>
      <div className="container site-footer__legal">
        <p>© {new Date().getFullYear()} Twende Majuu. Your documents are stored privately.</p>
      </div>
    </footer>
  );
}
