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
