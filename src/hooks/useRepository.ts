import { useMemo } from 'react';
import { mockRepositories } from '../lib/mock-data';
import type { Repository } from '../types/repo';

interface Result {
  repo: Repository | null;
  notFound: boolean;
}

export function useRepository(owner: string, name: string): Result {
  return useMemo(() => {
    const repo = mockRepositories.find(r => r.owner === owner && r.name === name) ?? null;
    return { repo, notFound: repo === null };
  }, [owner, name]);
}
