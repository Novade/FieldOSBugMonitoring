import { Check, Circle, X } from 'lucide-react';

// Shared result states: filled amber dot while running, green check on
// success, red cross on failure.
export const RESULT_STATES = {
  running: { Icon: Circle, color: '#d97706', filled: true },
  passed: { Icon: Check, color: '#2e7d5e' },
  failed: { Icon: X, color: '#c0392b' },
};

// Filled dots render smaller so they read at the same visual weight as the
// stroke icons.
export function StateIcon({ state }) {
  return (
    <state.Icon
      size={state.filled ? 8 : 12}
      strokeWidth={2.5}
      color={state.color}
      fill={state.filled ? state.color : 'none'}
      className="shrink-0"
    />
  );
}
