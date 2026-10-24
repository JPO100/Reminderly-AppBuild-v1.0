import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToggleRow, MenuRow, KeyLine, InfoPageContext, ShowInfoIconsContext, InfoIcon } from "./DevToolsOverlay";
import svgPathsDummy from "../../imports/svg-enpj30u9ti";
import { getHapticsConfig, setHapticsConfig, HAPTIC_GROUPS, panelMasterKey } from "../utils/haptics";
import type { HapticAction, HapticPanel, HapticsConfig } from "../utils/haptics";
import { getSoundsConfig, setSoundsConfig, SOUND_GROUPS, panelMasterKey as soundsMasterKey } from "../utils/sounds";
import type { SoundsConfig } from "../utils/sounds";
import type { ListItemOrder } from "../utils/list-utils";

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

// The settings cards' 40px bottom padding. Rows that scroll can run into it, up to the card's edge.
const SCROLL_PEEK = 40;
// On sub-pages that scroll, the cut row's middle sits this far above the card's edge (John, 2026-10-22).
const SUB_PAGE_GLIMPSE_GAP = 24;

// cap: on a main page that scrolls, the area's height is capped at the cut row's middle so the card shrinks to put that
// middle SUB_PAGE_GLIMPSE_GAP above its edge, as on sub-pages; base is the height measured before the cap.
type ScrollFit = { cut: number | null; pad: number; grow: number; cap?: number; base?: number };

// Rows with 30px between them. When they do not fit they scroll, and the area's bottom edge moves so it cuts through the
// middle of a row (not a divider): the lowest row whose middle falls within the card's bottom padding (clipped by the card), or, when none
// does, the row above it (the area ends higher and the card shrinks with it, keeping the 40px bottom padding; John, 2026-10-23). Half a row always shows, as a hard edge. Space after the last row lets it
// scroll clear, ending 40px above the card's edge as usual. Rows that fit are unchanged.
// With onGrow (sub-pages), the card instead grows or shrinks by up to 30px so the cut row's middle is always
// SUB_PAGE_GLIMPSE_GAP above the card's edge, whatever the main page's height. baseHeight is the area's height on the
// main page; measuring from it, not the rendered height, keeps the growth from feeding back into itself.
// mainHeaderHeight is the main page's header height: a sub-page header that is taller (a title on two lines, a version
// line) leaves that much less room, measured from the header itself (docs/plans/settings-scroll-peek.md).
function ScrollArea({ children, onGrow, baseHeight, mainHeaderHeight }: { children: ReactNode; onGrow?: (grow: number) => void; baseHeight?: number; mainHeaderHeight?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  // cut: how far the bottom edge moves down (negative: up), null while the rows fit. pad: space after the last row.
  // grow: how much taller the card is made (negative: shorter); the area already grows with the card, so its margin
  // covers only the rest of the cut.
  const [fit, setFit] = useState<ScrollFit>({ cut: null, pad: 0, grow: 0 });
  const fitRef = useRef<ScrollFit>(fit);
  const onGrowRef = useRef(onGrow);
  onGrowRef.current = onGrow;
  const baseHeightRef = useRef(baseHeight);
  baseHeightRef.current = baseHeight;
  const mainHeaderHeightRef = useRef(mainHeaderHeight);
  mainHeaderHeightRef.current = mainHeaderHeight;
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const rows = rowsRef.current;
    if (!scroll || !rows) return;
    const measure = () => {
      const current = fitRef.current;
      // Sizes as they would be without the cut and growth, so the result never depends on itself
      // A capped area keeps the height it was measured from (base), as its rendered height depends on the cap
      const header = scroll.parentElement?.firstElementChild as HTMLElement | null;
      const headerExtra = baseHeightRef.current !== undefined && mainHeaderHeightRef.current !== undefined && header ? header.offsetHeight - mainHeaderHeightRef.current : 0;
      const visible = baseHeightRef.current !== undefined ? baseHeightRef.current - headerExtra : current.base ?? scroll.clientHeight - (current.cut ?? 0) - current.grow;
      const content = rows.offsetHeight - current.pad;
      let next: ScrollFit = { cut: null, pad: 0, grow: 0 };
      if (content > visible + 1) {
        const middles = (Array.from(rows.children) as HTMLElement[])
          .filter((row) => row.offsetHeight >= 10) // not dividers
          .map((row) => Math.round(row.offsetTop + row.offsetHeight / 2 - visible));
        if (onGrowRef.current && baseHeightRef.current !== undefined) {
          // The row whose middle needs the least growth to sit the gap above the card's edge
          const target = SCROLL_PEEK - SUB_PAGE_GLIMPSE_GAP;
          const middle = middles.reduce((best, m) => (Math.abs(m - target) < Math.abs(best - target) ? m : best), middles[0]);
          next = { cut: middle, pad: target, grow: middle - target };
        } else {
          let cut = 0;
          for (const middle of middles) {
            if (middle > SCROLL_PEEK) break;
            cut = middle;
          }
          // As on sub-pages, the cut row's middle sits SUB_PAGE_GLIMPSE_GAP above the card's edge: the lowest row whose middle
          // is no lower than that, with the area capped so the card shrinks to fit it (John, 2026-10-23)
          const target = SCROLL_PEEK - SUB_PAGE_GLIMPSE_GAP;
          const fitting = middles.filter((m) => m <= target);
          cut = fitting.length > 0 ? fitting[fitting.length - 1] : cut;
          next = { cut: target, pad: target, grow: 0, cap: visible + cut, base: visible };
        }
      }
      if (next.cut !== current.cut || next.pad !== current.pad || next.grow !== current.grow || next.cap !== current.cap || next.base !== current.base) {
        fitRef.current = next;
        setFit(next);
      }
      // Reported every time, so a growth kept from an earlier visit is always replaced
      onGrowRef.current?.(next.grow);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(rows);
    // A capped area does not grow with the card, so on resize start again uncapped and measure afresh
    const reset = () => {
      if (fitRef.current.cap === undefined) return;
      fitRef.current = { cut: null, pad: 0, grow: 0 };
      setFit(fitRef.current);
    };
    window.addEventListener("resize", reset);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reset);
    };
  }, []);
  return (
    <div ref={scrollRef} className="relative w-full min-h-0 flex-1 overflow-y-auto" style={fit.cut !== null ? { marginBottom: fit.grow - fit.cut, ...(fit.cap !== undefined ? { maxHeight: fit.cap } : {}) } : undefined}>
      <div ref={rowsRef} className="content-stretch flex flex-col gap-[30px] items-start relative w-full" style={fit.pad > 0 ? { paddingBottom: fit.pad } : undefined}>
        {children}
      </div>
    </div>
  );
}

