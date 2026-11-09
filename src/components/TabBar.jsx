import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import { linksFor } from './navConfig';

/** Thumb-reach navigation, shown on phones and small tablets only. */
export default function TabBar() {
  const { user } = useAuth();
  const links = linksFor(user);
  if (!links.length) return null;
  return (
    <nav className="tabbar" aria-label="Main">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end}>
          <Icon name={l.icon} size={24} />
          <span>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
