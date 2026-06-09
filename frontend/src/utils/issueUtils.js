import { OPEN_STATUSES, DEPLOY_STATUSES } from '../constants/jira';

export const isOpen = (b) => OPEN_STATUSES.has(b.st);
export const isDeploy = (b) => DEPLOY_STATUSES.has(b.st);
export const isResolved = (b) => b.st === 'Done' && !!b.r;

export function pillStatus(s) {
  if (s === 'Done') return 'bg-[#e6f4ed] text-[#1a6641]';
  if (s === 'Blocked') return 'bg-[#fde8e8] text-[#9b1c1c]';
  if (s === 'To Do') return 'bg-[#f0f2f5] text-[#4a5568]';
  return 'bg-[#fef3e2] text-[#7a4e00]';
}

export function pillPriority(p) {
  const map = {
    Highest: 'bg-[#4a0000] text-[#ffcdd2]',
    High: 'bg-[#7b2020] text-[#fde8e8]',
    Medium: 'bg-[#6b4000] text-[#fde8c0]',
    Low: 'bg-[#1a3866] text-[#c5d8ff]',
    Lowest: 'bg-[#0d4d6b] text-[#b8eeff]',
  };
  return map[p] || 'bg-gray-100 text-gray-600';
}
