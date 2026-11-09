import Icon from './Icon';
import { STATUS, STATUS_ORDER } from '../utils/constants';

export function StatusBadge({ status }) {
  const meta = STATUS[status] || { label: status, tone: 'neutral' };
  return (
    <span className={`badge badge--${meta.tone}`}>
      {status === 'approved' ? (
        <Icon name="check" size={14} strokeWidth={3} />
      ) : status === 'rejected' ? (
        <Icon name="x" size={14} strokeWidth={3} />
      ) : (
        <span className="badge__dot" />
      )}
      {meta.label}
    </span>
  );
}

/** Four stops on the way to being approved. A rejected application gets a plain message instead. */
export function VoyageTracker({ status }) {
  if (status === 'rejected') {
    return (
      <p className="voyage-stopped">
        <Icon name="x" size={20} /> This application ended with a rejection.
      </p>
    );
  }
  const current = Math.max(0, STATUS_ORDER.indexOf(status));
  return (
    <ol className={`voyage ${status === 'approved' ? 'voyage--approved' : ''}`} aria-label="Application progress">
      {STATUS_ORDER.map((key, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={key} className={`voyage__step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="voyage__dot">
              {state === 'done' || (state === 'current' && status === 'approved') ? (
                <Icon name="check" size={14} strokeWidth={3.4} />
              ) : state === 'current' ? (
                <span className="voyage__core" />
              ) : null}
            </span>
            <span className="voyage__label">{STATUS[key].label}</span>
          </li>
        );
      })}
    </ol>
  );
}
