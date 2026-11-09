import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ErrorState, PageLoader } from '../../components/Feedback';
import { useAsync } from '../../hooks/useAsync';
import { STATUS } from '../../utils/constants';

function RankList({ items, empty }) {
  if (!items.length) return <p className="panel__meta">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ol className="rank">
      {items.map((item) => (
        <li key={item.name}>
          <span className="rank__name">{item.name}</span>
          <span className="rank__count">{item.count}</span>
          <span className="rank__bar" style={{ '--w': `${(item.count / max) * 100}%` }} aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}

export default function AdminDashboard() {
  const { data: s, error, loading, reload } = useAsync(() => api.get('/admin/dashboard/stats'), []);

  if (loading && !s) return <PageLoader label="Loading overview" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const statusCount = (key) => s.by_status.find((x) => x.status === key)?.count ?? 0;
  const total = s.total_applicants;

  return (
    <>
      <header className="page-head page-head--row">
        <div>
          <h1>Overview</h1>
          <p>Registrations and applications at a glance.</p>
        </div>
        <Link to="/admin/applicants" className="btn btn--dark">
          View all applicants
        </Link>
      </header>

      <dl className="stat-strip">
        <div className="stat">
          <dt>Total applicants</dt>
          <dd>{total}</dd>
        </div>
        <div className="stat">
          <dt>New this week</dt>
          <dd>{s.registrations.last_7_days}</dd>
        </div>
        <div className="stat">
          <dt>Waiting for review</dt>
          <dd>{statusCount('pending')}</dd>
        </div>
        <div className="stat">
          <dt>Approved</dt>
          <dd>{statusCount('approved')}</dd>
        </div>
      </dl>

      <section className="panel" aria-labelledby="by-status">
        <h2 id="by-status">Applications by status</h2>
        {total > 0 ? (
          <div className="statusbar" role="img" aria-label={s.by_status.map((x) => `${x.label}: ${x.count}`).join(', ')}>
            {s.by_status
              .filter((x) => x.count > 0)
              .map((x) => (
                <span key={x.status} className={`seg seg--${x.status}`} style={{ flexGrow: x.count }} />
              ))}
          </div>
        ) : (
          <p className="panel__meta">No applicants yet.</p>
        )}
        <ul className="legend">
          {s.by_status.map((x) => (
            <li key={x.status}>
              <Link to={`/admin/applicants?status=${x.status}`}>
                <span className={`swatch seg--${x.status}`} aria-hidden="true" />
                <span className="legend__label">{STATUS[x.status]?.label || x.label}</span>
                <span className="legend__count">{x.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="top-pos">
          <h2 id="top-pos">Positions applied for</h2>
          <RankList items={s.top_positions} empty="No positions yet." />
        </section>
        <section className="panel" aria-labelledby="top-nat">
          <h2 id="top-nat">Nationalities</h2>
          <RankList items={s.top_nationalities} empty="No nationalities yet." />
        </section>
      </div>

      <div className="grid-2">
        <section className="panel" aria-labelledby="regs">
          <h2 id="regs">New registrations</h2>
          <dl className="dl dl--tight">
            <div><dt>Last 24 hours</dt><dd>{s.registrations.last_24_hours}</dd></div>
            <div><dt>Last 7 days</dt><dd>{s.registrations.last_7_days}</dd></div>
            <div><dt>Last 30 days</dt><dd>{s.registrations.last_30_days}</dd></div>
          </dl>
        </section>
        <section className="panel" aria-labelledby="quality">
          <h2 id="quality">Profile quality</h2>
          <dl className="dl dl--tight">
            <div><dt>Profiles fully completed</dt><dd>{s.profiles_complete} of {total}</dd></div>
            <div><dt>Applicants with a CV</dt><dd>{s.applicants_with_cv} of {total}</dd></div>
            <div>
              <dt>Average experience</dt>
              <dd>{s.average_years_experience === null ? 'Not available' : `${s.average_years_experience} years`}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
