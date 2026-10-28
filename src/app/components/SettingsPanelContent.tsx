import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToggleRow, MenuRow, KeyLine, InfoPageContext, ShowInfoIconsContext, InfoIcon } from "./DevToolsOverlay";
import svgPathsDummy from "../../imports/svg-enpj30u9ti";
import { getHapticsConfig, setHapticsConfig, HAPTIC_GROUPS, panelMasterKey } from "../utils/haptics";
import type { HapticAction, HapticPanel, HapticsConfig } from "../utils/haptics";
import { getSoundsConfig, setSoundsConfig, SOUND_GROUPS, panelMasterKey as soundsMasterKey } from "../utils/sounds";
import type { SoundsConfig } from "../utils/sounds";
import type { ListItemOrder } from "../utils/list-utils";
import { parseTokens } from "../utils/nlc-parser";

// Settings panel content. App owns and saves the values; rows show only when their feature is available.
// Each panel has its own Siri preference, saved by App. Each row shows only when its Siri flag is on.

// Centred overlay header: title centred, back arrow on the left for sub-pages, and an optional grey version line under the title,
// with an optional last updated line under it in the same style (Privacy policy and Terms of use; John, 2026-10-23).
// The back button pads the 9x17 arrow to a 45x45 tap area; the negative left offset keeps the arrow in place.
function PanelHeader({ title, version, updated, onBack }: { title: string; version?: string; updated?: string; onBack?: () => void }) {
  return (
    <div className="flex flex-col items-center shrink-0 w-full">
      <div className="relative flex items-center justify-center shrink-0 w-full">
        {onBack && (
          <button type="button" onClick={onBack} className="absolute left-[-18px] top-1/2 -translate-y-1/2 cursor-pointer shrink-0 px-[18px] py-[14px] m-0 border-none bg-transparent z-[1]" aria-label="Back">
            <div className="h-[17px] relative shrink-0 w-[9px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 17">
                <path d={svgPathsDummy.p347e8980} fill="#1C2C42" />
              </svg>
            </div>
          </button>
        )}
        <p className="font-['Lato:Bold',sans-serif] text-[20px] text-[#1C2C42] leading-[normal] text-center whitespace-pre-wrap px-[24px]" style={{ fontWeight: 700 }}>
          {title}
        </p>
      </div>
      {version && (
        <p className="font-['Lato:Medium',sans-serif] text-[15px] text-[#BABABA] leading-[20px] text-center mt-[8px]">
          {version}
        </p>
      )}
      {updated && (
        <p className="font-['Lato:Medium',sans-serif] text-[15px] text-[#BABABA] leading-[20px] text-center">
          {updated}
        </p>
      )}
    </div>
  );
}

// The settings cards' 40px bottom padding: the footer below content that fits.
const SCROLL_PEEK = 40;
// Footer below content that overflows: the scroll area ends this far above the card's edge, as a hard edge, with the
// scroll indicator centred in it (John, 2026-10-26; docs/plans/overlay-scrolling.md).
const OVERFLOW_FOOTER = 30;
// Overflow must exceed this before the indicator shows, so rounding at the threshold never makes it flicker.
const OVERFLOW_TOLERANCE = 1;

// Down arrow shown in the footer while there is more content below (John's SVG, #D9D9D9). Visual only: not tappable.
function ScrollIndicator({ visible }: { visible: boolean }) {
  return (
    <div data-scroll-indicator aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: -(SCROLL_PEEK - (OVERFLOW_FOOTER - 7) / 2), visibility: visible ? "visible" : "hidden" }}>
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
function ScrollArea({ children }: { children: ReactNode }) {
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
      const fitsHeight = scroll.clientHeight - (overflowsRef.current ? SCROLL_PEEK - OVERFLOW_FOOTER : 0);
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
  }, []);
  return (
    <>
      <div ref={scrollRef} className="relative w-full min-h-0 flex-1 overflow-y-auto" style={overflows ? { marginBottom: OVERFLOW_FOOTER - SCROLL_PEEK } : undefined}>
        <div ref={rowsRef} className="content-stretch flex flex-col gap-[30px] items-start relative w-full">
          {children}
        </div>
      </div>
      {overflows && <ScrollIndicator visible={!atEnd} />}
    </>
  );
}

