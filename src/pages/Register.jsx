import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert } from '../components/Feedback';
import { PasswordField, TextField } from '../components/Fields';
import { homePathFor, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COUNTRIES, FIELD_LABELS, GENDERS, NATIONALITIES, POSITIONS } from '../utils/constants';
import { errorMessage, isoDateYearsAgo, todayIso } from '../utils/format';

const STEPS = [
  { title: 'Your account', fields: ['first_name', 'last_name', 'email', 'password'] },
  { title: 'About you', fields: ['phone', 'date_of_birth', 'gender', 'nationality', 'country_of_residence', 'address'] },
  { title: 'Passport and work', fields: ['passport_number', 'passport_expiry', 'position_applied', 'years_experience', 'biography'] },
];

const INITIAL = {
  first_name: '', last_name: '', email: '', password: '',
  phone: '', date_of_birth: '', gender: '', nationality: '', country_of_residence: '', address: '',
  passport_number: '', passport_expiry: '', position_applied: '', years_experience: '', biography: '',
};

function ageOn(iso) {
  const dob = new Date(`${iso}T00:00:00`);
  const now = new Date();
  return now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
}

// Same rules as the server, so people hear about mistakes before they submit.
const RULES = {
  first_name: (v) => (v.trim() ? '' : 'Enter your first name.'),
  last_name: (v) => (v.trim() ? '' : 'Enter your last name.'),
  email: (v) => (!v.trim() ? 'Enter your email address.' : /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  password: (v) =>
    !v ? 'Choose a password.' : v.length < 8 ? 'Use at least 8 characters.' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Use at least one letter and one number.' : '',
  phone: (v) => (!v.trim() || /^\+?[0-9][0-9\s().-]{5,18}[0-9]$/.test(v.trim()) ? '' : 'Enter a valid phone number, for example +254712345678.'),
  date_of_birth: (v) => (!v ? '' : ageOn(v) < 18 ? 'You must be at least 18 years old.' : ageOn(v) > 80 ? 'Enter a valid date of birth.' : ''),
  passport_number: (v) => (!v.trim() || /^[A-Za-z0-9]{5,20}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Use 5 to 20 letters or numbers.'),
  passport_expiry: (v) => (!v ? '' : v < todayIso() ? 'This passport has already expired.' : ''),
  years_experience: (v) => (v === '' || (/^\d+$/.test(v) && Number(v) <= 60) ? '' : 'Enter a whole number from 0 to 60.'),
  biography: (v) => (v.length <= 2000 ? '' : 'Keep this under 2,000 characters.'),
};

function validate(values, fields) {
  const errors = {};
  fields.forEach((f) => {
    const msg = RULES[f]?.(values[f]);
    if (msg) errors[f] = msg;
  });
  return errors;
}

const stepOf = (field) => STEPS.findIndex((s) => s.fields.includes(field));

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  // After a failed Continue or submit, bring the first invalid field into view.
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (!focusTick) return;
    const el = document.querySelector('[aria-invalid="true"]');
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.focus({ preventScroll: true });
    }
  }, [focusTick]);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };
  const field = (name) => ({ name, value: values[name], onChange: set(name), error: errors[name] });

  function next() {
    const stepErrors = validate(values, STEPS[step].fields);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStep((s) => s + 1);
    else setFocusTick((n) => n + 1);
  }

  async function submit() {
    setFormError('');
    const all = validate(values, Object.keys(RULES));
    if (Object.keys(all).length) {
      setErrors(all);
      setStep(Math.min(...Object.keys(all).map(stepOf)));
      setFocusTick((n) => n + 1);
      return;
    }
    const payload = {};
    Object.entries(values).forEach(([k, v]) => {
      const text = typeof v === 'string' ? v.trim() : v;
      if (k === 'password') payload[k] = v;
      else if (text !== '') payload[k] = k === 'years_experience' ? Number(text) : text;
    });

    setBusy(true);
    try {
      await register(payload);
      toast.success('Your account is ready. Next, add your documents.');
      navigate('/app', { replace: true });
    } catch (err) {
      setBusy(false);
      if (err.details && typeof err.details === 'object') {
        const mapped = {};
        Object.entries(err.details).forEach(([k, msg]) => {
          mapped[k] = msg === 'Already registered.' ? `This ${(FIELD_LABELS[k] || k).toLowerCase()} is already registered.` : msg;
        });
        setErrors(mapped);
        const steps = Object.keys(mapped).map(stepOf).filter((i) => i >= 0);
        if (steps.length) setStep(Math.min(...steps));
        setFocusTick((n) => n + 1);
        setFormError(err.status === 409 ? errorMessage(err) : 'Please fix the highlighted fields.');
      } else {
        setFormError(errorMessage(err));
      }
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (step < STEPS.length - 1) next();
    else submit();
  }

  const last = step === STEPS.length - 1;

  return (
    <AuthShell>
      <p className="auth__step">
        Step {step + 1} of {STEPS.length}
      </p>
      <div className="progress" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s.title} className={i <= step ? 'is-on' : ''} />
        ))}
      </div>
      <h1 ref={headingRef} tabIndex={-1}>
        {STEPS[step].title}
      </h1>

      {formError && <Alert tone="danger">{formError}</Alert>}

      <form onSubmit={onSubmit} className="form-stack" noValidate>
        {step === 0 && (
          <>
            <div className="form-grid form-grid--2">
              <TextField label="First name" autoComplete="given-name" autoCapitalize="words" {...field('first_name')} />
              <TextField label="Last name" autoComplete="family-name" autoCapitalize="words" {...field('last_name')} />
            </div>
            <TextField
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              hint="You will use this to log in."
              {...field('email')}
            />
            <PasswordField
              label="Password"
              autoComplete="new-password"
              hint="At least 8 characters, with a letter and a number."
              {...field('password')}
            />
          </>
        )}

        {step === 1 && (
          <>
            <TextField label="Phone number" type="tel" autoComplete="tel" inputMode="tel" hint="Include the country code, for example +254712345678." {...field('phone')} />
            <div className="form-grid form-grid--2">
              <TextField
                label="Date of birth"
                type="date"
                min={isoDateYearsAgo(80)}
                max={isoDateYearsAgo(18)}
                {...field('date_of_birth')}
              />
              <TextField label="Gender" as="select" {...field('gender')}>
                <option value="">Select</option>
                {GENDERS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </TextField>
            </div>
            <div className="form-grid form-grid--2">
              <TextField label="Nationality" list="nationalities" autoComplete="off" {...field('nationality')} />
              <TextField label="Country of residence" list="countries" autoComplete="country-name" {...field('country_of_residence')} />
            </div>
            <TextField label="Current address" as="textarea" rows={3} autoComplete="street-address" {...field('address')} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-grid form-grid--2">
              <TextField label="Passport number" autoCapitalize="characters" autoComplete="off" {...field('passport_number')} />
              <TextField label="Passport expiry date" type="date" min={todayIso()} {...field('passport_expiry')} />
            </div>
            <div className="form-grid form-grid--2">
              <TextField label="Position you are applying for" list="positions" autoComplete="off" {...field('position_applied')} />
              <TextField label="Years of experience" type="number" inputMode="numeric" min="0" max="60" {...field('years_experience')} />
            </div>
            <TextField
              label="About your experience"
              optional
              as="textarea"
              rows={5}
              maxLength={2000}
              hint="A few lines on the ships or kitchens you have worked in."
              {...field('biography')}
            />
          </>
        )}

        <div className="form-actions">
          {step > 0 && (
            <button type="button" className="btn btn--ghost btn--lg" onClick={() => setStep((s) => s - 1)} disabled={busy}>
              Back
            </button>
          )}
          <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
            {last ? (busy ? 'Creating account…' : 'Create account') : 'Continue'}
          </button>
        </div>

        {step > 0 && !last && (
          <button type="button" className="link-button" onClick={submit} disabled={busy}>
            Skip the rest and finish later
          </button>
        )}
      </form>

      <p className="auth__switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>

      <datalist id="positions">
        {POSITIONS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id="nationalities">
        {NATIONALITIES.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id="countries">
        {COUNTRIES.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </AuthShell>
  );
}
