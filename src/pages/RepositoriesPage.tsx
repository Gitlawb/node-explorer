import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { DEFAULT_PER_PAGE } from '../lib/mock-data';
import { useRepositories } from '../hooks/useRepositories';
import { RepoTable } from '../components/repos/RepoTable';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { InputGroup, InputGroupInput, InputGroupAddon } from '../components/ui/input-group';

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className="text-muted-foreground">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

export default function RepositoriesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const search = searchParams.get('q') ?? '';

  const handleSearch = (val: string) => {
    const dest = val ? `/repos?q=${encodeURIComponent(val)}` : '/repos';
    navigate(dest, { replace: location.pathname === '/repos' });
  };

  useEffect(() => { setPage(1); }, [search]);

  const { repos, totalCount, totalPages, windowStart, windowEnd, loading, error } = useRepositories({
    page,
    perPage,
    search,
    refreshKey,
  });

  const handlePerPageChange = (n: number) => {
    setPerPage(n);
    setPage(1);
  };

  const handleRefresh = () => {
    if (loading) return;
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-12">

      <RepoHero
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        windowStart={windowStart}
        windowEnd={windowEnd}
        refreshing={loading}
        onRefresh={handleRefresh}
      />

      <div className="pt-7 pb-24">

        {/* Count line */}
        <div className="flex items-center justify-between mb-5 px-1 h-10">
          <span className="text-[13px] text-muted-foreground font-mono tabular-nums">
            {loading
              ? 'Loading…'
              : error
                ? <span className="text-red-500">Error: {error}</span>
                : search
                  ? `${totalCount} ${totalCount === 1 ? 'result' : 'results'}`
                  : `${windowStart}–${windowEnd} of ${totalCount.toLocaleString()}`
            }
          </span>
        </div>

        {/* Search */}
        <div className="mb-4">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search repositories…"
              className="pl-11"
            />
          </InputGroup>
        </div>

        {/* Table */}
        <RepoTable repos={repos} loading={loading} />

        {/* Pagination */}
        {!search && !loading && !error && (
          <RepoPagination
            page={page}
            totalPages={totalPages}
            perPage={perPage}
            totalCount={totalCount}
            windowStart={windowStart}
            windowEnd={windowEnd}
            onPageChange={setPage}
            onPerPageChange={handlePerPageChange}
          />
        )}

      </div>
    </div>
  );
}
