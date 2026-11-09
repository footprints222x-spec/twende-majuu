import { useId, useState } from 'react';
import Icon from './Icon';

function describedBy(id, hint, error) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

/** Label + control + hint + error. `as` can be "input" (default), "select" or "textarea". */
export function TextField({ label, error, hint, optional, as: Control = 'input', className = '', children, ...props }) {
  const id = useId();
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {optional && <span className="field__optional"> optional</span>}
      </label>
      <Control
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      >
        {children}
      </Control>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ label, error, hint, className = '', ...props }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <div className="password">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...props}
        />
        <button
          type="button"
          className="password__toggle"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
        >
          <Icon name={shown ? 'eyeoff' : 'eye'} size={22} />
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
