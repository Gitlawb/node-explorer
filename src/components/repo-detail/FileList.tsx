import { Link, type To } from 'react-router-dom';
import { Table } from '../register/controls';
import { Folder, FolderOpen } from 'lucide-react';
import type { RepoFile } from '../../types/repo';
import { getFileIcon } from '../../lib/fileIcons';

interface FileListProps {
  files: RepoFile[];
  getEntryTo: (entry: RepoFile) => To;
}

const DIR_ICONS = new Map<string, { icon: typeof Folder; color: string }>([
  ['node_modules', { icon: Folder, color: '#519aba' }],
  ['src', { icon: Folder, color: '#519aba' }],
  ['dist', { icon: Folder, color: '#8c8c8c' }],
  ['build', { icon: Folder, color: '#8c8c8c' }],
  ['.git', { icon: Folder, color: '#e44d26' }],
  ['public', { icon: Folder, color: '#8c8c8c' }],
  ['docs', { icon: Folder, color: '#3070b0' }],
  ['test', { icon: Folder, color: '#8bc34a' }],
  ['tests', { icon: Folder, color: '#8bc34a' }],
  ['__tests__', { icon: Folder, color: '#8bc34a' }],
  ['components', { icon: FolderOpen, color: '#519aba' }],
  ['lib', { icon: Folder, color: '#8c8c8c' }],
  ['utils', { icon: Folder, color: '#8c8c8c' }],
  ['hooks', { icon: Folder, color: '#519aba' }],
  ['pages', { icon: FolderOpen, color: '#519aba' }],
  ['api', { icon: Folder, color: '#519aba' }],
  ['styles', { icon: Folder, color: '#cc6699' }],
  ['assets', { icon: Folder, color: '#b06fba' }],
  ['images', { icon: Folder, color: '#b06fba' }],
  ['lang', { icon: Folder, color: '#8c8c8c' }],
  ['locales', { icon: Folder, color: '#8c8c8c' }],
]);

function FileIcon({ name, type }: { name: string; type: string }) {
  if (type === 'dir') {
    const dirIcon = DIR_ICONS.get(name);
    const Icon = dirIcon?.icon ?? Folder;
    const color = dirIcon?.color ?? '#7c8a9a';
    return <Icon size={15} aria-hidden="true" className="flex-shrink-0" style={{ color }} />;
  }

  const info = getFileIcon(name);
  const Icon = info.icon;
  return <Icon size={15} aria-hidden="true" className="flex-shrink-0" style={{ color: info.color }} />;
}

export function FileList({ files, getEntryTo }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center py-14">
        <p className="m-0 text-[13px] text-muted">no files</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Files">
            <Table.Header>
              <Table.Column className="text-[12px] font-semibold text-muted h-8 px-4">
                Name
              </Table.Column>
              {/* Wide enough for "32.2 KB" on one line. At w-20 the unit wrapped
                  under the number, which made that row taller than the rest and
                  broke the list's rhythm. */}
              <Table.Column className="text-[12px] font-semibold text-muted h-8 px-4 text-right w-24 sm:w-28">
                Size
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {files.map(file => (
                <Table.Row
                  key={file.name}
                  id={file.name}
                  className="group"
                >
                  <Table.Cell colSpan={2} className="p-0">
                    <Link
                      to={getEntryTo(file)}
                      data-row-link="true"
                      className="grid min-h-8 grid-cols-[minmax(0,1fr)_6rem] sm:grid-cols-[minmax(0,1fr)_7rem]
                        items-center hover:bg-surface-secondary transition-colors
                        focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]"
                    >
                      {/* A fixed line box keeps file and directory rows at the
                          same density while the link makes the whole row one
                          keyboard- and modifier-clickable navigation target. */}
                      <span className="flex h-5 min-w-0 items-center gap-2.5 px-4 sm:px-5">
                        <FileIcon name={file.name} type={file.type} />
                        <span translate="no" className="truncate text-[13.5px] leading-5 text-foreground">
                          {file.name}
                        </span>
                      </span>
                      <span className="h-5 whitespace-nowrap px-4 sm:px-5 text-right text-[12px]
                        leading-5 tabular-nums font-mono text-muted">
                        {file.size && file.size !== '—' ? file.size : ''}
                      </span>
                    </Link>
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