// Info page: an info icon's description shown in the same card, laid out like the info overlay (title, text, button),
// with Back returning to the page it was opened from. The card fits its height to the text.
// The title has the info icon before it, in dark blue, 10px from the text, 1px below centre (John, 2026-10-22).
function InfoPage({ header, title, onBack }: { header: string; title: string; onBack: () => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center relative w-full">
      <div className="flex items-center justify-center gap-[10px] shrink-0 w-full">
        <span className="relative top-[1px] flex shrink-0"><InfoIcon color="#1C2C42" /></span>
        <p className="font-['Lato:Bold',sans-serif] text-[20px] text-[#1C2C42] leading-[normal] text-center whitespace-pre-wrap" style={{ fontWeight: 700 }}>
          {header}
        </p>
      </div>
      <p className="font-['Lato:Bold',sans-serif] text-[17px] text-[#BABABA] text-center whitespace-pre-wrap" style={{ fontWeight: 700, lineHeight: '24px' }}>{title}</p>
      <button type="button" onClick={onBack} className="bg-[#4784f8] h-[50px] w-full rounded-[100px] cursor-pointer flex items-center justify-center shrink-0 border-none">
        <p className="font-['Lato:Bold',sans-serif] text-[17px] text-white leading-[normal]" style={{ fontWeight: 700 }}>Back</p>
      </button>
    </div>
  );
}

// Sub-page titles that differ from their row label, shortened to fit on one line (John, 2026-10-24)
const SUB_PAGE_TITLES: Record<string, string> = { 'Natural Language Capture': 'Natural Lang. Capture' };

