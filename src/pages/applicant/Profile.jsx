import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Alert, ErrorState, PageLoader } from '../../components/Feedback';
import { PasswordField, TextField } from '../../components/Fields';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { COUNTRIES, FIELD_LABELS, GENDERS, NATIONALITIES, POSITIONS } from '../../utils/constants';
import { errorMessage, isoDateYearsAgo, todayIso } from '../../utils/format';

const FIELDS = Object.keys(FIELD_LABELS);

const toForm = (p) =>
  Object.fromEntries(FIELDS.map((f) => [f, p[f] === null || p[f] === undefined ? '' : String(p[f])]));

function ProfileForm({ profile, email }) {
  const { refreshMe } = useAuth();
  const toast = useToast();
  const [initial, setInitial] = useState(() => toForm(profile));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [focusTick, setFocusTick] = useState(0);

  // After the server rejects a field, bring the first invalid one into view.
  useEffect(() => {
    if (!focusTick) return;
    const el = document.querySelector('[aria-invalid="true"]');
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.focus({ preventScroll: true });
    }
  }, [focusTick]);

  const changed = FIELDS.filter((f) => values[f] !== initial[f]);
  const dirty = changed.length > 0;

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };
  const field = (name) => ({ name, value: values[name], onChange: set(name), error: errors[name] });

  async function onSubmit(e) {
    e.preventDefault();
    if (!dirty) return;
    setFormError('');
    setErrors({});
    // Only send what changed, so an old passport expiry date does not block other edits.
    const payload = {};
    changed.forEach((f) => {
      const v = values[f].trim();
      payload[f] = f === 'years_experience' && v !== '' ? Number(v) : v;
    });
    setBusy(true);
    try {
      const saved = await api.patch('/applicant/profile', payload);
      const fresh = toForm(saved);
      setInitial(fresh);
      setValues(fresh);
      await refreshMe();
      toast.success('Profile saved.');
    } catch (err) {
      if (err.details && typeof err.details === 'object') {
        const mapped = {};
        Object.entries(err.details).forEach(([k, msg]) => {
          mapped[k] = msg === 'Already registered.' ? 'This passport number is already registered.' : msg;
        });
        setErrors(mapped);
        setFocusTick((n) => n + 1);
        setFormError('Please fix the highlighted fields.');
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}

      <section className="panel form-section" aria-labelledby="sec-personal">
        <h2 id="sec-personal">Personal details</h2>
        <div className="form-grid form-grid--2">
          <TextField label="First name" autoComplete="given-name" {...field('first_name')} />
          <TextField label="Last name" autoComplete="family-name" {...field('last_name')} />
          <TextField label="Phone number" type="tel" inputMode="tel" autoComplete="tel" hint="Include the country code." {...field('phone')} />
          <TextField label="Date of birth" type="date" min={isoDateYearsAgo(80)} max={isoDateYearsAgo(18)} {...field('date_of_birth')} />
          <TextField label="Gender" as="select" {...field('gender')}>
            <option value="">Select</option>
            {GENDERS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </TextField>
          <TextField label="Nationality" list="p-nationalities" autoComplete="off" {...field('nationality')} />
          <TextField label="Country of residence" list="p-countries" autoComplete="country-name" {...field('country_of_residence')} />
          <TextField label="Current address" as="textarea" rows={3} className="span-2" autoComplete="street-address" {...field('address')} />
        </div>
      </section>

      <section className="panel form-section" aria-labelledby="sec-passport">
        <h2 id="sec-passport">Passport</h2>
        <div className="form-grid form-grid--2">
          <TextField label="Passport number" autoCapitalize="characters" autoComplete="off" {...field('passport_number')} />
          <TextField label="Passport expiry date" type="date" min={todayIso()} {...field('passport_expiry')} />
        </div>
      </section>

      <section className="panel form-section" aria-labelledby="sec-work">
        <h2 id="sec-work">Work</h2>
        <div className="form-grid form-grid--2">
          <TextField label="Position you are applying for" list="p-positions" autoComplete="off" {...field('position_applied')} />
          <TextField label="Years of experience" type="number" inputMode="numeric" min="0" max="60" {...field('years_experience')} />
          <TextField
            label="About your experience"
            optional
            as="textarea"
            rows={5}
            maxLength={2000}
            className="span-2"
            hint="A few lines on the ships or kitchens you have worked in."
            {...field('biography')}
          />
        </div>
        <p className="panel__meta">Signed in as {email}</p>
      </section>

      <div className={`savebar ${dirty ? 'is-visible' : ''}`}>
        <div className="container savebar__inner">
          <span className="savebar__text">You have unsaved changes</span>
          <button type="button" className="btn btn--ghost" onClick={() => { setValues(initial); setErrors({}); }} disabled={busy}>
            Discard
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy || !dirty}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <datalist id="p-positions">{POSITIONS.map((p) => <option key={p} value={p} />)}</datalist>
      <datalist id="p-nationalities">{NATIONALITIES.map((p) => <option key={p} value={p} />)}</datalist>
      <datalist id="p-countries">{COUNTRIES.map((p) => <option key={p} value={p} />)}</datalist>
    </form>
  );
}

function PasswordForm() {
  const { endSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setBusy(true);
    try {
      await api.post('/auth/change-password', form);
      endSession();
      navigate('/login', { replace: true, state: { notice: 'Password changed. Log in with your new password.' } });
    } catch (err) {
      setBusy(false);
      if (err.details) setErrors(err.details);
      else setFormError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel form-section" aria-labelledby="sec-password" noValidate>
      <h2 id="sec-password">Change password</h2>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div className="form-grid form-grid--2">
        <PasswordField label="Current password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} error={errors.current_password} />
        <PasswordField
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          value={form.new_password}
          onChange={set('new_password')}
          error={errors.new_password}
        />
      </div>
      <div>
        <button type="submit" className="btn btn--dark" disabled={busy || !form.current_password || !form.new_password}>
          {busy ? 'Changing…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => api.get('/applicant/profile'), []);

  if (loading && !data) return <PageLoader label="Loading your profile" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <header className="page-head">
        <h1>Your profile</h1>
        <p>Keep these details current. The review team sees exactly what you enter here.</p>
      </header>
      <ProfileForm profile={data} email={user.email} />
      <PasswordForm />
    </>
  );
}
