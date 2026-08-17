import { Table } from '../register/controls';
import { Folder, FolderOpen } from 'lucide-react';
import type { RepoFile } from '../../types/repo';
import { getFileIcon } from '../../lib/fileIcons';

interface FileListProps {
  files: RepoFile[];
  onClickEntry?: (entry: RepoFile) => void;
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
    return <Icon size={15} className="flex-shrink-0" style={{ color }} />;
  }

  const info = getFileIcon(name);
  const Icon = info.icon;
  return <Icon size={15} className="flex-shrink-0" style={{ color: info.color }} />;
}

export function FileList({ files, onClickEntry }: FileListProps) {
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
              <Table.Column className="text-[12px] font-semibold text-muted h-9 px-4">
                Name
              </Table.Column>
              <Table.Column className="text-[12px] font-semibold text-muted h-9 px-4 text-right w-20 sm:w-24">
                Size
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {files.map(file => (
                <Table.Row
                  key={file.name}
                  id={file.name}
                  onAction={onClickEntry ? () => onClickEntry(file) : undefined}
                  className={onClickEntry ? 'cursor-pointer hover:bg-surface-secondary transition-colors' : 'cursor-default'}
                >
                  <Table.Cell className="px-4 sm:px-6 py-2.5 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FileIcon name={file.name} type={file.type} />
                      <span className="text-[13px] sm:text-[14px] text-foreground">{file.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="px-4 sm:px-6 py-2.5 sm:py-3 text-right">
                    {file.size && file.size !== '—' ? (
                      <span className="text-[11px] sm:text-[12px] tabular-nums font-mono text-muted">
                        {file.size}
                      </span>
                    ) : null}
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
