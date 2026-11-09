import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homePathFor, useAuth } from '../context/AuthContext';
import Footer from './Footer';
import Header from './Header';
import TabBar from './TabBar';
import { PageLoader } from './Feedback';

/** Landing page: header, content, footer. */
export function PublicLayout() {
  return (
    <>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

/** Login and register: header and content only. */
export function AuthLayout() {
  return (
    <>
      <Header />
      <main id="main">
        <Outlet />
      </main>
    </>
  );
}

/** Signed-in area: header, padded content, and the phone tab bar. */
export function AppLayout() {
  return (
    <>
      <Header />
      <main id="main" className="app-main">
        <div className="container page">
          <Outlet />
        </div>
      </main>
      <TabBar />
    </>
  );
}

/** Only lets through signed-in users with the given role. */
export function RequireRole({ role }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader label="Loading your account" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
}
