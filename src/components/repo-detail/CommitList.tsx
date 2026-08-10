import { Table } from '@heroui/react';
import type { RepoCommit } from '../../types/repo';

interface CommitListProps {
  commits: RepoCommit[];
}

export function CommitList({ commits }: CommitListProps) {
  if (commits.length === 0) {
    return (
      <div className="flex items-center justify-center py-14 border border-border">
        <p className="m-0 text-[13px] text-muted">no commits yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Commits">
            <Table.Header>
              <Table.Column className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6 w-24 sm:w-28">
                Hash
              </Table.Column>
              <Table.Column className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6">
                Message
              </Table.Column>
              <Table.Column className="hidden sm:table-cell text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6 w-32">
                Author
              </Table.Column>
              <Table.Column className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground h-10 px-4 sm:px-6 text-right w-24 sm:w-28">
                When
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {commits.map(commit => (
                <Table.Row key={commit.hash}>
                  <Table.Cell className="px-4 sm:px-6 py-2.5 sm:py-3">
                    <span className="text-[12px] sm:text-[13px] text-accent">
                      {commit.shortHash}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="px-4 sm:px-6 py-2.5 sm:py-3 min-w-0">
                    <span className="block truncate text-[13px] sm:text-[14px] text-foreground">
                      {commit.message}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="hidden sm:table-cell px-4 sm:px-6 py-2.5 sm:py-3">
                    <span className="text-[12px] sm:text-[13px] text-muted truncate block max-w-[120px]">
                      {commit.author ?? '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="px-4 sm:px-6 py-2.5 sm:py-3 text-right">
                    <span className="font-mono text-[11px] sm:text-[12px] tabular-nums text-muted whitespace-nowrap">
                      {commit.time}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
