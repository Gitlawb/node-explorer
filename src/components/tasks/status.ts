import type { TaskStatus } from '../../lib/api';

export const TASK_STATUSES: TaskStatus[] = ['pending', 'claimed', 'completed', 'failed'];

/** Diamond-dot color per task status (matches the agent/peer dot idiom). */
export function taskStatusColor(status: string): string {
  switch (status) {
    case 'claimed':
      return 'text-warm';
    case 'completed':
      return 'text-ok';
    case 'failed':
      return 'text-destructive';
    default: // pending & unknown
      return 'text-status-dot';
  }
}
