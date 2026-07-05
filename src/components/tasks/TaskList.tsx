import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { ApiTask } from '../../lib/api';
import { taskTitle, shortDid, timeAgo } from '../../lib/api';
import { taskStatusColor } from './status';
import { MicroLabel } from '../ui/MicroLabel';
import { Skeleton } from '../ui/Skeleton';

function TaskRow({ task, index }: { task: ApiTask; index: number }) {
  return (
    <li
      className="border-b border-border-inner last:border-b-0 hover:bg-hover transition-colors
        animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${index * 16}ms` }}
    >
      <Link
        to={`/tasks/${task.id}`}
        className="grid grid-cols-[16px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_150px_150px_90px]
          items-baseline gap-x-3 md:gap-x-4 px-4 sm:px-6 py-3
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
      >
        <span
          aria-hidden="true"
          className={cn('text-[8px] leading-none select-none self-start pt-[5px]', taskStatusColor(task.status))}
          title={task.status}
        >
          ◆
        </span>

        {/* Title + kind/capability */}
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-foreground">{taskTitle(task)}</span>
          <span className="block mt-0.5 text-[11px] text-dim truncate">
            {task.kind}
            {task.capability && <> · {task.capability}</>}
            <span className="md:hidden"> · {task.status}</span>
          </span>
        </span>

        {/* Delegator */}
        <span className="hidden md:block text-[12px] text-muted-foreground truncate" title={task.delegator_did}>
          {shortDid(task.delegator_did)} →
        </span>

        {/* Assignee */}
        <span
          className={cn('hidden md:block text-[12px] truncate', task.assignee_did ? 'text-muted-foreground' : 'text-dim')}
          title={task.assignee_did ?? undefined}
        >
          {task.assignee_did ? shortDid(task.assignee_did) : 'unclaimed'}
        </span>

        {/* Time */}
        <span className="text-[11px] text-dim tabular-nums text-right whitespace-nowrap">
          {timeAgo(task.created_at)}
        </span>
      </Link>
    </li>
  );
}

function TaskRowSkeleton() {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_150px_150px_90px]
      items-center gap-x-3 md:gap-x-4 px-4 sm:px-6 py-3 border-b border-border-inner last:border-b-0">
      <span />
      <div>
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-3 w-32 mt-1.5" />
      </div>
      <Skeleton className="hidden md:block h-4 w-24" />
      <Skeleton className="hidden md:block h-4 w-24" />
      <Skeleton className="h-3 w-14 justify-self-end" />
    </li>
  );
}

interface TaskListProps {
  tasks: ApiTask[] | null;
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

export function TaskList({ tasks, loading = false, skeletonCount = 10, emptyMessage = 'no tasks match' }: TaskListProps) {
  return (
    <div className={cn(
      'border border-border transition-opacity duration-200',
      loading && tasks !== null && 'opacity-40 pointer-events-none',
    )}>
      <div className="hidden md:grid grid-cols-[24px_minmax(0,1fr)_150px_150px_90px] gap-x-4 px-6 h-10 items-center border-b border-border bg-surface">
        <span />
        <MicroLabel>task</MicroLabel>
        <MicroLabel>delegator</MicroLabel>
        <MicroLabel>assignee</MicroLabel>
        <MicroLabel className="text-right">created</MicroLabel>
      </div>

      {tasks === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading tasks">
          {Array.from({ length: skeletonCount }, (_, i) => <TaskRowSkeleton key={i} />)}
        </ul>
      ) : tasks.length === 0 ? (
        <p className="m-0 py-20 text-center text-[13px] text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {tasks.map((task, i) => <TaskRow key={task.id} task={task} index={i} />)}
        </ul>
      )}
    </div>
  );
}
