import type { Repository } from '../../types/repo';
import { CopyButton } from '../ui/CopyButton';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

interface DetailHeaderProps {
  repo: Repository;
}

export function DetailHeader({ repo }: DetailHeaderProps) {
  const fullDid = `did:key:${repo.owner}`;

  return (
    <div className="min-w-0">
      {/* Title */}
      <h1 className="text-[22px] sm:text-[30px] lg:text-[42px] font-bold tracking-[-0.03em] leading-tight mb-3 text-foreground break-words">
        {repo.owner}/{repo.name}
      </h1>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4 sm:mb-5 flex-wrap">
        <Badge
          variant="outline"
          className="border-border text-foreground bg-transparent text-[12px] font-medium px-2.5 py-0.5 rounded-md"
        >
          {repo.branch}
        </Badge>
        <Badge
          variant="outline"
          className="border-border text-foreground bg-transparent text-[12px] font-medium px-2.5 py-0.5 rounded-md"
        >
          {repo.visibility}
        </Badge>
        <Badge
          variant="outline"
          className="border-border text-foreground bg-transparent text-[12px] font-medium px-2.5 py-0.5 rounded-md"
        >
          {repo.stars === 1 ? '1 star' : `${repo.stars} stars`}
        </Badge>
        {repo.isMirror && (
          <Badge
            variant="outline"
            className="border-border text-foreground bg-transparent text-[12px] font-medium px-2.5 py-0.5 rounded-md"
          >
            mirror
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-[14px] sm:text-[15px] leading-[1.75] mb-6 sm:mb-7 max-w-[560px] text-foreground">
        {repo.description}
      </p>

      {/* Owner/dates card */}
      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          {/* Owner row */}
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
            <span className="text-[11px] uppercase tracking-[0.08em] font-semibold w-[60px] sm:w-[68px] flex-shrink-0 text-muted-foreground">
              Owner
            </span>
            <span className="font-mono text-[11px] sm:text-[13px] flex-1 truncate min-w-0 text-foreground">
              {fullDid}
            </span>
            <CopyButton value={fullDid} label="copy" />
          </div>

          {/* Dates row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-7 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold w-[60px] sm:w-[68px] flex-shrink-0 text-muted-foreground">
                Updated
              </span>
              <span className="text-[13px] sm:text-[14px] text-foreground">{repo.updatedAt}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold w-[50px] sm:w-[58px] flex-shrink-0 text-muted-foreground">
                Created
              </span>
              <span className="text-[13px] sm:text-[14px] text-foreground">{repo.createdAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
