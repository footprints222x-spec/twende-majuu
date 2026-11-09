import Icon from './Icon';
import { useBlobUrl } from '../hooks/useBlobUrl';

/** Shows a protected image (e.g. a passport photograph) by fetching it with the login token. */
export default function PhotoThumb({ path, alt, size = 'md' }) {
  const { url, loading } = useBlobUrl(path);
  return (
    <div className={`thumb thumb--${size}`}>
      {url ? (
        <img src={url} alt={alt} />
      ) : loading ? (
        <span className="thumb__skeleton" aria-hidden="true" />
      ) : (
        <Icon name="user" size={size === 'lg' ? 40 : 28} />
      )}
    </div>
  );
}
