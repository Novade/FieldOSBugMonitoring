import { HoverLabel } from './HoverLabel';

export function IconButton({ icon: Icon, label, onClick, disabled, spinning, danger }) {
  return (
    <HoverLabel label={label} className="inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`p-1.5 rounded-md text-ink-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          danger ? 'hover:bg-danger-tint hover:text-danger' : 'hover:bg-brand-tint hover:text-brand'
        }`}
      >
        <Icon size={15} className={spinning ? 'animate-spin' : ''} />
      </button>
    </HoverLabel>
  );
}
