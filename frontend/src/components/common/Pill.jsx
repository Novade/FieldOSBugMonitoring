import { pillStatus, pillPriority } from '../../utils/issueUtils';

export function StatusPill({ status }) {
  return (
    <span
      className={`inline-block px-[9px] py-[2px] rounded-[20px] text-[11px] font-semibold whitespace-nowrap ${pillStatus(
        status
      )}`}
    >
      {status}
    </span>
  );
}

export function PriorityPill({ priority }) {
  return (
    <span
      className={`inline-block px-[9px] py-[2px] rounded-[20px] text-[11px] font-semibold whitespace-nowrap ${pillPriority(
        priority
      )}`}
    >
      {priority}
    </span>
  );
}
