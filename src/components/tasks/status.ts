import type { TaskStatus } from '../../lib/api';

export const TASK_STATUSES: TaskStatus[] = ['pending', 'claimed', 'completed', 'failed'];

/** Diamond-dot color per task status (matches the agent/peer dot idiom). */
export function taskStatusColor(status: string): string {
  switch (status) {
    case 'claimed':
      return 'text-accent';
    case 'completed':
      return 'text-success';
    case 'failed':
      return 'text-danger';
    default: // pending & unknown
      return 'text-muted';
  }
}

/**
 * Fill colour per task status, for bars and swatches.
 *
 * Written out rather than derived from `taskStatusColor` by swapping the
 * prefix: Tailwind generates CSS only for class names it can read in the
 * source, so a name assembled at runtime produces no rule at all and the
 * element paints nothing.
 */
export function taskStatusFill(status: string): string {
  switch (status) {
    case 'claimed':
      return 'bg-accent';
    case 'completed':
      return 'bg-success';
    case 'failed':
      return 'bg-danger';
    default: // pending & unknown
      return 'bg-muted';
  }
}
