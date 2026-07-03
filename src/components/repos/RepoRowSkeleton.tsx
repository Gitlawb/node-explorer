import { Skeleton } from '../ui/Skeleton';

export function RepoRowSkeleton() {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)_auto] md:grid-cols-[24px_minmax(0,1fr)_120px_100px]
      items-start gap-x-3 md:gap-x-4 px-4 sm:px-6 py-4 md:py-5 border-b border-border-inner last:border-b-0">
      <span />
      <div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-48 max-w-full" />
          <Skeleton className="hidden sm:block h-7 w-14" />
          <Skeleton className="hidden sm:block h-7 w-16" />
        </div>
        <Skeleton className="h-3.5 w-3/4 max-w-96 mt-2" />
      </div>
      <div className="hidden md:flex justify-end self-center">
        <Skeleton className="h-[28px] w-[110px]" />
      </div>
      <Skeleton className="h-4 w-14 mt-[3px] justify-self-end" />
    </li>
  );
}
