import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { EmptyState, ErrorState, Spinner } from '../../components/Feedback';
import { TextField } from '../../components/Fields';
import Icon from '../../components/Icon';
import Pagination from '../../components/Pagination';
import { StatusBadge } from '../../components/Status';
import { useAsync } from '../../hooks/useAsync';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { ALL_STATUSES, NATIONALITIES, POSITIONS, STATUS } from '../../utils/constants';
import { formatDate, plural } from '../../utils/format';

const SORTS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'last_name:asc', label: 'Name, A to Z' },
  { value: 'years_experience:desc', label: 'Most experience' },
  { value: 'status:asc', label: 'Status' },
];
const TEXT_KEYS = ['q', 'nationality', 'position', 'min_experience', 'max_experience'];
const PER_PAGE = 20;

export default function Applicants() {
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || '';

  const [draft, setDraft] = useState(() => Object.fromEntries(TEXT_KEYS.map((k) => [k, get(k)])));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounced = useDebouncedValue(draft, 400);

  const update = (changes, { push = false } = {}) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace: !push },
    );

  // Push typed filters into the URL once typing pauses.
  useEffect(() => {
    const changes = {};
    TEXT_KEYS.forEach((k) => {
      if (debounced[k] !== get(k)) changes[k] = debounced[k].trim();
    });
    if (Object.keys(changes).length) update(changes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const sort = `${get('sort_by') || 'created_at'}:${get('order') || 'desc'}`;
  const page = Number(get('page')) || 1;
  const query = {
    q: get('q'),
    status: get('status'),
    nationality: get('nationality'),
    position: get('position'),
    min_experience: get('min_experience'),
    max_experience: get('max_experience'),
    sort_by: get('sort_by'),
    order: get('order'),
    page,
    per_page: PER_PAGE,
  };
  const { data, error, loading, reload } = useAsync(() => api.get('/admin/applicants', query), [params.toString()]);

  const activeFilters = ['status', 'nationality', 'position', 'min_experience', 'max_experience'].filter((k) => get(k)).length;

  function clearAll() {
    setDraft(Object.fromEntries(TEXT_KEYS.map((k) => [k, ''])));
    setParams({}, { replace: true });
  }

  const items = data?.items || [];
  const pg = data?.pagination;
  const hasAny = Boolean(get('q')) || activeFilters > 0;

  return (
    <>
      <header className="page-head">
        <h1>Applicants</h1>
        <p>Search, filter and open any applicant.</p>
      </header>

      <section className="toolbar" aria-label="Search and filters">
        <div className="toolbar__row">
          <div className="search">
            <Icon name="search" size={20} />
            <input
              type="search"
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              placeholder="Name, email or position"
              aria-label="Search by name, email or position"
              enterKeyHint="search"
            />
          </div>
          <button
            type="button"
            className="btn btn--ghost filters-toggle"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="filters"
          >
            <Icon name="filter" size={18} />
            Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </button>
        </div>

        <div id="filters" className={`filters ${filtersOpen ? 'is-open' : ''}`}>
          <TextField label="Status" as="select" value={get('status')} onChange={(e) => update({ status: e.target.value })}>
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </TextField>
          <TextField
            label="Nationality"
            list="f-nationalities"
            autoComplete="off"
            value={draft.nationality}
            onChange={(e) => setDraft((d) => ({ ...d, nationality: e.target.value }))}
          />
          <TextField
            label="Position"
            list="f-positions"
            autoComplete="off"
            value={draft.position}
            onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
          />
          <TextField
            label="Min years"
            type="number"
            inputMode="numeric"
            min="0"
            value={draft.min_experience}
            onChange={(e) => setDraft((d) => ({ ...d, min_experience: e.target.value }))}
          />
          <TextField
            label="Max years"
            type="number"
            inputMode="numeric"
            min="0"
            value={draft.max_experience}
            onChange={(e) => setDraft((d) => ({ ...d, max_experience: e.target.value }))}
          />
          <TextField
            label="Sort by"
            as="select"
            value={sort}
            onChange={(e) => {
              const [sort_by, order] = e.target.value.split(':');
              update({ sort_by: sort_by === 'created_at' && order === 'desc' ? '' : sort_by, order: sort_by === 'created_at' && order === 'desc' ? '' : order });
            }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </TextField>
        </div>
        <datalist id="f-nationalities">{NATIONALITIES.map((n) => <option key={n} value={n} />)}</datalist>
        <datalist id="f-positions">{POSITIONS.map((n) => <option key={n} value={n} />)}</datalist>
      </section>

      {error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <section aria-live="polite" aria-busy={loading}>
          <div className="results-bar">
            <p>
              {pg ? (
                pg.total === 0 ? 'No applicants found' : `${plural(pg.total, 'applicant')} found`
              ) : (
                'Loading…'
              )}
            </p>
            {loading && <Spinner label="Updating results" />}
            {hasAny && (
              <button type="button" className="link-button" onClick={clearAll}>
                Clear search and filters
              </button>
            )}
          </div>

          {data && items.length === 0 ? (
            <div className="panel">
              <EmptyState icon="users" title={hasAny ? 'No applicants match' : 'No applicants yet'}>
                {hasAny ? 'Try a different search or clear the filters.' : 'New registrations will appear here.'}
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="table-wrap table-only">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Applicant</th>
                      <th scope="col">Position</th>
                      <th scope="col">Nationality</th>
                      <th scope="col">Experience</th>
                      <th scope="col">Files</th>
                      <th scope="col">Status</th>
                      <th scope="col">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link to={`/admin/applicants/${a.id}`} className="cell-link">
                            <strong>{a.full_name}</strong>
                            <span>{a.email}</span>
                          </Link>
                        </td>
                        <td>{a.position_applied || 'Not given'}</td>
                        <td>{a.nationality || 'Not given'}</td>
                        <td>{a.years_experience === null ? 'Not given' : plural(a.years_experience, 'year')}</td>
                        <td>{a.documents_count}</td>
                        <td>
                          <StatusBadge status={a.status} />
                        </td>
                        <td>{formatDate(a.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="cards cards-only">
                {items.map((a) => (
                  <li key={a.id}>
                    <Link to={`/admin/applicants/${a.id}`} className="applicant-card">
                      <div className="applicant-card__top">
                        <strong>{a.full_name}</strong>
                        <StatusBadge status={a.status} />
                      </div>
                      <span className="applicant-card__email">{a.email}</span>
                      <span className="applicant-card__line">
                        {a.position_applied || 'No position yet'}
                        {a.nationality ? `, ${a.nationality}` : ''}
                      </span>
                      <span className="applicant-card__meta">
                        {a.years_experience === null ? 'Experience not given' : `${plural(a.years_experience, 'year')} of experience`}
                        , {plural(a.documents_count, 'file')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Pagination pagination={pg} onPage={(p) => update({ page: p === 1 ? '' : String(p) }, { push: true })} />
            </>
          )}
        </section>
      )}
    </>
  );
}
