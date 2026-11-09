import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert } from '../components/Feedback';
import { PasswordField, TextField } from '../components/Fields';
import { homePathFor, useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

function destination(from, user) {
  if (from && user.role === 'admin' && from.startsWith('/admin')) return from;
  if (from && user.role === 'applicant' && from.startsWith('/app')) return from;
  return homePathFor(user);
}

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={destination(location.state?.from, user)} replace />;

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email.trim(), form.password, form.remember);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1>Log in</h1>
      <p className="auth__sub">Check your application status and manage your documents.</p>

      {location.state?.notice && <Alert tone="success">{location.state.notice}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      <form onSubmit={onSubmit} className="form-stack" noValidate>
        <TextField
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          value={form.email}
          onChange={set('email')}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          required
        />
        <label className="check">
          <input type="checkbox" checked={form.remember} onChange={set('remember')} />
          <span>Keep me signed in on this device</span>
        </label>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy || !form.email || !form.password}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="auth__switch">
        New here? <Link to="/register">Create your profile</Link>
      </p>
    </AuthShell>
  );
}