// Overlay standard: 40px from title to content, 30px between rows. The title stays put; rows scroll when they do not fit.
// Sub-pages keep the main page's height, so each panel stays one size while its main rows are unchanged; a sub-page that
// scrolls grows or shrinks by up to 30px so its bottom glimpse matches on every panel.
// Info icons are hidden on sub-pages for now; their infoTitle copy is kept so they can come back.
// A sub-page with a taller header (a version line, a title on two lines) measures its scroll area from that much less.
// Support pages sit 30px under the title, not 40px (John, 2026-10-23); their scroll area measures from that much more.
function PanelShell({ title, subPage, subVersion, subUpdated, subTitleGap = 40, subText = false, onBack, subContent, children }: { title: string; subPage: string | null; subVersion?: string; subUpdated?: string; subTitleGap?: number; subText?: boolean; onBack: () => void; subContent?: ReactNode; children: ReactNode }) {
  const content = subPage ? subContent && <ShowInfoIconsContext.Provider value={false}>{subContent}</ShowInfoIconsContext.Provider> : children;
  const rootRef = useRef<HTMLDivElement>(null);
  const [mainHeight, setMainHeight] = useState<number | null>(null);
  // The scroll area's height on the main page (below the title and its 40px gap); sub-pages measure from it
  const [mainAreaHeight, setMainAreaHeight] = useState<number | undefined>(undefined);
  const [mainHeaderHeight, setMainHeaderHeight] = useState<number | undefined>(undefined);
  const [info, setInfo] = useState<{ header: string; title: string } | null>(null);
  // Growth reported by the sub-page's scroll area, kept per page so another page's growth never applies
  const [growth, setGrowth] = useState<{ page: string; grow: number } | null>(null);
  const grow = subPage && growth?.page === subPage ? growth.grow : 0;
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (subPage === null && info === null && root) {
      setMainHeight(root.offsetHeight);
      const header = root.firstElementChild as HTMLElement | null;
      if (header) {
        setMainAreaHeight(root.offsetHeight - header.offsetHeight - 40);
        setMainHeaderHeight(header.offsetHeight);
      }
    }
  });
  if (info) return <InfoPage header={info.header} title={info.title} onBack={() => setInfo(null)} />;
  return (
    <InfoPageContext.Provider value={(header, text) => setInfo({ header, title: text })}>
      <div ref={rootRef} className="content-stretch flex flex-col items-start relative w-full min-h-0" style={{ gap: subPage ? subTitleGap : 40, ...(subPage && mainHeight ? { height: mainHeight + grow } : {}) }}>
        <PanelHeader title={subPage ? (SUB_PAGE_TITLES[subPage] ?? subPage) : title} version={subPage ? subVersion : undefined} updated={subPage ? subUpdated : undefined} onBack={subPage ? onBack : undefined} />
        {/* Keyed by page so each page measures its own scroll cut from scratch; a cut carried over from another page skews the height */}
        {/* Text pages (Support documents) scroll freely within the page's height: their tall blocks have no row middles to cut through */}
        {/* Like every scrolling page, they use the reduced footer: the area ends SUB_PAGE_GLIMPSE_GAP above the card's edge, and space after the text lets it scroll clear, ending 40px above the edge (John, 2026-10-23) */}
        {content && subPage && subText && (
          <div key={subPage} className="relative w-full min-h-0 flex-1 overflow-y-auto" style={{ marginBottom: SUB_PAGE_GLIMPSE_GAP - SCROLL_PEEK }}>
            <div style={{ paddingBottom: SCROLL_PEEK - SUB_PAGE_GLIMPSE_GAP }}>{content}</div>
          </div>
        )}
        {content && !(subPage && subText) && <ScrollArea key={subPage ?? ""} baseHeight={subPage && mainAreaHeight !== undefined ? mainAreaHeight + (40 - subTitleGap) : undefined} mainHeaderHeight={subPage ? mainHeaderHeight : undefined} onGrow={subPage ? (next) => setGrowth({ page: subPage, grow: next }) : undefined}>{content}</ScrollArea>}
      </div>
    </InfoPageContext.Provider>
  );
}

export type NlcPrefs = { on: boolean; date: boolean; time: boolean; repeats: boolean; autoParsing: boolean };

