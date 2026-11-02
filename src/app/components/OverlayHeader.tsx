import type { ReactNode } from "react";

// Centred overlay header area (docs/design.md, Overlay Design Standards v2): a Header (Lato Bold 20px, #1C2C42) and an
// optional Title (Lato Bold 17px, #939393) below it. The Header is one line and truncates. The Title wraps unless
// singleLine is set.
//
// The Header-to-Title distance is 30px measured from the Header's baseline to the Title's cap top, not between text
// boxes. Lato Bold (as bundled): ascent 0.987em, descent 0.213em, cap height 0.723em; line box 1.2em.
//   Header line box is fixed at 24px, so its baseline is 0.213 x 20 = 4.26px above the box bottom.
//   Title cap top is (0.987 - 0.723) x 17 = 4.488px below the top of its line box (line-height normal = 1.2em).
//   Box gap = 30 - 4.26 - 4.488 = 21.25px.
export const HEADER_TITLE_GAP = 21.25;

export function OverlayHeader({ header, title, singleLine }: { header: ReactNode; title?: ReactNode; singleLine?: boolean }) {
  return (
    <div className="flex flex-col items-center shrink-0 w-full" style={{ gap: HEADER_TITLE_GAP }}>
      <p className="font-['Lato:Bold',sans-serif] not-italic text-[20px] text-[#1C2C42] text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full" style={{ fontWeight: 700, lineHeight: "24px" }}>{header}</p>
      {title !== undefined && title !== null && title !== "" && (
        <p
          className={`font-['Lato:Bold',sans-serif] not-italic text-[17px] text-[#939393] text-center leading-[normal] max-w-full ${singleLine ? "whitespace-nowrap overflow-hidden text-ellipsis" : "whitespace-pre-wrap"}`}
          style={{ fontWeight: 700 }}
        >
          {title}
        </p>
      )}
    </div>
  );
}
