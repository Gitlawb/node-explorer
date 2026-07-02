import { Skeleton } from '../ui/Skeleton';

export function RepoRowSkeleton() {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)_auto] md:grid-cols-[24px_minmax(0,5fr)_minmax(0,4fr)_90px_90px]
      items-start gap-x-3 md:gap-x-4 px-4 sm:px-6 py-4 border-b border-border-inner last:border-b-0">
      <span />
      <div>
        <Skeleton className="h-4 w-48 max-w-full" />
        <div className="flex gap-1.5 mt-2.5">
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
      <Skeleton className="hidden md:block h-4 w-3/4 mt-[2px]" />
      <Skeleton className="hidden md:block h-4 w-12 mt-[2px]" />
      <Skeleton className="h-4 w-14 mt-[2px] justify-self-end" />
    </li>
  );
}
