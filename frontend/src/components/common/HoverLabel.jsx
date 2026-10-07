import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GAP = 4;
const EDGE_MARGIN = 8;

// Instant hover label instead of `title` — the native one has a ~1s browser
// delay. Rendered in a portal with position: fixed, so overflow-hidden cells
// don't clip it and it can be attached to any element (even a <tr>).
// Shows above the element, flips below when there's no room, and is kept
// inside the viewport horizontally.
export function useHoverLabel(label) {
  const [anchor, setAnchor] = useState(null);
  const [pos, setPos] = useState(null);
  const tipRef = useRef(null);

  useLayoutEffect(() => {
    if (!anchor || !tipRef.current) return;
    const { width, height } = tipRef.current.getBoundingClientRect();
    const centered = anchor.left + anchor.width / 2 - width / 2;
    const left = Math.max(EDGE_MARGIN, Math.min(centered, window.innerWidth - width - EDGE_MARGIN));
    const above = anchor.top - height - GAP;
    setPos({ left, top: above >= EDGE_MARGIN ? above : anchor.bottom + GAP });
  }, [anchor]);

  function hide() {
    setAnchor(null);
    setPos(null);
  }

  // Also hidden on press: a click often opens a modal or overlay under the
  // cursor, and mouseleave wouldn't fire until the mouse moves again.
  const hoverProps = label
    ? {
        onMouseEnter: (e) => setAnchor(e.currentTarget.getBoundingClientRect()),
        onMouseLeave: hide,
        onMouseDown: hide,
      }
    : {};

  const tip =
    label && anchor
      ? createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            className="fixed z-[9999] w-max max-w-[320px] px-2 py-1 rounded bg-[#1a2332] text-white text-[11px] font-medium leading-snug whitespace-normal break-words pointer-events-none"
            // Rendered hidden first so its size can be measured before placing it
            style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}
          >
            {label}
          </span>,
          document.body
        )
      : null;

  return { hoverProps, tip };
}

export function HoverLabel({ label, as: Tag = 'span', className = '', children }) {
  const { hoverProps, tip } = useHoverLabel(label);
  return (
    <Tag className={className} {...hoverProps}>
      {children}
      {tip}
    </Tag>
  );
}
