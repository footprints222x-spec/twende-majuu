import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, downloadFile } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ErrorState, PageLoader } from '../../components/Feedback';
import { TextField } from '../../components/Fields';
import Icon from '../../components/Icon';
import PhotoThumb from '../../components/PhotoThumb';
import { StatusBadge } from '../../components/Status';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { ALL_STATUSES, GENDERS, STATUS } from '../../utils/constants';
import { errorMessage, formatBytes, formatDate, monthsUntil, plural } from '../../utils/format';

const genderLabel = (v) => GENDERS.find(([key]) => key === v)?.[1] || v;

function Row({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children || <span className="muted">Not given</span>}</dd>
    </div>
  );
}

function StatusPanel({ detail, onSaved }) {
  const toast = useToast();
  const app = detail.application;
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.admin_notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(app.status);
    setNotes(app.admin_notes || '');
  }, [app.status, app.admin_notes]);

  const dirty = status !== app.status || notes !== (app.admin_notes || '');

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.patch(`/admin/applications/${app.id}/status`, { status, admin_notes: notes });
      toast.success(`Status changed to ${STATUS[status].label}.`);
      onSaved();
    } catch (err) {
      setError(err.details?.status || err.details?.admin_notes || errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form-section" onSubmit={save} aria-labelledby="status-heading">
      <div className="panel__head">
        <h2 id="status-heading">Application status</h2>
        <StatusBadge status={app.status} />
      </div>
      <div className="form-grid">
        <TextField label="Status" as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </TextField>
        <TextField
          label="Internal notes"
          optional
          as="textarea"
          rows={3}
          maxLength={2000}
          hint="Only admins can see these. The applicant sees the status only."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="field__error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={!dirty || busy}>
          {busy ? 'Saving…' : 'Save status'}
        </button>
      </div>
      {app.reviewed_at && (
        <p className="panel__meta">
          Last changed {formatDate(app.reviewed_at)}
          {app.reviewed_by ? ` by ${app.reviewed_by}` : ''}.
        </p>
      )}
    </form>
  );
}

export default function ApplicantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: d, error, loading, reload } = useAsync(() => api.get(`/admin/applicants/${id}`), [id]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading && !d) return <PageLoader label="Loading applicant" />;
  if (error) {
    return (
      <>
        <Link to="/admin/applicants" className="back-link">
          <Icon name="back" size={18} /> All applicants
        </Link>
        {error.status === 404 ? (
          <div className="panel empty">
            <h2>Applicant not found</h2>
            <p>They may have been deleted.</p>
          </div>
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </>
    );
  }

  const photo = d.documents.find((x) => x.document_type === 'passport_photo');
  const expiryMonths = monthsUntil(d.passport_expiry);
  const fullName = `${d.first_name} ${d.last_name}`;

  async function onDownload(doc) {
    try {
      await downloadFile(`/admin/documents/${doc.id}/download`, doc.original_filename);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await api.delete(`/admin/applicants/${d.id}`);
      toast.success(`${fullName} was deleted.`);
      navigate('/admin/applicants', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <>
      <Link to="/admin/applicants" className="back-link">
        <Icon name="back" size={18} /> All applicants
      </Link>

      <header className="person">
        <PhotoThumb size="lg" alt={`Passport photograph of ${fullName}`} path={photo ? `/admin/documents/${photo.id}/download` : null} />
        <div className="person__info">
          <h1>{fullName}</h1>
          <p>{d.position_applied || 'No position given'}</p>
          <div className="person__contact">
            <a href={`mailto:${d.email}`} className="btn btn--ghost btn--sm">
              <Icon name="mail" size={18} /> Email
            </a>
            {d.phone && (
              <a href={`tel:${d.phone.replace(/[^\d+]/g, '')}`} className="btn btn--ghost btn--sm">
                <Icon name="phone" size={18} /> Call
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-grid__side">
          <StatusPanel detail={d} onSaved={reload} />

          <section className="panel" aria-labelledby="docs-heading">
            <h2 id="docs-heading">Documents ({d.documents.length})</h2>
            {d.documents.length === 0 ? (
              <p className="panel__meta">This applicant has not uploaded anything yet.</p>
            ) : (
              <ul className="file-list">
                {d.documents.map((doc) => (
                  <li key={doc.id} className="file-row">
                    <Icon name={doc.content_type.startsWith('image/') ? 'image' : 'file'} size={22} />
                    <div className="file-row__info">
                      <span className="file-row__name">{doc.document_type_label}</span>
                      <span className="file-row__meta">
                        {doc.original_filename}, {formatBytes(doc.file_size)}
                      </span>
                    </div>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => onDownload(doc)}>
                      <Icon name="download" size={18} /> Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="detail-grid__main">
          <section className="panel" aria-labelledby="profile-heading">
            <h2 id="profile-heading">Profile</h2>
            <dl className="dl">
              <Row label="Email">{d.email}</Row>
              <Row label="Phone">{d.phone}</Row>
              <Row label="Date of birth">{d.date_of_birth && formatDate(d.date_of_birth)}</Row>
              <Row label="Gender">{d.gender && genderLabel(d.gender)}</Row>
              <Row label="Nationality">{d.nationality}</Row>
              <Row label="Country of residence">{d.country_of_residence}</Row>
              <Row label="Address">{d.address}</Row>
              <Row label="Experience">{d.years_experience !== null && plural(d.years_experience, 'year')}</Row>
              <Row label="Registered">{formatDate(d.created_at)}</Row>
            </dl>
          </section>

          <section className="panel" aria-labelledby="passport-heading">
            <h2 id="passport-heading">Passport</h2>
            <dl className="dl">
              <Row label="Passport number">{d.passport_number}</Row>
              <Row label="Expiry date">
                {d.passport_expiry && (
                  <>
                    {formatDate(d.passport_expiry)}
                    {expiryMonths !== null && expiryMonths < 6 && (
                      <span className="badge badge--warning badge--inline">{expiryMonths < 0 ? 'Expired' : `Under ${plural(Math.max(expiryMonths, 1), 'month')} left`}</span>
                    )}
                  </>
                )}
              </Row>
            </dl>
          </section>

          {d.biography && (
            <section className="panel" aria-labelledby="bio-heading">
              <h2 id="bio-heading">About their experience</h2>
              <p className="prose">{d.biography}</p>
            </section>
          )}

          <section className="panel danger-zone" aria-labelledby="danger-heading">
            <h2 id="danger-heading">Delete applicant</h2>
            <p>This removes the account, profile, application and every uploaded file. It cannot be undone.</p>
            <button type="button" className="btn btn--danger-outline" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={18} /> Delete {d.first_name}
            </button>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        danger
        busy={deleting}
        title={`Delete ${fullName}?`}
        confirmLabel="Delete permanently"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      >
        <p>
          This permanently deletes their account, profile and {plural(d.documents.length, 'uploaded document')}. They will no longer
          be able to log in.
        </p>
      </ConfirmDialog>
    </>
  );
}
