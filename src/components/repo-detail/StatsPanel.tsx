import type { RepoCommit } from '../../types/repo';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface StatsPanelProps {
  stars: number;
  latestCommit: RepoCommit;
}

export function StatsPanel({ stars, latestCommit }: StatsPanelProps) {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-2">
          {/* Stars */}
          <div className="px-4 sm:px-5 py-4 sm:py-5">
            <p className="text-[11px] uppercase tracking-[0.08em] font-semibold mb-3 text-muted-foreground">
              Stars
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-[28px] sm:text-[32px] font-bold leading-none tabular-nums text-foreground">
                {stars}
              </p>
              <Badge
                variant="outline"
                className="border-border text-muted-foreground bg-transparent text-[11px] font-medium px-1.5 py-0 rounded-md"
              >
                {stars}
              </Badge>
            </div>
            <p className="text-[12px] text-muted-foreground">social proof</p>
          </div>

          {/* Latest commit */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 border-l border-border">
            <p className="text-[11px] uppercase tracking-[0.08em] font-semibold mb-3 text-muted-foreground">
              Latest
            </p>
            <p
              className="text-[17px] sm:text-[19px] font-mono font-bold leading-none mb-2"
              style={{ color: 'var(--color-warm)' }}
            >
              {latestCommit.shortHash}
            </p>
            <p className="text-[12px] text-muted-foreground">{latestCommit.time}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