// Natural Language Capture sub-page: the on/off, a key line, the mode as two linked rows, then the recognise options,
// always listed and inactive (#D9D9D9, not tappable) while NLC is off, keeping their saved choices; repeats only while
// repeat reminders are available.
function NlcSettings({ prefs, onChange, repeatsAvailable }: { prefs: NlcPrefs; onChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean }) {
  return (
    <>
      <ToggleRow label="Natural Language Capture" isOn={prefs.on} onToggle={() => onChange('on', !prefs.on)} infoTitle="Picks out dates, times and repeats as you type a reminder, such as 'tomorrow at 3pm'." />
      <KeyLine />
      {/* The two modes as linked rows, one always on, first so both stay in view: both read and flip the one auto-parsing setting */}
      <ToggleRow label="Auto-fill as you type" isOn={prefs.autoParsing} disabled={!prefs.on} onToggle={() => onChange('autoParsing', !prefs.autoParsing)} infoTitle="Recognised dates, times and repeats are applied as you type." />
      <ToggleRow label="Tap highlighted words" isOn={!prefs.autoParsing} disabled={!prefs.on} onToggle={() => onChange('autoParsing', !prefs.autoParsing)} infoTitle="Recognised words are highlighted; tap one to apply its date, time or repeat." />
      <ToggleRow label="Recognise dates" isOn={prefs.date} disabled={!prefs.on} onToggle={() => onChange('date', !prefs.date)} infoTitle="Recognises dates such as 'tomorrow' or 'next Friday'." />
      <ToggleRow label="Recognise times" isOn={prefs.time} disabled={!prefs.on} onToggle={() => onChange('time', !prefs.time)} infoTitle="Recognises times such as 'at 3pm' or 'in the morning'." />
      {repeatsAvailable && <ToggleRow label="Recognise repeats" isOn={prefs.repeats} disabled={!prefs.on} onToggle={() => onChange('repeats', !prefs.repeats)} infoTitle="Recognises repeats such as 'every Monday' or 'daily'." />}
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
      <ToggleRow label="Notifications" isOn={prefs.alerts} onToggle={() => onChange("alerts", !prefs.alerts)} infoTitle="Alerts you when a reminder with a time is due." />
      <ToggleRow label="Alert sound" isOn={prefs.sound} disabled={!prefs.alerts} onToggle={() => onChange("sound", !prefs.sound)} infoTitle="Plays your iPhone's alert sound with each reminder alert. You can change the sound in iOS Settings, Sounds & Haptics." />
      <KeyLine />
      <ToggleRow label="Overdue badge" isOn={prefs.badge} onToggle={() => onChange("badge", !prefs.badge)} infoTitle="Shows the number of overdue reminders on the Reminderly app icon." />
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
      <p className="font-['Lato:Medium',sans-serif] leading-[23px] text-[17px] text-center w-full" style={{ color: siriOn ? '#939393' : '#D9D9D9' }}>
        To add a reminder with Siri just say
      </p>
      {/* "Hey Siri..." runs straight into each registered phrase, which carries on in lower case */}
      {SIRI_PHRASES.map((phrase) => (
        <p key={phrase} className="font-['Lato:Bold',sans-serif] leading-[23px] text-[17px] text-center w-full" style={{ color: siriOn ? '#1C2C42' : '#D9D9D9' }}>
          {`\u201CHey Siri... ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}\u201D`}
        </p>
      ))}
      <p className="font-['Lato:Medium',sans-serif] leading-[23px] text-[17px] text-center w-full" style={{ color: siriOn ? '#939393' : '#D9D9D9' }}>
        Then when Siri replies, say your reminder.
      </p>
    </>
  );
}