// Info page: an info icon's description shown in the same card, laid out like the info overlay (title, text, button),
// with Back returning to the page it was opened from. The card fits its height to the text.
// The title has the info icon before it, in dark blue, 10px from the text, 1px below centre (John, 2026-10-22).
// Info page image: a mock-up of the New reminder panel with its quick date buttons, in a 216px frame with 15px padding,
// cut off at the bottom through the Date row (John, 2026-10-26).
function QuickDateButtonsImage() {
  return (
    <div className="relative shrink-0 w-[216px] h-[156px] overflow-hidden rounded-[11px] p-[15px] flex flex-col gap-[14px] bg-white" style={{ boxShadow: "inset 0 0 0 1px #D9D9D9" }} role="img" aria-label="New reminder with quick date buttons">
      <div className="flex items-center justify-between h-[24px] shrink-0">
        <p className="font-['Lato:Bold',sans-serif] text-[10px] text-[#1C2C42] leading-[normal]" style={{ fontWeight: 700 }}>New reminder</p>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="12" cy="12" r="12" fill="#4784F8" />
          <path d="M7.5 12.3L10.6 15.3L16.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="relative h-[40px] shrink-0 rounded-[6px] bg-[#F2F2F2] px-[8px] pt-[7px]">
        <p className="font-['Lato:Medium',sans-serif] text-[8.5px] text-[#1C2C42] leading-[normal]">Pick up milk</p>
        <svg className="absolute right-[7px] bottom-[6px]" width="7" height="10" viewBox="0 0 7 10" fill="none">
          <rect x="1.75" y="0.5" width="3.5" height="5.5" rx="1.75" stroke="#BABABA" strokeWidth="1" />
          <path d="M0.5 4.5C0.5 6.2 1.8 7.5 3.5 7.5C5.2 7.5 6.5 6.2 6.5 4.5M3.5 7.5V9.5" stroke="#BABABA" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex items-center justify-between shrink-0">
        {["Tomorrow morning", "Tonight", "Next week"].map((label) => (
          <div key={label} className="flex items-center justify-center h-[23px] px-[7px] rounded-[100px]" style={{ boxShadow: "inset 0 0 0 1px #B7B7B7" }}>
            <p className="font-['Lato',sans-serif] font-bold text-[7px] text-[#B7B7B7] whitespace-nowrap">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between h-[20px] shrink-0">
        <div className="flex items-center gap-[6px]">
          <svg width="10" height="10" viewBox="0 0 17 17" fill="none" className="shrink-0">
            <circle cx="8.25" cy="8.25" r="7.5" stroke="#1C2C42" strokeWidth="1.5" />
            <path d="M8.25 7.5V12M8.25 5.25H8.26" stroke="#1C2C42" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="font-['Lato:Bold',sans-serif] text-[10px] text-[#1C2C42] leading-[normal]" style={{ fontWeight: 700 }}>Date</p>
        </div>
        <div className="flex items-center justify-start h-[16px] w-[30px] p-[2px] rounded-[20px] bg-[#BABABA]">
          <div className="size-[12px] rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

// Info page image: the Time row on, with the time wheels at 12:30 stepping by the minute, in the same 216px frame,
// cut off at the bottom through the next row (John, 2026-10-26).
function MiniClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
      <circle cx="6.5" cy="6.5" r="5.75" stroke="#1C2C42" strokeWidth="1.3" />
      <path d="M6.5 3.5V6.5L8.5 8" stroke="#1C2C42" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Interactions page image: a typed reminder with its recognised date and time in blue, applied to the Date and Time rows,
// in the same 216px frame (John, 2026-10-26).
function InteractionsImage() {
  const rows = [
    { label: "Date", value: "Tomorrow", centre: 81 },
    { label: "Time", value: "3pm", centre: 107 },
  ];
  const textClassName = "font-['Lato:Bold',sans-serif] text-[8.5px] leading-[normal]";
  return (
    <div className="relative shrink-0 w-[216px] h-[132px] overflow-hidden rounded-[11px] bg-white mx-auto" style={{ boxShadow: "inset 0 0 0 1px #D9D9D9" }} role="img" aria-label="Typed reminder with its date and time applied">
      <div className="absolute left-[15px] right-[15px] top-[15px] h-[51px] rounded-[6px] bg-[#F2F2F2] px-[8px] pt-[9px]">
        <p className="font-['Lato:Medium',sans-serif] text-[8.5px] text-[#1C2C42] leading-[normal]">
          Call mum <span className="text-[#4784F8]">tomorrow</span> at <span className="text-[#4784F8]">3pm</span>
        </p>
        <svg className="absolute right-[7px] bottom-[6px]" width="7" height="10" viewBox="0 0 7 10" fill="none">
          <rect x="1.75" y="0.5" width="3.5" height="5.5" rx="1.75" stroke="#BABABA" strokeWidth="1" />
          <path d="M0.5 4.5C0.5 6.2 1.8 7.5 3.5 7.5C5.2 7.5 6.5 6.2 6.5 4.5M3.5 7.5V9.5" stroke="#BABABA" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
      {rows.map(({ label, value, centre }) => (
        <div key={label} className="absolute left-[21px] right-[20px] h-[15px] flex items-center" style={{ top: centre - 7.5 }}>
          <div className="flex items-center gap-[7px] w-[65px] shrink-0">
            <MiniClockIcon />
            <p className={`${textClassName} text-[#1C2C42]`} style={{ fontWeight: 700 }}>{label}</p>
          </div>
          <p className={`flex-1 ${textClassName} text-[#4784F8]`} style={{ fontWeight: 700 }}>{value}</p>
          <div className="flex items-center justify-end h-[15px] w-[29px] p-[2px] rounded-[20px] bg-[#4784F8] shrink-0">
            <div className="size-[11px] rounded-full bg-white" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OneMinuteTimeStepsImage() {
  const wheels = [
    { centre: 71, values: ["09", "10", "11", "12", "13"] },
    { centre: 146, values: ["27", "28", "29", "30", "31"] },
  ];
  const rowCentres = [58, 77.5, 97, 117, 137];
  const rowColours = ["#D9D9D9", "#BABABA", "#BABABA", "#1C2C42", "#BABABA"];
  return (
    <div className="relative shrink-0 w-[216px] h-[138px] overflow-hidden rounded-[11px] bg-white" style={{ boxShadow: "inset 0 0 0 1px #D9D9D9" }} role="img" aria-label="Time picker stepping by the minute">
      <div className="absolute left-[15px] right-[15px] top-[15px] h-[22px] flex items-center">
        <div className="flex items-center gap-[8px] w-[71px] shrink-0">
          <MiniClockIcon />
          <p className="font-['Lato:Bold',sans-serif] text-[8.5px] text-[#1C2C42] leading-[normal]" style={{ fontWeight: 700 }}>Time</p>
        </div>
        <p className="flex-1 font-['Lato:Bold',sans-serif] text-[8.5px] text-[#4784F8] leading-[normal]" style={{ fontWeight: 700 }}>12:30pm</p>
        <div className="flex items-center justify-end h-[15px] w-[29px] p-[2px] rounded-[20px] bg-[#4784F8] shrink-0">
          <div className="size-[11px] rounded-full bg-white" />
        </div>
      </div>
      <div className="absolute left-[15px] right-[15px] top-[44px] h-px bg-[#EEEEEE]" />
      {wheels.map(({ centre, values }) =>
        values.map((value, index) => (
          <div key={value} className={`absolute flex items-center justify-center w-[42px] h-[20px] rounded-[7px] ${index === 3 ? "bg-[#F2F2F2]" : ""}`} style={{ left: centre - 21, top: rowCentres[index] - 10 }}>
            <p className="font-['Lato:Bold',sans-serif] text-[8.5px] leading-[normal]" style={{ fontWeight: 700, color: rowColours[index] }}>{value}</p>
          </div>
        ))
      )}
    </div>
  );
}

// Info page image: three active lists as the Lists tab shows them (to do, started, complete), the complete one with its
// "Clears tonight" text, in the same 216px frame (John, 2026-10-26).
function TidyFinishedListsImage() {
  const lists = [
    { title: "Workout routine", detail: "0 of 2", colour: "#939393" },
    { title: "Weekend trip packing", detail: "2 of 7", colour: "#60C1E7" },
    { title: "New apartment to-do", detail: "6 of 6. Clears tonight", colour: "#8168D5" },
  ];
  return (
    <div className="relative shrink-0 w-[216px] overflow-hidden rounded-[11px] p-[15px] flex flex-col gap-[14px] bg-white" style={{ boxShadow: "inset 0 0 0 1px #D9D9D9" }} role="img" aria-label="Active lists, one complete and clearing tonight">
      {lists.map(({ title, detail, colour }) => (
        <div key={title} className="flex items-start gap-[9px] w-full">
          <svg width="14" height="14" viewBox="0 0 25 25" fill="none" className="shrink-0 mt-[1px]">
            <path d="M12.5 0C19.4036 0 25 5.59644 25 12.5C25 19.4036 19.4036 25 12.5 25C5.59644 25 0 19.4036 0 12.5C0 5.59644 5.59644 0 12.5 0ZM12.5 2C6.70101 2 2 6.70101 2 12.5C2 18.299 6.70101 23 12.5 23C18.299 23 23 18.299 23 12.5C23 6.70101 18.299 2 12.5 2Z" fill={colour} />
          </svg>
          <div className="flex flex-col gap-[5px] flex-1 min-w-0">
            <p className="font-['Lato:Bold',sans-serif] text-[9.5px] text-[#1C2C42] leading-[normal] whitespace-nowrap" style={{ fontWeight: 700 }}>{title}</p>
            <p className="font-['Lato',sans-serif] font-bold text-[7.5px] text-[#BABABA] leading-[normal] whitespace-nowrap">{detail}</p>
          </div>
          <svg width="12" height="3" viewBox="0 0 12 3" fill="none" className="shrink-0 mt-[6px]">
            <circle cx="1.5" cy="1.5" r="1.25" fill="#BABABA" />
            <circle cx="6" cy="1.5" r="1.25" fill="#BABABA" />
            <circle cx="10.5" cy="1.5" r="1.25" fill="#BABABA" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// Images shown on info pages between the title and the text, by info header. 40px from the title, 30px to the text.
const INFO_PAGE_IMAGES: Record<string, () => ReactNode> = { "Quick date buttons": QuickDateButtonsImage, "Natural Language Capture": InteractionsImage, "1 minute time steps": OneMinuteTimeStepsImage, "Tidy finished lists": TidyFinishedListsImage };

function InfoPage({ header, title, onBack }: { header: string; title: string; onBack: () => void }) {
  const Image = INFO_PAGE_IMAGES[header];
  const text = <p className="font-['Lato:Medium',sans-serif] text-[17px] text-[#BABABA] text-center whitespace-pre-wrap" style={{ lineHeight: '24px' }}>{title}</p>;
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center relative w-full">
      <div className="flex items-center justify-center gap-[10px] shrink-0 w-full">
        <span className="relative top-[1px] flex shrink-0"><InfoIcon color="#1C2C42" /></span>
        <p className="font-['Lato:Bold',sans-serif] text-[20px] text-[#1C2C42] leading-[normal] text-center whitespace-pre-wrap" style={{ fontWeight: 700 }}>
          {header}
        </p>
      </div>
      {Image ? (
        <div className="flex flex-col gap-[30px] items-center w-full">
          <Image />
          {text}
        </div>
      ) : text}
      <button type="button" onClick={onBack} className="bg-[#4784f8] h-[50px] w-full rounded-[100px] cursor-pointer flex items-center justify-center shrink-0 border-none">
        <p className="font-['Lato:Bold',sans-serif] text-[17px] text-white leading-[normal]" style={{ fontWeight: 700 }}>Back</p>
      </button>
    </div>
  );
}

// Sub-page titles that differ from their row label, shortened to fit on one line (John, 2026-10-24)
const SUB_PAGE_TITLES: Record<string, string> = { 'Natural Language Capture': 'Natural Lang. Capture', 'Feedback sent': 'Feedback' };

// Overlay standard: 40px from title to content, 30px between rows. The title stays put; content scrolls when it does not fit.
// Every sub-page keeps the main page's height, so each panel stays one size (John, 2026-10-26).
// Info icons are hidden on sub-pages for now; their infoTitle copy is kept so they can come back.
// Support pages sit 30px under the title, not 40px (John, 2026-10-23).
function PanelShell({ title, subPage, subVersion, subUpdated, subTitleGap = 40, onBack, subContent, children }: { title: string; subPage: string | null; subVersion?: string; subUpdated?: string; subTitleGap?: number; onBack: () => void; subContent?: ReactNode; children: ReactNode }) {
  const content = subPage ? subContent && <ShowInfoIconsContext.Provider value={false}>{subContent}</ShowInfoIconsContext.Provider> : children;
  const rootRef = useRef<HTMLDivElement>(null);
  // The main page's height, measured while it shows; sub-pages take it. It is the card's own height for the main page's
  // content (or the screen's limit on it), never a sub-page's, so it does not depend on what a sub-page shows.
  const [mainHeight, setMainHeight] = useState<number | null>(null);
  const [info, setInfo] = useState<{ header: string; title: string } | null>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (subPage === null && info === null && root) setMainHeight(root.offsetHeight);
  });
  if (info) return <InfoPage header={info.header} title={info.title} onBack={() => setInfo(null)} />;
  return (
    <InfoPageContext.Provider value={(header, text) => setInfo({ header, title: text })}>
      {/* grow: fills a fixed-height card (narrow screens), so the footer is measured from the card's edge, not the content's */}
      <div ref={rootRef} className="content-stretch flex flex-col grow items-start relative w-full min-h-0" style={{ gap: subPage ? subTitleGap : 40, ...(subPage && mainHeight ? { height: mainHeight } : {}) }}>
        <PanelHeader title={subPage ? (SUB_PAGE_TITLES[subPage] ?? subPage) : title} version={subPage ? subVersion : undefined} updated={subPage ? subUpdated : undefined} onBack={subPage ? onBack : undefined} />
        {/* Keyed by page so each page measures its own overflow from scratch */}
        {content && <ScrollArea key={subPage ?? ""}>{content}</ScrollArea>}
      </div>
    </InfoPageContext.Provider>
  );
}

export type NlcPrefs = { on: boolean; date: boolean; time: boolean; repeats: boolean; autoParsing: boolean };

// Natural Language Capture sub-page: the on/off, a key line, then the recognise options, always listed and inactive
// (#D9D9D9, not tappable) while NLC is off, keeping their saved choices; repeats only while repeat reminders are available.
// Toggles first, then the Interactions and Examples click-throughs, inactive while NLC is off.
function NlcSettings({ prefs, onChange, repeatsAvailable, onOpenInteractions, onOpenExamples }: { prefs: NlcPrefs; onChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean; onOpenInteractions: () => void; onOpenExamples: () => void }) {
  return (
    <>
      <ToggleRow label="Natural Language Capture" isOn={prefs.on} onToggle={() => onChange('on', !prefs.on)} infoTitle="Picks out dates, times and repeats as you type a reminder, such as 'tomorrow at 3pm'." />
      <KeyLine />
      <ToggleRow label="Recognise dates" isOn={prefs.date} disabled={!prefs.on} onToggle={() => onChange('date', !prefs.date)} infoTitle="Recognises dates such as 'tomorrow' or 'next Friday'." />
      <ToggleRow label="Recognise times" isOn={prefs.time} disabled={!prefs.on} onToggle={() => onChange('time', !prefs.time)} infoTitle="Recognises times such as 'at 3pm' or 'in the morning'." />
      {repeatsAvailable && <ToggleRow label="Recognise repeats" isOn={prefs.repeats} disabled={!prefs.on} onToggle={() => onChange('repeats', !prefs.repeats)} infoTitle="Recognises repeats such as 'every Monday' or 'daily'." />}
      <MenuRow label="Interactions" disabled={!prefs.on} onClick={onOpenInteractions} infoTitle="Choose whether recognised dates, times and repeats are applied as you type, or when you tap them." />
      <MenuRow label="Examples" disabled={!prefs.on} onClick={onOpenExamples} infoTitle="See a few example reminders, with the words Reminderly picks up shown in blue." />
    </>
  );
}

// Natural Language Capture > Interactions: the mode as two linked rows, one always on (both read and flip the one
// auto-parsing setting), each grouped with its description underneath, left aligned (no key line). 16px within a
// group; the page's usual 30px between groups.
function NlcInteractionsSettings({ prefs, onChange }: { prefs: NlcPrefs; onChange: (key: keyof NlcPrefs, value: boolean) => void }) {
  const descriptionClassName = "font-['Lato:Medium',sans-serif] leading-[23px] text-[17px] text-left w-full";
  return (
    <>
      <InteractionsImage />
      <div className="flex flex-col gap-[16px] w-full">
        <ToggleRow label="Auto-fill as you type" isOn={prefs.autoParsing} onToggle={() => onChange('autoParsing', !prefs.autoParsing)} infoTitle="Recognised dates, times and repeats are applied as you type." />
        <p className={descriptionClassName} style={{ color: '#939393' }}>Applies recognised dates, times and repeats as you type.</p>
      </div>
      <div className="flex flex-col gap-[16px] w-full">
        <ToggleRow label="Tap highlighted words" isOn={!prefs.autoParsing} onToggle={() => onChange('autoParsing', !prefs.autoParsing)} infoTitle="Recognised words are highlighted; tap one to apply its date, time or repeat." />
        <p className={descriptionClassName} style={{ color: '#939393' }}>Lets you choose which ones to apply by tapping on the highlighted text.</p>
      </div>
    </>
  );
}

// Natural Language Capture > Examples: a few example reminders (John, 2026-10-28), each grouped with what it shows underneath,
// laid out like Interactions. The blue words come from parseTokens, so they always match what is recognised.
// Repeat examples only while repeat reminders are available.
const NLC_EXAMPLES: { text: string; note: string; repeats?: boolean }[] = [
  { text: 'Call mum tomorrow at 3pm', note: "Just add when, the way you'd say it." },
  { text: 'Dentist next Friday at 10:30am', note: 'Days of the week and exact times work too.' },
  { text: 'Put the bins out every Tuesday evening', note: "Use 'every' to make it repeat. Evening means 6pm.", repeats: true },
  { text: 'Gym Mon, Wed, Fri at 7am', note: 'Pick a few days, with commas in between.', repeats: true },
  { text: 'Take the bread out in 20 minutes', note: 'Handy for a quick nudge later on.' },
  { text: 'Pay rent on 1/12', note: "Numbers work for dates, with 'on' or 'by' in front." },
  { text: 'Renew passport Wed 4th Nov', note: 'Or write the date out, with or without the day.' },
];

function NlcExampleText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const token of parseTokens(text)) {
    if (token.start > at) parts.push(text.slice(at, token.start));
    parts.push(<span key={token.start} className="text-[#4784F8]">{text.slice(token.start, token.end)}</span>);
    at = token.end;
  }
  if (at < text.length) parts.push(text.slice(at));
  return <p className="font-['Lato:Bold',sans-serif] leading-[23px] text-[17px] text-left w-full text-[#1C2C42]" style={{ fontWeight: 700 }}>{parts}</p>;
}

function NlcExamplesPage({ repeatsAvailable }: { repeatsAvailable: boolean }) {
  const descriptionClassName = "font-['Lato:Medium',sans-serif] leading-[23px] text-[17px] text-left w-full";
  return (
    <>
      <p className={descriptionClassName} style={{ color: '#939393' }}>Here are a few ideas to get you started. There are lots of other ways to say it too. Anything in blue is picked up for you.</p>
      {NLC_EXAMPLES.filter((example) => repeatsAvailable || !example.repeats).map((example) => (
        <div key={example.text} className="flex flex-col gap-[16px] w-full">
          <NlcExampleText text={example.text} />
          <p className={descriptionClassName} style={{ color: '#939393' }}>{example.note}</p>
        </div>
      ))}
    </>
  );
}

// Haptic feedback group (Sounds and haptics sub-page): the panel's own on/off plus its groups, always listed (template groups only while templates are available).
// Hidden groups keep their saved choices and play no part in the on/off below.
// Off turns every group off; back on restores the previous choices (all on if none were on).
// While off, the groups are inactive (#D9D9D9, not tappable), as with Notifications sound; on but a group off keeps the usual grey.
function HapticSettings({ panel, templatesAvailable = false }: { panel: HapticPanel; templatesAvailable?: boolean }) {
  const [config, setConfig] = useState<HapticsConfig>(getHapticsConfig);
  const groups = HAPTIC_GROUPS[panel].filter((group) => templatesAvailable || !group.templates);
  const masterKey = panelMasterKey(panel);
  const panelActions = groups.flatMap((group) => group.actions);
  const update = (next: HapticsConfig) => {
    setConfig(next);
    setHapticsConfig(next);
  };
  const setMaster = (on: boolean) => {
    const next = { ...config, [masterKey]: on };
    if (on && !panelActions.some((action) => config[action])) {
      for (const action of panelActions) next[action] = true;
    }
    update(next);
  };
  const groupOn = (actions: HapticAction[]) => config[masterKey] && actions.some((action) => config[action]);
  const setGroup = (actions: HapticAction[], on: boolean) => {
    const next = { ...config };
    if (!config[masterKey]) for (const action of panelActions) next[action] = false;
    for (const action of actions) next[action] = on;
    next[masterKey] = panelActions.some((action) => next[action]);
    update(next);
  };
  return (
    <>
      <ToggleRow label="Haptic feedback" isOn={config[masterKey]} onToggle={() => setMaster(!config[masterKey])} infoTitle="Turns every vibration below off in one go. Turning it back on restores your previous choices." />
      {groups.map(({ label, info, actions }) => (
        <ToggleRow key={label} label={label} isOn={groupOn(actions)} disabled={!config[masterKey]} onToggle={() => setGroup(actions, !groupOn(actions))} infoTitle={info} />
      ))}
    </>
  );
}

// Sounds group (Sounds and haptics sub-page): same behaviour as Haptic feedback, with its own saved choices.
function SoundSettings({ panel, templatesAvailable = false }: { panel: HapticPanel; templatesAvailable?: boolean }) {
  const [config, setConfig] = useState<SoundsConfig>(getSoundsConfig);
  const groups = SOUND_GROUPS[panel].filter((group) => templatesAvailable || !group.templates);
  const masterKey = soundsMasterKey(panel);
  const panelActions = groups.flatMap((group) => group.actions);
  const update = (next: SoundsConfig) => {
    setConfig(next);
    setSoundsConfig(next);
  };
  const setMaster = (on: boolean) => {
    const next = { ...config, [masterKey]: on };
    if (on && !panelActions.some((action) => config[action])) {
      for (const action of panelActions) next[action] = true;
    }
    update(next);
  };
  const groupOn = (actions: HapticAction[]) => config[masterKey] && actions.some((action) => config[action]);
  const setGroup = (actions: HapticAction[], on: boolean) => {
    const next = { ...config };
    if (!config[masterKey]) for (const action of panelActions) next[action] = false;
    for (const action of actions) next[action] = on;
    next[masterKey] = panelActions.some((action) => next[action]);
    update(next);
  };
  return (
    <>
      <ToggleRow label="Sounds" isOn={config[masterKey]} onToggle={() => setMaster(!config[masterKey])} infoTitle="Turns every click below off in one go. Turning it back on restores your previous choices." />
      {groups.map(({ label, info, actions }) => (
        <ToggleRow key={label} label={label} isOn={groupOn(actions)} disabled={!config[masterKey]} onToggle={() => setGroup(actions, !groupOn(actions))} infoTitle={info} />
      ))}
    </>
  );
}

// Sounds and haptics sub-page: the Sounds group then the Haptic feedback group, each led by its own on/off with no key line
// under it, and a key line between the two groups. Each group shows only while its feature is available. Rows scroll when they do not fit.
function SoundsAndHapticsSettings({ panel, templatesAvailable = false, soundsAvailable, hapticsAvailable }: { panel: HapticPanel; templatesAvailable?: boolean; soundsAvailable: boolean; hapticsAvailable: boolean }) {
  return (
    <>
      {soundsAvailable && <SoundSettings panel={panel} templatesAvailable={templatesAvailable} />}
      {soundsAvailable && hapticsAvailable && <KeyLine />}
      {hapticsAvailable && <HapticSettings panel={panel} templatesAvailable={templatesAvailable} />}
    </>
  );
}

// Last row in both settings overlays. Uses the MenuRow chevron (same size, colour and 15px right inset), rotated to point up.
export type NotifPrefs = { alerts: boolean; sound: boolean; badge: boolean; includeToday: boolean };

// Notifications sub-page (docs/plans/notifications-phase-4.md, section 2). Alerts and badge groups are split by a key line. Sound is inactive while alerts are off,
// include today while the badge is off; their saved choices are kept. Permission never changes a preference: when iOS has denied it,
// a row at the top opens Reminderly's page in iOS Settings. App re-checks permission on return to the foreground.
function NotificationSettings({ prefs, isDenied, onChange }: { prefs: NotifPrefs; isDenied: boolean; onChange: (key: keyof NotifPrefs, value: boolean) => void }) {
  return (
    <>
      {isDenied && <MenuRow label="Allow in iOS Settings" onClick={() => { window.location.href = "app-settings:"; }} infoTitle="Notifications are turned off for Reminderly in iOS Settings. Open Settings to allow them. Your choices below are kept." />}
      <ToggleRow label="Notifications" isOn={prefs.alerts} onToggle={() => onChange("alerts", !prefs.alerts)} infoTitle="Notifies you when a reminder with a time is due." />
      <ToggleRow label="Alert sound" isOn={prefs.sound} disabled={!prefs.alerts} onToggle={() => onChange("sound", !prefs.sound)} infoTitle="Plays your iPhone's alert sound with each reminder alert. You can change the sound in iOS Settings, Sounds & Haptics." />
      <KeyLine />
      <ToggleRow label="Show app icon badge" isOn={prefs.badge} onToggle={() => onChange("badge", !prefs.badge)} infoTitle="Shows the number of overdue reminders on the Reminderly app icon." />
      <ToggleRow label="Include due today" isOn={prefs.includeToday} disabled={!prefs.badge} onToggle={() => onChange("includeToday", !prefs.includeToday)} infoTitle="Also counts reminders due today in the app icon badge." />
    </>
  );
}

function TutorialRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[30px] items-center justify-between w-full pr-[15px] m-0 border-none bg-transparent text-left cursor-pointer"
    >
      <p className="font-['Lato:Bold',sans-serif] leading-[normal] text-[17px] text-[#1C2C42] whitespace-nowrap">{label}</p>
      <svg width="7" height="13" viewBox="0 0 7 13" fill="none" className="shrink-0 -rotate-90" aria-hidden="true">
        <path d="M1.92753 0.349745C1.50716 -0.116582 0.82549 -0.116582 0.405113 0.349745C-0.0151913 0.816064 -0.0152062 1.57198 0.405113 2.03828L4.38238 6.45L0.315234 10.9617C-0.10508 11.428 -0.105076 12.1839 0.315234 12.6503C0.735611 13.1166 1.41728 13.1166 1.83766 12.6503L6.4969 7.48173C6.5635 7.43513 6.62678 7.37992 6.68481 7.31555C7.10508 6.84926 7.10505 6.09333 6.68481 5.62701L1.92753 0.349745Z" fill="#939393" />
      </svg>
    </button>
  );
}

const SIRI_INFO = "Lets you add reminders by voice with Siri and the Shortcuts app. When off, Reminderly does not add reminders from Siri.";

// The phrases registered in ios/App/App/AppShortcuts.swift; keep both in step.
export const SIRI_PHRASES = [
  "Add to Reminderly app",
];

// Siri shortcuts sub-page, laid out like Natural Language Capture: the on/off, a key line, then the phrase Siri recognises and how to go on,
// inactive (#D9D9D9) while Siri is off.
function SiriSettings({ siriOn, onSiriChange }: { siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  return (
    <>
      <ToggleRow label="Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />
      <KeyLine />
      <p className="font-['Lato:Medium',sans-serif] leading-[23px] text-[17px] text-left w-full" style={{ color: siriOn ? '#939393' : '#D9D9D9' }}>
        To add a reminder with Siri just say
      </p>
      {/* "Hey Siri..." runs straight into each registered phrase, which carries on in lower case */}
      {SIRI_PHRASES.map((phrase) => (
        <p key={phrase} className="font-['Lato:Bold',sans-serif] leading-[23px] text-[17px] text-left w-full" style={{ color: siriOn ? '#1C2C42' : '#D9D9D9' }}>
          {`\u201CHey Siri... ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}\u201D`}
        </p>
      ))}
      <p className="font-['Lato:Medium',sans-serif] leading-[23px] text-[17px] text-left w-full" style={{ color: siriOn ? '#939393' : '#D9D9D9' }}>
        Then when Siri replies, say your reminder.
      </p>
    </>
  );
}

// Support pages: FAQs differ per panel, with their own version; Privacy policy and Terms of use are shared by both panels.
// A paragraph is plain text or a run of text and links; "\n" breaks a line. Sections are 30px apart, with 15px inside.
type DocLink = { text: string; href: string };
type DocParagraph = string | (string | DocLink)[];
// logo: the NeatlyMade logo under the heading (Contact sections, John, 2026-10-25).
type DocSection = { heading?: string; logo?: boolean; paragraphs: DocParagraph[] };
// topButton: a Back to top button after the text, styled as the info pages' Back button; the header arrow goes back (John, 2026-10-23).
// FAQs use the same centred layout as the policy pages, all answers shown (John, after user testing, 2026-10-23).
// lastUpdated shows in the fixed header under the version line, not in the text.
type SupportDoc = { version: string; lastUpdated?: string; sections: DocSection[]; topButton?: boolean };

// Reminders FAQs Version 1.0 (John and Kai, 2026-10-23): each question is a section heading, its answer the paragraph.
// Recheck the NLC answer against the NLC release-readiness ticket (defaults and supported phrases) before release.
const REMINDERS_FAQS: SupportDoc = {
  version: "Version 1.0",
  lastUpdated: "Last updated: 23 October 2026",
  topButton: true,
  sections: [
    { heading: "How do I add a reminder?", paragraphs: [
      "Tap New reminder, type what you need to remember, then tap the tick. You can add a date, time or repeat if you need one.",
    ] },
    { heading: "Can I type dates and times naturally?", paragraphs: [
      "Yes. Type phrases like “tomorrow at 3pm” or “every Monday” and Reminderly picks out the date, time or repeat for you. You can choose what's recognised in Reminders settings > Natural Language Capture.",
    ] },
    { heading: "How do I edit or delete a reminder?", paragraphs: [
      "Tap the three dots next to it and choose Edit reminder to change its text, date, time or repeat. Choose Delete reminder to remove it.",
    ] },
    { heading: "What do the colours and filters mean?", paragraphs: [
      "Blue reminders are due today, pink this week, and orange later or with no date. Tap Today, This week or Later to show only those, and tap again to see everything.",
    ] },
    { heading: "What happens if I miss a reminder?", paragraphs: [
      "It turns red and stays at the top of every view until you deal with it. Tap its circle to mark it as done, or tap the three dots to move it to tomorrow.",
    ] },
    { heading: "Will I get a notification?", paragraphs: [
      "Reminders with a time notify you when they're due, once you allow notifications. Reminders with only a date, or no date, don't. Press and hold a notification to mark the reminder as done or move it to tomorrow.",
    ] },
    { heading: "What does the number on the app icon mean?", paragraphs: [
      "It shows how many reminders are overdue or due today. In Reminders settings > Notifications you can count overdue reminders only, or turn it off.",
    ] },
    { heading: "How do repeating reminders work?", paragraphs: [
      "Tap Repeats and choose days of the week, daily, weekly or monthly. When you mark one as done, the next is added, based on the date it was due rather than the day you completed it.",
    ] },
    { heading: "Can I add a reminder with Siri?", paragraphs: [
      "Yes. Say “Hey Siri, add to Reminderly app”, then say your reminder when Siri replies, such as “Call Mum tomorrow at 4pm”.",
    ] },
    { heading: "How do I complete a reminder, and where does it go?", paragraphs: [
      "Tap the circle next to a reminder to mark it as done. Tap the tick in the Reminderly logo to see done and deleted reminders, and tap a reminder's circle to restore it. Clear all permanently removes them.",
    ] },
    { heading: "Are my reminders synced or stored online?", paragraphs: [
      "No. Your reminders are stored locally on your iPhone, not on our servers. They aren't synced between devices, so deleting the app may permanently remove them.",
    ] },
    { heading: "Can I see my reminders on the Lock Screen?", paragraphs: [
      "Yes. Add the Reminderly widget to your Lock Screen. It shows how many reminders are due today or overdue, with a ring that fills as you complete them.",
    ] },
  ],
};
// Lists FAQs Version 1.0 (John and Kai, 2026-10-23).
const LISTS_FAQS: SupportDoc = {
  version: "Version 1.0",
  lastUpdated: "Last updated: 24 October 2026",
  topButton: true,
  sections: [
    { heading: "How do I create a list?", paragraphs: [
      "Tap New list, give it a name and add your items. Tap the tick or close the list to save it.",
    ] },
    { heading: "How do I tick off or remove an item?", paragraphs: [
      "Open the list and tap an item's circle to tick it off. Tap it again to untick it. Swipe an item to the left to delete it.",
    ] },
    { heading: "What do the colours and filters mean?", paragraphs: [
      "Grey lists haven't been started, blue lists are started and purple lists have every item ticked. Tap Todo, Started or Done to show only those, and tap again to see everything.",
    ] },
    { heading: "How do I edit, rename or delete a list?", paragraphs: [
      "Tap the three dots next to a list. Choose Edit list to change its name or items, or Delete list to remove it.",
    ] },
    { heading: "How do I mark a whole list as done?", paragraphs: [
      "Tap the circle next to the list. Every item is ticked and the list moves to your done lists. Any smart reminder for it is completed too.",
    ] },
    { heading: "Can completed lists move to Done automatically?", paragraphs: [
      "Yes. Turn on Tidy finished lists in Lists settings. At midnight, any list with every item ticked moves to Done. Pinned lists stay where they are.",
    ] },
    { heading: "Can I keep a list at the top?", paragraphs: [
      "Yes. Tap the three dots and choose Pin to top. Pinned lists stay at the top and aren't moved to Done automatically.",
    ] },
    { heading: "What are list templates?", paragraphs: [
      "Templates are lists you use again and again, like a weekly shop or a packing list. Tap the blue templates button next to the filters, with the two overlapping squares, to create one. Then choose Use template to start a fresh copy with every item unticked.",
    ] },
    { heading: "What is a smart reminder?", paragraphs: [
      "A reminder linked to a list. Tap the three dots, choose Set smart reminder and pick a due date. It appears in Reminders and shows how many items you've ticked. It's completed automatically when the list is done.",
    ] },
    { heading: "Can items be sorted A to Z?", paragraphs: [
      "Yes. Turn on Sort items A to Z in Lists settings. When it's off, the newest items are at the top.",
    ] },
    { heading: "Where do done and deleted lists go?", paragraphs: [
      "Tap the tick in the Reminderly logo to see them. Tap a list's circle to restore it: done lists come back with every item unticked, ready to use again. Clear all permanently removes all done and deleted lists and deleted templates.",
    ] },
    { heading: "Are my lists synced or stored online?", paragraphs: [
      "No. Your lists are stored locally on your iPhone, not on our servers. They aren't synced between devices, so deleting the app may permanently remove them.",
    ] },
  ],
};

// Terms of use Version 1.0 (John, 2026-10-23). Approved in principle only: needs legal sign-off before release
// (docs/release-readiness.md, Privacy and legal).
const TERMS_OF_USE: SupportDoc = {
  version: "Version 1.0",
  lastUpdated: "Last updated: 23 October 2026",
  topButton: true,
  sections: [
    { paragraphs: [
      "Reminderly is developed and operated by NeatlyMade Ltd., a company registered in the United Kingdom.",
      "By using Reminderly, you agree to these Terms of Use.",
    ] },
    { heading: "Using Reminderly", paragraphs: [
      "Reminderly helps you organise reminders, lists and everyday tasks. You may use the app for personal or lawful purposes in accordance with Apple's App Store terms.",
      "No account or registration is required.",
    ] },
    { heading: "Reminders and notifications", paragraphs: [
      "We aim to make Reminderly reliable, but cannot guarantee that reminders or notifications will always be delivered on time.",
      "Notifications may be affected by device settings, permissions, operating system behaviour or technical issues.",
      "Please do not rely on Reminderly as your sole means of remembering critical, medical, safety-related or time-sensitive obligations.",
    ] },
    { heading: "Your content and data", paragraphs: [
      "Your reminders, lists and attachments belong to you and are stored locally on your device.",
      "You are responsible for maintaining appropriate backups of important information. We cannot guarantee recovery of information lost through device failure, deletion or other technical issues.",
      "For details about how we handle information, please see our Privacy Policy.",
    ] },
    { heading: "Acceptable use", paragraphs: [
      "You agree not to misuse Reminderly, interfere with its operation or use it for unlawful purposes.",
    ] },
    { heading: "Ownership", paragraphs: [
      "Reminderly, including its design, software, branding and associated intellectual property, belongs to NeatlyMade Ltd. or its licensors.",
      "You are granted permission to use the app in accordance with these terms and Apple's applicable licence agreement.",
    ] },
    { heading: "Availability and liability", paragraphs: [
      "We may update, improve or discontinue features of Reminderly.",
      "While we take reasonable care to provide a reliable app, we cannot guarantee uninterrupted or error-free operation.",
      "To the extent permitted by law, NeatlyMade Ltd. is not responsible for losses arising from missed reminders, delayed notifications or unavailable features.",
      "Nothing in these terms excludes or limits liability where doing so would be unlawful, or affects your statutory consumer rights.",
    ] },
    { heading: "Changes to these terms", paragraphs: [
      "We may update these terms from time to time. The latest version will be available in the app and on our website.",
    ] },
    { heading: "Governing law", paragraphs: [
      "These terms are governed by the laws of England and Wales, subject to any mandatory consumer protections that apply where you live.",
    ] },
    { heading: "Contact", logo: true, paragraphs: [
      ["NeatlyMade Ltd.\nWebsite: ", { text: "neatlymade.co", href: "https://neatlymade.co" }, "\nEmail: ", { text: "info@neatlymade.co", href: "mailto:info@neatlymade.co" }],
    ] },
  ],
};

// Privacy policy Version 1.0 (John and Kai, 2026-10-23)
const PRIVACY_POLICY: SupportDoc = {
  version: "Version 1.0",
  lastUpdated: "Last updated: 23 October 2026",
  topButton: true,
  sections: [
    { paragraphs: [
      "Reminderly is developed and operated by NeatlyMade Ltd., a company registered in the United Kingdom.",
      "We believe your reminders are your business. This policy explains how we handle your information.",
    ] },
    { heading: "Your information", paragraphs: [
      "Reminderly does not require an account or registration and does not collect personally identifiable information (PII) through the app.",
      "Your reminders, lists, preferences and attachments are stored locally on your device, not on our servers.",
      "If you contact us by email, we use the personal information you voluntarily provide only to respond to your enquiry.",
    ] },
    { heading: "Permissions", paragraphs: [
      "Reminderly may request access to notifications, photos or your camera to provide features you choose to use. You can manage these permissions in your device settings.",
    ] },
    { heading: "Sharing and security", paragraphs: [
      "We do not sell your personal information or share your reminder content with advertisers or other third parties.",
      "Information stored on your device is protected by your device's security features. Information you send us is handled with appropriate safeguards.",
    ] },
    { heading: "Retention and deletion", paragraphs: [
      "Your reminders, lists and attachments remain on your device until you delete them or remove the app and its local data.",
      "Support correspondence is retained only as long as reasonably necessary to handle your enquiry and meet any legal obligations.",
    ] },
    { heading: "Your rights", paragraphs: [
      "Under UK data protection law, you may have rights to access, correct, delete or restrict the use of personal information we hold about you, or object to its processing.",
      "You can withdraw optional device permissions at any time through your device settings.",
      ["To exercise your rights, contact us using the details below. You may also complain to the UK Information Commissioner's Office at ", { text: "www.ico.org.uk", href: "https://www.ico.org.uk" }, "."],
    ] },
    { heading: "Changes to this policy", paragraphs: [
      "We may update this policy when Reminderly changes. The latest version will be available in the app and on our website.",
    ] },
    { heading: "Contact", logo: true, paragraphs: [
      ["NeatlyMade Ltd.\nWebsite: ", { text: "neatlymade.co", href: "https://neatlymade.co" }, "\nEmail: ", { text: "info@neatlymade.co", href: "mailto:info@neatlymade.co" }],
    ] },
  ],
};

// The pages opened from Support; Back from these returns to Support
const SUPPORT_DOC_PAGES = ["FAQs", "Privacy policy", "Terms of use", "Feedback"];

function supportDocFor(page: string | null, faqs: SupportDoc): SupportDoc | null {
  if (page === "FAQs") return faqs;
  if (page === "Privacy policy") return PRIVACY_POLICY;
  if (page === "Terms of use") return TERMS_OF_USE;
  return null;
}

// Support sub-page: FAQs and the panel's tutorial (John, 2026-10-23), a key line, then the legal pages.
// Feedback follows under its own key line while Dev tools > System > Collect feedback is on (John, 2026-10-26).
function SupportSettings({ onOpen, tutorialLabel, onOpenTutorial, feedbackAvailable = false }: { onOpen: (page: string) => void; tutorialLabel: string; onOpenTutorial?: () => void; feedbackAvailable?: boolean }) {
  return (
    <>
      <MenuRow label="FAQs" onClick={() => onOpen("FAQs")} />
      {onOpenTutorial && <TutorialRow label={tutorialLabel} onClick={onOpenTutorial} />}
      <KeyLine />
      <MenuRow label="Privacy policy" onClick={() => onOpen("Privacy policy")} />
      <MenuRow label="Terms of use" onClick={() => onOpen("Terms of use")} />
      {feedbackAvailable && (
        <>
          <KeyLine />
          <MenuRow label="Feedback" onClick={() => onOpen("Feedback")} />
        </>
      )}
    </>
  );
}

// Feedback faces, saddest to happiest, as supplied by John (2026-10-26): mouth paths only; the circle and eyes are shared.
const FEEDBACK_MOUTHS = [
  "M15.3984 30.9991C19.5114 24.9992 25.5437 25.1386 29.2598 30.9991",
  "M15.3984 28.8368C20.6009 25.8346 24.0509 25.8667 29.2598 28.8368",
  "M15.404 27.137L29.2654 27.137",
  "M15.4062 26.6797C19.3096 29.7356 25.4426 29.434 29.2676 26.6797",
  "M15.3984 26.6797C18.0946 32.6281 26.2008 32.5148 29.2598 26.6797",
];

// Inactive grey #ECECEC, active Reminderly later #FDB146; eyes and mouth dark blue.
function FeedbackFace({ index, isActive, onSelect }: { index: number; isActive: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={isActive} aria-label={`Rating ${index + 1} of 5`} className="block shrink-0 p-0 bg-transparent border-none cursor-pointer">
      <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
        <rect width="44.6645" height="44.6645" rx="22.3322" fill={isActive ? "#FDB146" : "#ECECEC"} />
        <rect x="11.9141" y="16.1714" width="5.85259" height="5.85259" rx="2.92629" fill="#1C2C42" />
        <rect x="26.8984" y="16.1714" width="5.85259" height="5.85259" rx="2.92629" fill="#1C2C42" />
        <path d={FEEDBACK_MOUTHS[index]} stroke="#1C2C42" strokeWidth="2.46425" strokeLinecap="round" />
      </svg>
    </button>
  );
}

const FEEDBACK_SECTIONS = [
  { title: "Look and feel", subtitle: "How polished is Reminderly?" },
  { title: "Ease of use", subtitle: "How easy is it to do the things you need to do?" },
  { title: "Getting started", subtitle: "How easy was it to start using the app?" },
  { title: "Features", subtitle: "Does Reminderly do all the things you need?" },
];

// Feedback page (stage 2, John's design 2026-10-26): four rated sections, a text box and Send feedback. One face per row
// can be active; tapping the active face clears it. Not connected: Send feedback opens the confirmation and nothing is sent or saved, so the page starts empty each time.
// Gaps: title to subtitle 14px, subtitle to faces 16px, 30px between sections, to the text box and to the button.
// The outer faces sit 5px in from each edge.
function FeedbackPage({ onSend }: { onSend: () => void }) {
  const [ratings, setRatings] = useState<(number | null)[]>(() => FEEDBACK_SECTIONS.map(() => null));
  return (
    <div className="flex flex-col gap-[30px] w-full">
      {FEEDBACK_SECTIONS.map((section, sectionIndex) => (
        <div key={section.title} className="flex flex-col w-full">
          <p className="font-['Lato:Bold',sans-serif] text-[17px] text-[#1C2C42] leading-[normal]" style={{ fontWeight: 700 }}>{section.title}</p>
          <p className="font-['Lato:Medium',sans-serif] text-[14px] text-[#BABABA] leading-[normal] mt-[14px]">{section.subtitle}</p>
          <div className="flex items-center justify-between px-[5px] mt-[16px] w-full">
            {FEEDBACK_MOUTHS.map((_, faceIndex) => (
              <FeedbackFace key={faceIndex} index={faceIndex} isActive={ratings[sectionIndex] === faceIndex} onSelect={() => setRatings((current) => current.map((rating, i) => (i === sectionIndex ? (rating === faceIndex ? null : faceIndex) : rating)))} />
            ))}
          </div>
        </div>
      ))}
      <textarea placeholder="Tell us what you think..." className="block w-full h-[192px] resize-none rounded-[15px] bg-[#F7F7F7] p-[20px] border-none outline-none font-['Lato:Medium',sans-serif] text-[17px] text-[#1C2C42] leading-[24px] placeholder:text-[#BABABA]" />
      <button type="button" onClick={onSend} className="bg-[#4784f8] h-[50px] w-full rounded-[100px] cursor-pointer flex items-center justify-center shrink-0 border-none">
        <p className="font-['Lato:Bold',sans-serif] text-[17px] text-white leading-[normal]" style={{ fontWeight: 700 }}>Send feedback</p>
      </button>
    </div>
  );
}

// Feedback confirmation (John's design, 2026-10-26): speech bubble icon (John's SVG, medium grey), 20px, the message in
// medium grey, 40px, then Done, which closes the settings panel. 40px below the title.
function FeedbackSentPage({ onDone }: { onDone?: () => void }) {
  return (
    <div className="flex flex-col items-center w-full">
      <svg width="34" height="33" viewBox="0 0 34 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="block shrink-0">
        <path d="M32.7029 17.7486C32.27 24.4471 27.009 29.7827 20.4042 30.2218C18.151 30.3715 15.7984 30.3712 13.5497 30.2218C12.7753 30.1703 11.9313 29.9855 11.2044 29.6861C10.3956 29.353 9.99108 29.1864 9.78556 29.2117C9.58003 29.237 9.28182 29.4569 8.68541 29.8967C7.63384 30.6721 6.30908 31.229 4.34449 31.1812C3.35107 31.157 2.85436 31.1449 2.63199 30.7658C2.40962 30.3867 2.68657 29.8619 3.24047 28.8122C4.00867 27.3565 4.49541 25.6898 3.75788 24.3545C2.48766 22.4471 1.4087 20.1883 1.25104 17.7486C1.16632 16.4378 1.16632 15.0803 1.25104 13.7694C1.68394 7.07099 6.94495 1.73534 13.5497 1.29631C15.7984 1.14683 18.151 1.14652 20.4042 1.29631C27.009 1.73534 32.27 7.07099 32.7029 13.7694C32.7876 15.0803 32.7876 16.4378 32.7029 17.7486Z" stroke="#BABABA" strokeWidth="2.36842" strokeLinejoin="round" />
        <path d="M16.9728 16.1841H16.9869M23.2815 16.1841H23.2956M10.6641 16.1841H10.6782" stroke="#BABABA" strokeWidth="3.15789" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="font-['Lato:Medium',sans-serif] text-[17px] text-[#BABABA] leading-[normal] text-center mt-[20px]">Feedback received, thanks!</p>
      <button type="button" onClick={onDone} className="bg-[#4784f8] h-[50px] w-full rounded-[100px] cursor-pointer flex items-center justify-center shrink-0 border-none mt-[40px]">
        <p className="font-['Lato:Bold',sans-serif] text-[17px] text-white leading-[normal]" style={{ fontWeight: 700 }}>Done</p>
      </button>
    </div>
  );
}

// A paragraph's text, with any links in Reminderly blue.
function renderParagraph(paragraph: DocParagraph) {
  return typeof paragraph === "string" ? paragraph : paragraph.map((part, partIndex) => typeof part === "string" ? part : (
    <a key={partIndex} href={part.href} className="text-[#4784F8] no-underline">{part.text}</a>
  ));
}

// Back to top: the info page's Back button style, 40px below the text; scrolls the page's text back to the top.
function DocTopButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <button ref={buttonRef} type="button" onClick={() => buttonRef.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" })} className="bg-[#4784f8] h-[50px] w-full rounded-[100px] cursor-pointer flex items-center justify-center shrink-0 border-none mt-[10px]">
      <p className="font-['Lato:Bold',sans-serif] text-[17px] text-white leading-[normal]" style={{ fontWeight: 700 }}>Back to top</p>
    </button>
  );
}

// NeatlyMade logo as supplied by John (165 x 32), shown 140px wide with height in proportion (2026-10-25).
function NeatlyMadeLogo() {
  return (
    <svg className="block mx-auto shrink-0" width="140" height={(140 * 32) / 165} viewBox="0 0 165 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NeatlyMade">
      <path d="M2.96828 26.2627C2.0095 26.2627 1.33966 25.6454 1.33966 24.5421V13.4571C1.33966 12.4457 1.93069 11.8022 2.90261 11.8022C3.86139 11.8022 4.51808 12.4457 4.51808 13.4571V14.429H4.58375C5.33239 12.7741 6.77713 11.8153 8.91796 11.8153C11.9913 11.8153 13.7381 13.7854 13.7381 17.0032V24.5421C13.7381 25.6454 13.0683 26.2627 12.1095 26.2627C11.1507 26.2627 10.4678 25.6454 10.4678 24.5421V17.6599C10.4678 15.6898 9.54839 14.5866 7.68337 14.5866C5.80521 14.5866 4.61002 15.9394 4.61002 17.9357V24.5421C4.61002 25.6454 3.92706 26.2627 2.96828 26.2627ZM22.551 26.2758C18.2956 26.2758 15.787 23.6096 15.787 19.0915C15.787 14.6523 18.3481 11.7891 22.3671 11.7891C26.176 11.7891 28.7765 14.4946 28.7765 18.2772C28.7765 19.2491 28.2249 19.827 27.253 19.827H19.0442V19.9321C19.0442 22.2568 20.397 23.7541 22.5247 23.7541C23.9958 23.7541 24.9545 23.2419 26.0052 21.9022C26.3467 21.5213 26.6488 21.3768 27.1085 21.3768C27.844 21.3768 28.4219 21.8497 28.4219 22.6377C28.4219 22.8873 28.3431 23.1762 28.1986 23.4651C27.2792 25.2382 25.2041 26.2758 22.551 26.2758ZM19.0705 17.6731H25.5718C25.5062 15.6504 24.219 14.3239 22.3803 14.3239C20.5415 14.3239 19.2019 15.6767 19.0705 17.6731ZM34.9757 26.2233C32.2833 26.2233 30.3263 24.529 30.3263 22.0204C30.3263 19.5512 32.2307 18.0671 35.6193 17.8569L39.31 17.6468V16.6486C39.31 15.1907 38.3249 14.3502 36.7094 14.3502C35.4354 14.3502 34.608 14.7836 33.7937 15.9788C33.4522 16.4253 33.0188 16.6355 32.4672 16.6355C31.666 16.6355 31.0881 16.1101 31.0881 15.3221C31.0881 15.02 31.1669 14.7311 31.3114 14.429C32.0206 12.8135 34.1746 11.7891 36.8408 11.7891C40.295 11.7891 42.5409 13.6147 42.5409 16.4122V24.6209C42.5409 25.6717 41.8711 26.2627 40.9517 26.2627C40.0586 26.2627 39.4413 25.7242 39.3888 24.7523V23.7804H39.3231C38.5219 25.2908 36.7751 26.2233 34.9757 26.2233ZM35.9739 23.7541C37.8127 23.7541 39.31 22.5195 39.31 20.8384V19.7745L36.079 19.9715C34.5029 20.0766 33.5967 20.7858 33.5967 21.8891C33.5967 23.0317 34.5555 23.7541 35.9739 23.7541ZM46.0871 22.5589V14.5997H45.2071C44.3928 14.5997 43.8937 14.1138 43.8937 13.3257C43.8937 12.5508 44.3928 12.078 45.2071 12.078H46.0871V10.2261C46.0871 9.17539 46.7175 8.51869 47.7288 8.51869C48.727 8.51869 49.3574 9.17539 49.3574 10.2261V12.078H50.8678C51.6821 12.078 52.1812 12.5508 52.1812 13.3257C52.1812 14.1138 51.6821 14.5997 50.8678 14.5997H49.3574V21.8497C49.3574 22.9004 49.7252 23.3601 50.6708 23.4389L50.9072 23.4651C51.7741 23.5439 52.2206 23.9117 52.2206 24.6735C52.2206 25.6322 51.3801 26.1445 49.8828 26.1445H49.7515C47.3217 26.1445 46.0871 24.9361 46.0871 22.5589ZM55.9507 26.2627C54.9919 26.2627 54.3089 25.6454 54.3089 24.5421V8.50556C54.3089 7.40231 54.9919 6.78501 55.9507 6.78501C56.9095 6.78501 57.5793 7.40231 57.5793 8.50556V24.5421C57.5793 25.6454 56.9095 26.2627 55.9507 26.2627ZM62.3601 31.1748C60.8891 31.1748 60.0879 30.6232 60.0879 29.625C60.0879 28.9551 60.5607 28.5217 61.3225 28.5217C61.5983 28.5217 61.7296 28.5349 62.0317 28.5349C62.7672 28.5349 63.529 28.154 64.0149 26.9325L64.2514 26.2495L59.6939 14.2582C59.5757 13.9299 59.51 13.5884 59.51 13.3257C59.51 12.4326 60.2324 11.8022 61.1911 11.8022C62.0186 11.8022 62.4783 12.1699 62.7541 13.0893L66.077 23.2156H66.1295L69.4524 13.0762C69.7282 12.1831 70.201 11.8022 71.0285 11.8022C71.961 11.8022 72.6177 12.4195 72.6177 13.2863C72.6177 13.549 72.552 13.9168 72.4338 14.232L67.8501 26.4991C66.5892 29.9665 65.1445 31.1748 62.3601 31.1748Z" fill="black" />
      <path d="M78.0386 26.2627C77.0535 26.2627 76.41 25.6322 76.41 24.5421V13.4702C76.41 12.4063 77.0535 11.8022 77.9729 11.8022C78.8923 11.8022 79.549 12.4063 79.549 13.4702V14.4946H79.6147C80.2188 12.8792 81.6898 11.8153 83.5811 11.8153C85.5512 11.8153 86.9565 12.8266 87.4688 14.6129H87.5476C88.2174 12.8923 89.8723 11.8153 91.8818 11.8153C94.6268 11.8153 96.4261 13.6672 96.4261 16.4516V24.5421C96.4261 25.6322 95.7694 26.2627 94.7975 26.2627C93.8125 26.2627 93.1558 25.6322 93.1558 24.5421V17.2528C93.1558 15.5454 92.2627 14.5735 90.6603 14.5735C89.0843 14.5735 88.0073 15.7292 88.0073 17.3973V24.5421C88.0073 25.6322 87.39 26.2627 86.4181 26.2627C85.433 26.2627 84.8288 25.6322 84.8288 24.5421V17.082C84.8288 15.5322 83.8832 14.5735 82.3597 14.5735C80.7836 14.5735 79.6803 15.7949 79.6803 17.4761V24.5421C79.6803 25.6322 79.0105 26.2627 78.0386 26.2627ZM103.138 26.2233C100.445 26.2233 98.4882 24.529 98.4882 22.0204C98.4882 19.5512 100.393 18.0671 103.781 17.8569L107.472 17.6468V16.6486C107.472 15.1907 106.487 14.3502 104.871 14.3502C103.597 14.3502 102.77 14.7836 101.956 15.9788C101.614 16.4253 101.181 16.6355 100.629 16.6355C99.8278 16.6355 99.2499 16.1101 99.2499 15.3221C99.2499 15.02 99.3287 14.7311 99.4732 14.429C100.182 12.8135 102.336 11.7891 105.003 11.7891C108.457 11.7891 110.703 13.6147 110.703 16.4122V24.6209C110.703 25.6717 110.033 26.2627 109.114 26.2627C108.22 26.2627 107.603 25.7242 107.551 24.7523V23.7804H107.485C106.684 25.2908 104.937 26.2233 103.138 26.2233ZM104.136 23.7541C105.975 23.7541 107.472 22.5195 107.472 20.8384V19.7745L104.241 19.9715C102.665 20.0766 101.759 20.7858 101.759 21.8891C101.759 23.0317 102.717 23.7541 104.136 23.7541ZM118.544 26.2233C115.037 26.2233 112.765 23.452 112.765 19.0259C112.765 14.626 115.037 11.8416 118.544 11.8416C120.54 11.8416 122.116 12.8792 122.852 14.4158H122.93V8.50556C122.93 7.40231 123.6 6.78501 124.559 6.78501C125.518 6.78501 126.201 7.40231 126.201 8.50556V24.6209C126.201 25.6717 125.531 26.2627 124.585 26.2627C123.64 26.2627 122.93 25.6848 122.93 24.6209V23.5308H122.865C122.195 25.1332 120.698 26.2233 118.544 26.2233ZM119.529 23.5439C121.591 23.5439 122.944 21.7971 122.944 19.039C122.944 16.3071 121.591 14.534 119.529 14.534C117.427 14.534 116.114 16.2809 116.114 19.039C116.114 21.8103 117.414 23.5439 119.529 23.5439ZM135.132 26.2758C130.877 26.2758 128.368 23.6096 128.368 19.0915C128.368 14.6523 130.929 11.7891 134.948 11.7891C138.757 11.7891 141.357 14.4946 141.357 18.2772C141.357 19.2491 140.806 19.827 139.834 19.827H131.625V19.9321C131.625 22.2568 132.978 23.7541 135.106 23.7541C136.577 23.7541 137.535 23.2419 138.586 21.9022C138.928 21.5213 139.23 21.3768 139.689 21.3768C140.425 21.3768 141.003 21.8497 141.003 22.6377C141.003 22.8873 140.924 23.1762 140.78 23.4651C139.86 25.2382 137.785 26.2758 135.132 26.2758ZM131.651 17.6731H138.153C138.087 15.6504 136.8 14.3239 134.961 14.3239C133.122 14.3239 131.783 15.6767 131.651 17.6731Z" fill="#A5A5A5" />
      <path d="M162.073 6.1871C159.769 4.77392 157.758 5.34341 156.55 6.25055C156.055 6.6225 155.807 6.80847 155.661 6.80847C155.516 6.80847 155.268 6.6225 154.773 6.25055C153.565 5.34341 151.554 4.77392 149.25 6.1871C146.227 8.04173 145.543 14.1602 152.517 19.3222C153.845 20.3054 154.509 20.797 155.661 20.797C156.814 20.797 157.478 20.3054 158.806 19.3222C165.78 14.1602 165.096 8.04173 162.073 6.1871Z" fill="#FF0000" />
    </svg>
  );
}

// A Support page's text: centred grey paragraphs under dark blue section headings, links in Reminderly blue.
// Links open outside the app (Safari or Mail): the web view hands off navigation away from the app. They open in the
// same window, as a new window (target _blank) is not handed off and does nothing.
function SupportDocPage({ doc }: { doc: SupportDoc }) {
  return (
    <div className="flex flex-col gap-[30px] w-full">
      {doc.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="flex flex-col gap-[15px] w-full">
          {section.heading && (
            <p className="font-['Lato:Bold',sans-serif] leading-[24px] text-[17px] text-[#1C2C42] text-center w-full" style={{ fontWeight: 700 }}>
              {section.heading}
            </p>
          )}
          {section.logo && <NeatlyMadeLogo />}
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="font-['Lato:Medium',sans-serif] leading-[24px] text-[17px] text-[#BABABA] text-center w-full whitespace-pre-line">
              {renderParagraph(paragraph)}
            </p>
          ))}
        </div>
      ))}
      {doc.topButton && <DocTopButton />}
    </div>
  );
}

// Support row, as both panels show it, with no key line above it (John, 2026-10-23). The row has no info icon.
function SupportRow({ onClick }: { onClick: () => void }) {
  return (
    <ShowInfoIconsContext.Provider value={false}>
      <MenuRow label="Support" onClick={onClick} />
    </ShowInfoIconsContext.Provider>
  );
}

const supportBack = (subPage: string | null) => (subPage && (SUPPORT_DOC_PAGES.includes(subPage) || subPage === "Feedback sent") ? "Support" : null);
const supportTitleGap = (subPage: string | null) => (subPage === "Support" || (subPage && SUPPORT_DOC_PAGES.includes(subPage)) ? 30 : 40);

export function RemindersSettingsContent({ onOpenTutorial, onClose, feedbackAvailable = false, notificationsAvailable, notifPrefs, notifPermissionDenied, onNotifChange, datePresetsAvailable, datePresetsOn, onDatePresetsChange, soundsAvailable, nlcAvailable, nlcPrefs, onNlcChange, repeatsAvailable, hapticsAvailable, oneMinuteAvailable, oneMinuteOn, onOneMinuteChange, siriAvailable, siriOn, onSiriChange }: { onOpenTutorial?: () => void; notificationsAvailable: boolean; notifPrefs: NotifPrefs; notifPermissionDenied: boolean; onNotifChange: (key: keyof NotifPrefs, value: boolean) => void; datePresetsAvailable: boolean; datePresetsOn: boolean; onDatePresetsChange: (value: boolean) => void; soundsAvailable: boolean; nlcAvailable: boolean; nlcPrefs: NlcPrefs; onNlcChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean; hapticsAvailable: boolean; oneMinuteAvailable: boolean; oneMinuteOn: boolean; onOneMinuteChange: (value: boolean) => void; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void; feedbackAvailable?: boolean; onClose?: () => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const supportDoc = supportDocFor(subPage, REMINDERS_FAQS);

  return (
    <PanelShell
      title="Reminders settings"
      subPage={subPage}
      subVersion={supportDoc?.version}
      subUpdated={supportDoc?.lastUpdated}
      subTitleGap={supportTitleGap(subPage)}
      onBack={() => setSubPage(subPage === "Interactions" || subPage === "Examples" ? "Natural Language Capture" : supportBack(subPage))}
      subContent={supportDoc ? <SupportDocPage doc={supportDoc} /> : subPage === "Support" ? <SupportSettings onOpen={setSubPage} tutorialLabel="Reminders tutorial" onOpenTutorial={onOpenTutorial} feedbackAvailable={feedbackAvailable} /> : subPage === "Feedback" ? <FeedbackPage onSend={() => setSubPage("Feedback sent")} /> : subPage === "Feedback sent" ? <FeedbackSentPage onDone={onClose} /> : subPage === "Natural Language Capture" ? <NlcSettings prefs={nlcPrefs} onChange={onNlcChange} repeatsAvailable={repeatsAvailable} onOpenInteractions={() => setSubPage("Interactions")} onOpenExamples={() => setSubPage("Examples")} /> : subPage === "Interactions" ? <NlcInteractionsSettings prefs={nlcPrefs} onChange={onNlcChange} /> : subPage === "Examples" ? <NlcExamplesPage repeatsAvailable={repeatsAvailable} /> : subPage === "Sounds and haptics" ? <SoundsAndHapticsSettings panel="reminders" soundsAvailable={soundsAvailable} hapticsAvailable={hapticsAvailable} /> : subPage === "Notifications" ? <NotificationSettings prefs={notifPrefs} isDenied={notifPermissionDenied} onChange={onNotifChange} /> : subPage === "Siri shortcuts" ? <SiriSettings siriOn={siriOn} onSiriChange={onSiriChange} /> : null}
    >
      {datePresetsAvailable && <ToggleRow label="Quick date buttons" isOn={datePresetsOn} onToggle={() => onDatePresetsChange(!datePresetsOn)} infoTitle="Shows quick date buttons, such as Tomorrow and Tonight, when you add or edit a reminder." />}
      {oneMinuteAvailable && <ToggleRow label="1 minute time steps" isOn={oneMinuteOn} onToggle={() => onOneMinuteChange(!oneMinuteOn)} infoTitle="Lets you set reminder times to the exact minute. When off, the time picker moves in 15 minute steps." />}
      {siriAvailable && <MenuRow label="Siri shortcuts" onClick={() => setSubPage("Siri shortcuts")} infoTitle="Turn Siri on or off and see what to say to add a reminder with your voice." />}
      {notificationsAvailable && <MenuRow label="Notifications" onClick={() => setSubPage("Notifications")} infoTitle="Choose how Reminderly alerts you when reminders are due, with or without sound, and whether the app icon shows a badge." />}
      {nlcAvailable && <MenuRow label="Natural Language Capture" onClick={() => setSubPage("Natural Language Capture")} infoTitle="Reminderly can pick out dates, times and repeats as you type, such as 'tomorrow at 3pm' or 'every Monday'. Choose what is recognised and how it works." />}
      {(soundsAvailable || hapticsAvailable) && <MenuRow label="Sounds and haptics" onClick={() => setSubPage("Sounds and haptics")} infoTitle="Choose when Reminderly plays a soft click or your iPhone gives a small vibration, such as when you complete or delete a reminder." />}
      <SupportRow onClick={() => setSubPage("Support")} />
    </PanelShell>
  );
}

// Lists settings > Item order: linked toggles, exactly one on; tapping the one that is on leaves it on
function ItemOrderSettings({ itemOrder, onItemOrderChange }: { itemOrder: ListItemOrder; onItemOrderChange: (value: ListItemOrder) => void }) {
  return (
    <>
      <ToggleRow label="Newest first" isOn={itemOrder === 'newest'} onToggle={() => onItemOrderChange('newest')} infoTitle="New items appear at the top of every list." />
      <ToggleRow label="Oldest first" isOn={itemOrder === 'oldest'} onToggle={() => onItemOrderChange('oldest')} infoTitle="Items appear in the order you added them, with new items at the bottom." />
      <ToggleRow label="A to Z" isOn={itemOrder === 'az'} onToggle={() => onItemOrderChange('az')} infoTitle="Sorts the items in every list alphabetically." />
    </>
  );
}

export function ListsSettingsContent({ onOpenTutorial, onClose, feedbackAvailable = false, soundsAvailable, hapticsAvailable, templatesAvailable, siriAvailable, siriOn, onSiriChange, itemOrder, onItemOrderChange, hideTickedOn, onHideTickedChange, autoClearOn, onAutoClearChange }: { onOpenTutorial?: () => void; soundsAvailable: boolean; hapticsAvailable: boolean; templatesAvailable: boolean; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void; itemOrder: ListItemOrder; onItemOrderChange: (value: ListItemOrder) => void; hideTickedOn: boolean; onHideTickedChange: (value: boolean) => void; autoClearOn: boolean; onAutoClearChange: (value: boolean) => void; feedbackAvailable?: boolean; onClose?: () => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const supportDoc = supportDocFor(subPage, LISTS_FAQS);

  return (
    <PanelShell title="Lists settings" subPage={subPage} subVersion={supportDoc?.version} subUpdated={supportDoc?.lastUpdated} subTitleGap={supportTitleGap(subPage)} onBack={() => setSubPage(supportBack(subPage))} subContent={supportDoc ? <SupportDocPage doc={supportDoc} /> : subPage === "Support" ? <SupportSettings onOpen={setSubPage} tutorialLabel="Lists tutorial" onOpenTutorial={onOpenTutorial} feedbackAvailable={feedbackAvailable} /> : subPage === "Feedback" ? <FeedbackPage onSend={() => setSubPage("Feedback sent")} /> : subPage === "Feedback sent" ? <FeedbackSentPage onDone={onClose} /> : subPage === "Sounds and haptics" ? <SoundsAndHapticsSettings panel="lists" templatesAvailable={templatesAvailable} soundsAvailable={soundsAvailable} hapticsAvailable={hapticsAvailable} /> : subPage === "Item order" ? <ItemOrderSettings itemOrder={itemOrder} onItemOrderChange={onItemOrderChange} /> : null}>
      <ToggleRow label="Hide ticked items" isOn={hideTickedOn} onToggle={() => onHideTickedChange(!hideTickedOn)} infoTitle="Ticked items disappear from your lists a moment after you tick them. Turn this off to see them again." />
      <ToggleRow label="Tidy finished lists" isOn={autoClearOn} onToggle={() => onAutoClearChange(!autoClearOn)} infoTitle="At midnight, lists with every item ticked move to Done." />
      {siriAvailable && <ToggleRow label="Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />}
      {/* Toggles first, then click-through rows */}
      <MenuRow label="Item order" onClick={() => setSubPage("Item order")} infoTitle="Choose whether list items show newest first, oldest first or A to Z." />
      {(soundsAvailable || hapticsAvailable) && <MenuRow label="Sounds and haptics" onClick={() => setSubPage("Sounds and haptics")} infoTitle="Choose when Reminderly plays a soft click or your iPhone gives a small vibration, such as when you check off a list item or delete a list." />}
      <SupportRow onClick={() => setSubPage("Support")} />
    </PanelShell>
  );
}
