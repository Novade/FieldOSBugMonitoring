// Shared table and form class strings (from ErrorBoundary primary button,
// FilterBar button/input, BacklogTable th/td) so new pages match the app.
export const btnPrimary =
  'inline-flex items-center gap-1.5 h-[34px] px-4 bg-brand text-white rounded-md text-[13px] font-medium hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const btnSecondary =
  'inline-flex items-center h-[34px] px-[14px] border border-line rounded-md text-[13px] bg-surface text-ink hover:border-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const btnDanger =
  'inline-flex items-center gap-1.5 h-[34px] px-4 bg-[#c0392b] text-white rounded-md text-[13px] font-medium hover:bg-[#a93226] transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const input =
  'w-full h-[34px] px-[10px] border border-line rounded-md text-[13px] bg-surface text-ink outline-none focus:border-brand';

export const th =
  'text-left px-3.5 py-2.5 font-semibold text-[11px] text-ink-subtle bg-canvas border-b border-line uppercase tracking-[.5px] whitespace-nowrap';

export const thSortable = `${th} cursor-pointer select-none hover:text-brand hover:bg-brand-tint`;

export const td = 'px-3.5 py-[9px] border-b border-line-soft';
