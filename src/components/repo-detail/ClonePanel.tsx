import { CopyButton } from '../ui/CopyButton';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface ClonePanelProps {
  cloneUrl: string;
}

export function ClonePanel({ cloneUrl }: ClonePanelProps) {
  const cloneCommand = `git clone ${cloneUrl}`;

  return (
    <div className="space-y-3">
      {/* Clone card */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-[11px] uppercase tracking-[0.08em] font-semibold mt-px text-muted-foreground">
              Clone
            </span>
            <CopyButton value={cloneCommand} label="copy" />
          </div>
          <code className="block text-[11px] sm:text-[13px] font-mono break-all leading-[1.9] text-foreground">
            {cloneCommand}
          </code>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="default"
          className="h-10 text-[13px] sm:text-[14px] font-medium rounded-lg"
        >
          browse code →
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 text-[13px] sm:text-[14px] font-medium rounded-lg"
        >
          pull requests →
        </Button>
      </div>
    </div>
  );
}
