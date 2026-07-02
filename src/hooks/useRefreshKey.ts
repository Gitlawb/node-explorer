import { useState, useCallback } from 'react';

export function useRefreshKey() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  return { refreshKey, refresh };
}
