import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(url);
      setData(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}
