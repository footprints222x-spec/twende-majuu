import Icon from './Icon';

export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pages">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={!pagination.has_prev}
        onClick={() => onPage(pagination.page - 1)}
      >
        <Icon name="back" size={18} /> Previous
      </button>
      <span className="pagination__info">
        Page {pagination.page} of {pagination.pages}
      </span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={!pagination.has_next}
        onClick={() => onPage(pagination.page + 1)}
      >
        Next <Icon name="chevron" size={18} />
      </button>
    </nav>
  );
}
