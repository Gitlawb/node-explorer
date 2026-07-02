import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Single source of truth for the page container. 1280px matches the width the
// best-regarded dev tools converge on (GitLab fixed mode, GitHub classic);
// wider containers read as "stretched, not dense".
export const PAGE_CONTAINER = 'max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12';