// Support pages: FAQs differ per panel, with their own version; Privacy policy and Terms of use are shared by both panels.
// A paragraph is plain text or a run of text and links; "\n" breaks a line. Sections are 30px apart, with 15px inside.
type DocLink = { text: string; href: string };
type DocParagraph = string | (string | DocLink)[];
type DocSection = { heading?: string; paragraphs: DocParagraph[] };
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
  lastUpdated: "Last updated: 23 October 2026",
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
      "Yes. Turn on Ticked lists to Done in Lists settings. At midnight, any list with every item ticked moves to Done. Pinned lists stay where they are.",
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
      "Reminderly is developed and operated by Neatly Made Limited, a company registered in the United Kingdom.",
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
      "Reminderly, including its design, software, branding and associated intellectual property, belongs to Neatly Made Limited or its licensors.",
      "You are granted permission to use the app in accordance with these terms and Apple's applicable licence agreement.",
    ] },
    { heading: "Availability and liability", paragraphs: [
      "We may update, improve or discontinue features of Reminderly.",
      "While we take reasonable care to provide a reliable app, we cannot guarantee uninterrupted or error-free operation.",
      "To the extent permitted by law, Neatly Made Limited is not responsible for losses arising from missed reminders, delayed notifications or unavailable features.",
      "Nothing in these terms excludes or limits liability where doing so would be unlawful, or affects your statutory consumer rights.",
    ] },
    { heading: "Changes to these terms", paragraphs: [
      "We may update these terms from time to time. The latest version will be available in the app and on our website.",
    ] },
    { heading: "Governing law", paragraphs: [
      "These terms are governed by the laws of England and Wales, subject to any mandatory consumer protections that apply where you live.",
    ] },
    { heading: "Contact", paragraphs: [
      ["Neatly Made Limited\nWebsite: ", { text: "neatlymade.co", href: "https://neatlymade.co" }, "\nEmail: ", { text: "info@neatlymade.co", href: "mailto:info@neatlymade.co" }],
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
      "Reminderly is developed and operated by Neatly Made Limited, a company registered in the United Kingdom.",
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
    { heading: "Contact", paragraphs: [
      ["Neatly Made Limited\nWebsite: ", { text: "neatlymade.co", href: "https://neatlymade.co" }, "\nEmail: ", { text: "info@neatlymade.co", href: "mailto:info@neatlymade.co" }],
    ] },
  ],
};

// The pages opened from Support; Back from these returns to Support
const SUPPORT_DOC_PAGES = ["FAQs", "Privacy policy", "Terms of use"];

function supportDocFor(page: string | null, faqs: SupportDoc): SupportDoc | null {
  if (page === "FAQs") return faqs;
  if (page === "Privacy policy") return PRIVACY_POLICY;
  if (page === "Terms of use") return TERMS_OF_USE;
  return null;
}

