// Class strings copied from existing components (ErrorBoundary primary button,
// FilterBar button/input, BacklogTable th/td) so this feature matches the app.
export const btnPrimary =
  'inline-flex items-center gap-1.5 h-[34px] px-4 bg-brand text-white rounded-md text-[13px] font-medium hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const btnSecondary =
  'inline-flex items-center h-[34px] px-[14px] border border-[#dde2ea] rounded-md text-[13px] bg-white text-[#1a2332] hover:border-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const btnDanger =
  'inline-flex items-center gap-1.5 h-[34px] px-4 bg-[#c0392b] text-white rounded-md text-[13px] font-medium hover:bg-[#a93226] transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const input =
  'w-full h-[34px] px-[10px] border border-[#dde2ea] rounded-md text-[13px] bg-white text-[#1a2332] outline-none focus:border-brand';

export const th =
  'text-left px-3.5 py-2.5 font-semibold text-[11px] text-[#8896b0] bg-[#f5f7fa] border-b border-[#dde2ea] uppercase tracking-[.5px] whitespace-nowrap';

export const thSortable = `${th} cursor-pointer select-none hover:text-brand hover:bg-[#eef2fb]`;

export const td = 'px-3.5 py-[9px] border-b border-[#eef0f4]';
