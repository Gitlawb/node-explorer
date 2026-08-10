import { Button } from '@heroui/react';
import { CopyButton } from '../ui/CopyButton';
import { MicroLabel } from '../ui/MicroLabel';

interface ClonePanelProps {
  cloneUrl: string;
  onNavigate: (tab: string) => void;
}

export function ClonePanel({ cloneUrl, onNavigate }: ClonePanelProps) {
  const cloneCommand = `git clone ${cloneUrl}`;

  return (
    <div className="space-y-3">
      {/* Clone panel */}
      <div className="border border-border p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <MicroLabel className="mt-px">clone command</MicroLabel>
          <CopyButton value={cloneCommand} label="copy" />
        </div>
        <code className="block text-[11px] sm:text-[12.5px] break-all leading-[1.9] text-foreground bg-surface border border-separator px-3 py-2">
          <span className="text-muted select-none">$ </span>{cloneCommand}
        </code>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button fullWidth onPress={() => onNavigate('code')}>
          browse code →
        </Button>
        <Button fullWidth variant="secondary" onPress={() => onNavigate('pulls')}>
          pull requests →
        </Button>
      </div>
    </div>
  );
}
