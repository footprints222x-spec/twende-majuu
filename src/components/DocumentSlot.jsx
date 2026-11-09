import { useRef, useState } from 'react';
import { api, downloadFile } from '../api/client';
import { useToast } from '../context/ToastContext';
import { DOC_TYPES, KEY_DOC_TYPES, acceptFor, checkFile } from '../utils/constants';
import { errorMessage, formatBytes, formatDate } from '../utils/format';
import ConfirmDialog from './ConfirmDialog';
import Icon from './Icon';
import PhotoThumb from './PhotoThumb';

/** One kind of document: what it is, what has been uploaded, and the buttons to add, get or remove files. */
export default function DocumentSlot({ type, docs, onChange }) {
  const rule = DOC_TYPES[type];
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isKey = KEY_DOC_TYPES.includes(type);
  const has = docs.length > 0;
  const uploadLabel = rule.single ? (has ? 'Replace file' : 'Upload file') : 'Add file';

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = checkFile(file, type);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setBusy(true);
    const form = new FormData();
    form.append('document_type', type);
    form.append('file', file);
    try {
      await api.upload('/applicant/documents', form);
      toast.success(`${rule.label} uploaded.`);
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDownload(doc) {
    try {
      await downloadFile(`/applicant/documents/${doc.id}/download`, doc.original_filename);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`/applicant/documents/${toDelete.id}`);
      toast.success('Document deleted.');
      setToDelete(null);
      onChange();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="panel doc-slot" aria-labelledby={`slot-${type}`}>
      <div className="doc-slot__head">
        {type === 'passport_photo' && has && (
          <PhotoThumb path={`/applicant/documents/${docs[0].id}/download`} alt="Your passport photograph" />
        )}
        <div className="doc-slot__title">
          <h3 id={`slot-${type}`}>{rule.label}</h3>
          <p>{rule.help}</p>
        </div>
        {isKey && (
          <span className={`badge ${has ? 'badge--success' : 'badge--neutral'}`}>
            {has ? <Icon name="check" size={14} strokeWidth={3} /> : <span className="badge__dot" />}
            {has ? 'Uploaded' : 'Needed'}
          </span>
        )}
      </div>

      {has && (
        <ul className="file-list">
          {docs.map((doc) => (
            <li key={doc.id} className="file-row">
              <Icon name={doc.content_type.startsWith('image/') ? 'image' : 'file'} size={22} />
              <div className="file-row__info">
                <span className="file-row__name">{doc.original_filename}</span>
                <span className="file-row__meta">
                  {formatBytes(doc.file_size)}, added {formatDate(doc.uploaded_at)}
                </span>
              </div>
              <div className="file-row__actions">
                <button type="button" className="icon-btn" onClick={() => onDownload(doc)} aria-label={`Download ${doc.original_filename}`}>
                  <Icon name="download" size={20} />
                </button>
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => setToDelete(doc)} aria-label={`Delete ${doc.original_filename}`}>
                  <Icon name="trash" size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      <div className="doc-slot__foot">
        <input ref={inputRef} type="file" accept={acceptFor(type)} onChange={onPick} className="visually-hidden" tabIndex={-1} aria-hidden="true" />
        <button type="button" className={`btn ${has && rule.single ? 'btn--ghost' : 'btn--dark'}`} onClick={() => inputRef.current?.click()} disabled={busy}>
          <Icon name="upload" size={20} />
          {busy ? 'Uploading…' : uploadLabel}
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        danger
        busy={deleting}
        title="Delete this document?"
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      >
        <p>
          <strong>{toDelete?.original_filename}</strong> will be removed from your application.
        </p>
      </ConfirmDialog>
    </section>
  );
}