// Support sub-page: FAQs and the panel's tutorial (John, 2026-10-23), a key line, then the legal pages.
function SupportSettings({ onOpen, tutorialLabel, onOpenTutorial }: { onOpen: (page: string) => void; tutorialLabel: string; onOpenTutorial?: () => void }) {
  return (
    <>
      <MenuRow label="FAQs" onClick={() => onOpen("FAQs")} />
      {onOpenTutorial && <TutorialRow label={tutorialLabel} onClick={onOpenTutorial} />}
      <KeyLine />
      <MenuRow label="Privacy policy" onClick={() => onOpen("Privacy policy")} />
      <MenuRow label="Terms of use" onClick={() => onOpen("Terms of use")} />
    </>
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

const supportBack = (subPage: string | null) => (subPage && SUPPORT_DOC_PAGES.includes(subPage) ? "Support" : null);
const supportTitleGap = (subPage: string | null) => (subPage === "Support" || (subPage && SUPPORT_DOC_PAGES.includes(subPage)) ? 30 : 40);

export function RemindersSettingsContent({ onOpenTutorial, notificationsAvailable, notifPrefs, notifPermissionDenied, onNotifChange, datePresetsAvailable, datePresetsOn, onDatePresetsChange, soundsAvailable, nlcAvailable, nlcPrefs, onNlcChange, repeatsAvailable, hapticsAvailable, oneMinuteAvailable, oneMinuteOn, onOneMinuteChange, siriAvailable, siriOn, onSiriChange }: { onOpenTutorial?: () => void; notificationsAvailable: boolean; notifPrefs: NotifPrefs; notifPermissionDenied: boolean; onNotifChange: (key: keyof NotifPrefs, value: boolean) => void; datePresetsAvailable: boolean; datePresetsOn: boolean; onDatePresetsChange: (value: boolean) => void; soundsAvailable: boolean; nlcAvailable: boolean; nlcPrefs: NlcPrefs; onNlcChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean; hapticsAvailable: boolean; oneMinuteAvailable: boolean; oneMinuteOn: boolean; onOneMinuteChange: (value: boolean) => void; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const supportDoc = supportDocFor(subPage, REMINDERS_FAQS);

  return (
    <PanelShell
      title="Reminders settings"
      subPage={subPage}
      subVersion={supportDoc?.version}
      subUpdated={supportDoc?.lastUpdated}
      subTitleGap={supportTitleGap(subPage)}
      subText={supportDoc !== null}
      onBack={() => setSubPage(supportBack(subPage))}
      subContent={supportDoc ? <SupportDocPage doc={supportDoc} /> : subPage === "Support" ? <SupportSettings onOpen={setSubPage} tutorialLabel="Reminders tutorial" onOpenTutorial={onOpenTutorial} /> : subPage === "Natural Language Capture" ? <NlcSettings prefs={nlcPrefs} onChange={onNlcChange} repeatsAvailable={repeatsAvailable} /> : subPage === "Sounds and haptics" ? <SoundsAndHapticsSettings panel="reminders" soundsAvailable={soundsAvailable} hapticsAvailable={hapticsAvailable} /> : subPage === "Notifications" ? <NotificationSettings prefs={notifPrefs} isDenied={notifPermissionDenied} onChange={onNotifChange} /> : subPage === "Siri shortcuts" ? <SiriSettings siriOn={siriOn} onSiriChange={onSiriChange} /> : null}
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

export function ListsSettingsContent({ onOpenTutorial, soundsAvailable, hapticsAvailable, templatesAvailable, siriAvailable, siriOn, onSiriChange, itemOrder, onItemOrderChange, hideTickedOn, onHideTickedChange, autoClearOn, onAutoClearChange }: { onOpenTutorial?: () => void; soundsAvailable: boolean; hapticsAvailable: boolean; templatesAvailable: boolean; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void; itemOrder: ListItemOrder; onItemOrderChange: (value: ListItemOrder) => void; hideTickedOn: boolean; onHideTickedChange: (value: boolean) => void; autoClearOn: boolean; onAutoClearChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const supportDoc = supportDocFor(subPage, LISTS_FAQS);

  return (
    <PanelShell title="Lists settings" subPage={subPage} subVersion={supportDoc?.version} subUpdated={supportDoc?.lastUpdated} subTitleGap={supportTitleGap(subPage)} subText={supportDoc !== null} onBack={() => setSubPage(supportBack(subPage))} subContent={supportDoc ? <SupportDocPage doc={supportDoc} /> : subPage === "Support" ? <SupportSettings onOpen={setSubPage} tutorialLabel="Lists tutorial" onOpenTutorial={onOpenTutorial} /> : subPage === "Sounds and haptics" ? <SoundsAndHapticsSettings panel="lists" templatesAvailable={templatesAvailable} soundsAvailable={soundsAvailable} hapticsAvailable={hapticsAvailable} /> : subPage === "Item order" ? <ItemOrderSettings itemOrder={itemOrder} onItemOrderChange={onItemOrderChange} /> : null}>
      <ToggleRow label="Hide ticked items" isOn={hideTickedOn} onToggle={() => onHideTickedChange(!hideTickedOn)} infoTitle="Ticked items disappear from your lists a moment after you tick them. Turn this off to see them again." />
      <ToggleRow label="Ticked lists to Done" isOn={autoClearOn} onToggle={() => onAutoClearChange(!autoClearOn)} infoTitle="At midnight, lists with every item ticked move to Done." />
      {siriAvailable && <ToggleRow label="Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />}
      {/* Toggles first, then click-through rows */}
      <MenuRow label="Item order" onClick={() => setSubPage("Item order")} infoTitle="Choose whether list items show newest first, oldest first or A to Z." />
      {(soundsAvailable || hapticsAvailable) && <MenuRow label="Sounds and haptics" onClick={() => setSubPage("Sounds and haptics")} infoTitle="Choose when Reminderly plays a soft click or your iPhone gives a small vibration, such as when you check off a list item or delete a list." />}
      <SupportRow onClick={() => setSubPage("Support")} />
    </PanelShell>
  );
}
