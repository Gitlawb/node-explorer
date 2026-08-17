import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Input, Button } from '../register/controls';
import type { Repository } from '../../types/repo';
import { getTreeIndex, subscribeTreeIndex, ensureTreeIndex, MAX_INDEX_FILES } from '../../lib/treeIndex';
import { fuzzyFilter } from '../../lib/fuzzy';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface FileFinderProps {
  repo: Repository;
  open: boolean;
  onClose: () => void;
  onOpenFile: (path: string) => void;
}

function splitPath(path: string): [string, string] {
  const i = path.lastIndexOf('/');
  return i === -1 ? ['', path] : [path.slice(0, i + 1), path.slice(i + 1)];
}

export function FileFinder({ repo, open, onClose, onOpenFile }: FileFinderProps) {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);

  useEffect(() => {
    if (open) ensureTreeIndex(repo.owner, repo.name, repo.id);
  }, [open, repo.owner, repo.name, repo.id]);

  const index = useSyncExternalStore(
    cb => subscribeTreeIndex(repo.id, cb),
    () => getTreeIndex(repo.id),
  );

  const results = useMemo(() => fuzzyFilter(query, index.files, 50), [query, index]);

  // Render-phase clamp when results shrink
  const resultsKey = `${query}:${results.length}`;
  const [prevResultsKey, setPrevResultsKey] = useState(resultsKey);
  if (prevResultsKey !== resultsKey) {
    setPrevResultsKey(resultsKey);
    if (sel >= results.length) setSel(0);
  }

  // Reset per open
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setSel(0);
    }
  }

  const pick = (path: string) => {
    onOpenFile(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[sel]) {
      e.preventDefault();
      pick(results[sel]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} label="find file">
      <Input
        autoFocus
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="find file…"
        aria-label="find file"
        autoComplete="off"
        spellCheck="false"
        variant="secondary"
        className="w-full h-12 px-5 border-b border-border rounded-none shadow-none"
      />
      <ul className="m-0 p-0 list-none max-h-[50vh] overflow-y-auto" role="listbox" aria-label="files">
        {results.map((path, i) => {
          const [dir, base] = splitPath(path);
          return (
            <li key={path} role="option" aria-selected={i === sel}>
              <Button
                variant="tertiary"
                onPress={() => pick(path)}
                onPointerEnter={() => setSel(i)}
                className={cn(
                  'w-full text-left px-5 py-2 text-[12.5px] truncate h-auto min-h-0 rounded-none',
                  i === sel ? 'bg-surface-secondary text-foreground' : 'text-muted',
                )}
              >
                <span className="text-muted">{dir}</span>
                <span className={cn(i === sel && 'font-bold', 'text-foreground')}>{base}</span>
              </Button>
            </li>
          );
        })}
        {results.length === 0 && index.status === 'done' && (
          <li className="px-5 py-6 text-center text-[12.5px] text-muted">no files match</li>
        )}
      </ul>
      <div className="flex items-center justify-between px-5 h-9 border-t border-border text-[11px] text-muted">
        <span>
          {index.status === 'building' ? (
            <span className="animate-pulse">indexing… {index.files.length.toLocaleString()} files</span>
          ) : index.partial ? (
            `partial index — first ${MAX_INDEX_FILES.toLocaleString()} files`
          ) : (
            `${index.files.length.toLocaleString()} files`
          )}
        </span>
        <span>↑↓ navigate · ↵ open · esc close</span>
      </div>
    </Modal>
  );
}
