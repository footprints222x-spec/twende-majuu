import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageLoader } from './components/Feedback';
import { AppLayout, AuthLayout, PublicLayout, RequireRole } from './components/Layouts';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import Dashboard from './pages/applicant/Dashboard';
import Documents from './pages/applicant/Documents';
import Profile from './pages/applicant/Profile';

// The admin screens are only downloaded by administrators.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Applicants = lazy(() => import('./pages/admin/Applicants'));
const ApplicantDetail = lazy(() => import('./pages/admin/ApplicantDetail'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route element={<RequireRole role="applicant" />}>
          <Route path="app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="documents" element={<Documents />} />
          </Route>
        </Route>

        <Route element={<RequireRole role="admin" />}>
          <Route path="admin" element={<AppLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="applicants" element={<Applicants />} />
            <Route path="applicants/:id" element={<ApplicantDetail />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
