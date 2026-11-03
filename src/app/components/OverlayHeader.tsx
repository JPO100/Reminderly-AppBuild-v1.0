import type { ReactNode } from "react";

// Centred overlay header area (docs/design-standards/overlay-standards.md): a Header (Lato Bold 20px, #1C2C42) and an
// optional Title (Lato Bold 17px, #939393) below it. The Header is one line and truncates. The Title wraps unless
// singleLine is set.
//
// The Header-to-Title distance is 30px measured from the Header's baseline to the Title's cap top, not between text
// boxes, as rendered in the iOS web view (WKWebView), which is where the app runs (John, 2026-11-03).
//   WKWebView (measured): the Header line box is fixed at 24px and its baseline sits 19px below its top, so 5px above
//   the box bottom; a 17px Title line (line-height normal) is 21px high with its baseline 17px below the top and its
//   cap top 17 - 0.723 x 17 = 4.72px below the top.
//   Box gap = 30 - 5 - 4.72 = 20.28px. (Chromium, used for the earlier reference sheet, put the Header baseline 20px
//   down and gave 21.25px; the iOS web view governs.)
export const HEADER_TITLE_GAP = 20.28;
// The same gap applies between two Title lines (Reminder info): 30px from one line's baseline to the next line's cap top.
// The header area ends at the bottom of its last line (the bottom of the descenders, which is the bottom of the line box).
// Whatever comes below it, a toggle, button, image or text, starts 30px lower (docs/design-standards/overlay-standards.md).
// Cards lay their children out with a 40px gap, so the header area is pulled 10px into it.
export const HEADER_TO_CONTENT = 30;
export const HEADER_PULL = 10;

export function OverlayHeader({ header, title, singleLine }: { header: ReactNode; title?: ReactNode; singleLine?: boolean }) {
  return (
    <div className="flex flex-col items-center shrink-0 w-full" style={{ gap: HEADER_TITLE_GAP, marginBottom: -HEADER_PULL }}>
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
