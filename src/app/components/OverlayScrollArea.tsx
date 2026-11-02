import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// The settings cards' 40px bottom padding: the footer below content that fits.
const SCROLL_PEEK = 40;
// Footer below content that overflows: the scroll area ends this far above the card's edge, as a hard edge, with the
// scroll indicator centred in it (John, 2026-10-26; docs/plans/overlay-scrolling.md).
const OVERFLOW_FOOTER = 30;
// Overflow must exceed this before the indicator shows, so rounding at the threshold never makes it flicker.
const OVERFLOW_TOLERANCE = 1;
// Overlay Design Standards v2: the area sits below the header area with a gap before it (40px, the card's gap). Its top
// edge, where scrolled content is clipped, lies SCROLL_TOP_CLEARANCE below the header area: the area is pulled up by
// (gap - SCROLL_TOP_CLEARANCE) and the same amount is added back as padding, so the first row still starts `gap` below
// the header area.
const SCROLL_TOP_CLEARANCE = 20;

// Down arrow shown in the footer while there is more content below (John's SVG, #D9D9D9). Visual only: not tappable.
function ScrollIndicator({ visible, bottom }: { visible: boolean; bottom: number }) {
  return (
    <div data-scroll-indicator aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom, visibility: visible ? "visible" : "hidden" }}>
      <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
        <path d="M0.322842 1.74896C-0.107614 1.36744 -0.107614 0.748782 0.322842 0.367263C0.75329 -0.0141897 1.45106 -0.0142031 1.88149 0.367263L5.95385 3.97689L10.1185 0.285692C10.5489 -0.0957689 11.2467 -0.0957661 11.6772 0.285692C12.1076 0.667211 12.1076 1.28587 11.6772 1.66739L6.90621 5.89595C6.8632 5.95639 6.81223 6.01382 6.75282 6.06648C6.3224 6.4479 5.62461 6.44788 5.19417 6.06648L0.322842 1.74896Z" fill="#D9D9D9" />
      </svg>
    </div>
  );
}

// Content below the page title, 30px between rows. It takes whatever height the card leaves it and never changes the
// card's height. When the content overflows, the area ends OVERFLOW_FOOTER above the card's edge instead of SCROLL_PEEK
// and the indicator shows until the content is scrolled to its end. Whether it overflows is measured against the 40px
// footer height, which does not depend on the result, so the two states never feed back into each other.
// pinned: a 50px button kept below the area (information pages' Back). The area fills the card, so the button always sits
// at the card's bottom padding, with any unused space between the content and the button; the footer and indicator sit
// between the area and the button.
const PINNED_BUTTON_HEIGHT = 50;
export function ScrollArea({ children, pinned, gap = 40 }: { children: ReactNode; pinned?: ReactNode; gap?: number }) {
  const topPadding = gap - SCROLL_TOP_CLEARANCE;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const overflowsRef = useRef(overflows);
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const rows = rowsRef.current;
    if (!scroll || !rows) return;
    const measure = () => {
      const fitsHeight = scroll.clientHeight - topPadding - (overflowsRef.current ? SCROLL_PEEK - OVERFLOW_FOOTER : 0);
      const next = rows.offsetHeight > fitsHeight + OVERFLOW_TOLERANCE;
      if (next !== overflowsRef.current) {
        overflowsRef.current = next;
        setOverflows(next);
      }
      setAtEnd(scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - OVERFLOW_TOLERANCE);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(rows);
    scroll.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      scroll.removeEventListener("scroll", measure);
    };
  }, [topPadding]);
  return (
    <>
      <div ref={scrollRef} className="relative w-full min-h-0 flex-1 overflow-y-auto" style={{ marginTop: -topPadding, paddingTop: topPadding, ...(overflows ? { marginBottom: OVERFLOW_FOOTER - SCROLL_PEEK } : undefined) }}>
        <div ref={rowsRef} className="content-stretch flex flex-col gap-[30px] items-start relative w-full">
          {children}
        </div>
      </div>
      {pinned}
      {overflows && <ScrollIndicator visible={!atEnd} bottom={pinned ? PINNED_BUTTON_HEIGHT + (OVERFLOW_FOOTER - 7) / 2 : -(SCROLL_PEEK - (OVERFLOW_FOOTER - 7) / 2)} />}
    </>
  );
}
