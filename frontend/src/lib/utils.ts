import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'text-success';
    case 'IN_PROGRESS': return 'text-primary';
    case 'SUCCESSFUL': return 'text-success';
    case 'CANCELLED': return 'text-danger';
    case 'EXPIRED': return 'text-gray-500';
    case 'PENDING': return 'text-warning';
    case 'ACCEPTED': return 'text-success';
    case 'REJECTED': return 'text-danger';
    default: return 'text-gray-400';
  }
}

export function getStatusBg(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-success/10 text-success border-success/20';
    case 'IN_PROGRESS': return 'bg-primary/10 text-primary border-primary/20';
    case 'SUCCESSFUL': return 'bg-success/10 text-success border-success/20';
    case 'CANCELLED': return 'bg-danger/10 text-danger border-danger/20';
    case 'EXPIRED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    case 'PENDING': return 'bg-warning/10 text-warning border-warning/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
