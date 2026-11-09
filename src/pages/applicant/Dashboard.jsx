import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ErrorState, PageLoader } from '../../components/Feedback';
import { Alert } from '../../components/Feedback';
import Icon from '../../components/Icon';
import { StatusBadge, VoyageTracker } from '../../components/Status';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { FIELD_LABELS, STATUS } from '../../utils/constants';
import { formatDate, monthsUntil } from '../../utils/format';

function missingNote(fields) {
  const names = fields.slice(0, 3).map((f) => FIELD_LABELS[f] || f);
  const more = fields.length - names.length;
  return `Still needed: ${names.join(', ')}${more > 0 ? ` and ${more} more` : ''}.`;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data, error, loading, reload } = useAsync(() => api.get('/applicant/application'), []);

  if (loading && !data) return <PageLoader label="Loading your application" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const app = data.application;
  const checklist = [
    {
      key: 'profile',
      label: 'Profile details',
      done: data.profile_complete,
      note: data.profile_complete ? null : missingNote(data.missing_profile_fields),
      to: '/app/profile',
      action: 'Complete profile',
    },
    { key: 'cv', label: 'CV or resume', done: data.checklist.cv, to: '/app/documents', action: 'Upload CV' },
    { key: 'photo', label: 'Passport photograph', done: data.checklist.passport_photo, to: '/app/documents', action: 'Upload photo' },
    { key: 'copy', label: 'Passport copy', done: data.checklist.passport_copy, to: '/app/documents', action: 'Upload copy' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const expiryMonths = monthsUntil(profile?.passport_expiry);

  return (
    <>
      <header className="page-head">
        <h1>Hello, {profile?.first_name}</h1>
        <p>Here is where your application stands.</p>
      </header>

      {expiryMonths !== null && expiryMonths < 6 && (
        <Alert tone="warning" title={`Your passport expires on ${formatDate(profile.passport_expiry)}`}>
          Many countries and employers ask for at least six months of validity. Update your details once it is renewed.
        </Alert>
      )}

      <div className="grid-2">
        <section className="panel" aria-labelledby="status-title">
          <div className="panel__head">
            <h2 id="status-title">Application status</h2>
            <StatusBadge status={app.status} />
          </div>
          <VoyageTracker status={app.status} />
          <p className="panel__text">{STATUS[app.status]?.hint}</p>
          <p className="panel__meta">
            Submitted {formatDate(app.submitted_at)}
            {app.reviewed_at ? `, last reviewed ${formatDate(app.reviewed_at)}` : ''}
          </p>
        </section>

        <section className="panel" aria-labelledby="todo-title">
          <div className="panel__head">
            <h2 id="todo-title">Before we can review you</h2>
            <span className="panel__count">
              {doneCount} of {checklist.length} done
            </span>
          </div>
          <ul className="checklist">
            {checklist.map((item) => (
              <li key={item.key} className={item.done ? 'is-done' : ''}>
                <span className="checklist__mark" aria-hidden="true">
                  {item.done && <Icon name="check" size={16} strokeWidth={3.2} />}
                </span>
                <div className="checklist__text">
                  <span className="checklist__label">
                    {item.label}
                    <span className="visually-hidden">{item.done ? ' (done)' : ' (still to do)'}</span>
                  </span>
                  {item.note && <span className="checklist__note">{item.note}</span>}
                </div>
                {!item.done && (
                  <Link to={item.to} className="btn btn--ghost btn--sm">
                    {item.action}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
