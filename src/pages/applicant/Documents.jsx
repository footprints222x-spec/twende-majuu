import { api } from '../../api/client';
import DocumentSlot from '../../components/DocumentSlot';
import { ErrorState, PageLoader } from '../../components/Feedback';
import { useAsync } from '../../hooks/useAsync';
import { EXTRA_DOC_TYPES, KEY_DOC_TYPES } from '../../utils/constants';

export default function Documents() {
  const { data, error, loading, reload } = useAsync(() => api.get('/applicant/documents'), []);

  if (loading && !data) return <PageLoader label="Loading your documents" />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const docs = data?.items || [];
  const byType = (type) => docs.filter((d) => d.document_type === type);

  return (
    <>
      <header className="page-head">
        <h1>Your documents</h1>
        <p>Your files are stored privately. Only you and the review team can open them.</p>
      </header>

      <h2 className="group-title">Required</h2>
      <div className="slot-grid">
        {KEY_DOC_TYPES.map((type) => (
          <DocumentSlot key={type} type={type} docs={byType(type)} onChange={reload} />
        ))}
      </div>

      <h2 className="group-title">Certificates and other documents</h2>
      <div className="slot-grid">
        {EXTRA_DOC_TYPES.map((type) => (
          <DocumentSlot key={type} type={type} docs={byType(type)} onChange={reload} />
        ))}
      </div>
    </>
  );
}
