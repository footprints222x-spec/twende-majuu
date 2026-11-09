import { useEffect, useState } from 'react';
import { api } from '../api/client';

/** Load a protected image through the API (with the login token) and expose it as an object URL. */
export function useBlobUrl(path) {
  const [state, setState] = useState({ url: null, loading: Boolean(path), error: null });

  useEffect(() => {
    if (!path) {
      setState({ url: null, loading: false, error: null });
      return undefined;
    }
    let alive = true;
    let created = null;
    setState({ url: null, loading: true, error: null });
    api
      .blob(path)
      .then((blob) => {
        if (!alive) return;
        created = URL.createObjectURL(blob);
        setState({ url: created, loading: false, error: null });
      })
      .catch((error) => alive && setState({ url: null, loading: false, error }));
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [path]);

  return state;
}
