import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToggleRow, MenuRow, KeyLine } from "./DevToolsOverlay";
import svgPathsDummy from "../../imports/svg-enpj30u9ti";
import { getHapticsConfig, setHapticsConfig, HAPTIC_GROUPS, panelMasterKey } from "../utils/haptics";
import type { HapticAction, HapticPanel, HapticsConfig } from "../utils/haptics";
import { getSoundsConfig, setSoundsConfig, SOUND_GROUPS, panelMasterKey as soundsMasterKey } from "../utils/sounds";
import type { SoundsConfig } from "../utils/sounds";

// Settings panel content. App owns and saves the values; rows show only when their feature is available.
// Each panel has its own Siri preference, saved by App. Each row shows only when its Siri flag is on.

// Centred overlay header: title centred, back arrow on the left for sub-pages.
// The back button pads the 9x17 arrow to a 45x45 tap area; the negative left offset keeps the arrow in place.
function PanelHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
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
  );
}

// The settings cards' 40px bottom padding. Rows that scroll can run into it, up to the card's edge.
const SCROLL_PEEK = 40;

// Rows with 30px between them. When they do not fit they scroll, and the area's bottom edge moves so it cuts through the
// middle of a row (not a divider): the lowest row whose middle falls within the card's bottom padding (clipped by the card), or, when none
// does, the row above it (the area ends higher). Half a row always shows, as a hard edge. Space after the last row lets it
// scroll clear, ending 40px above the card's edge as usual. Rows that fit are unchanged.
function ScrollArea({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  // How far the bottom edge moves down (negative: up). null while the rows fit.
  const [cut, setCut] = useState<number | null>(null);
  const cutRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const rows = rowsRef.current;
    if (!scroll || !rows) return;
    const measure = () => {
      const current = cutRef.current ?? 0;
      // Sizes as they would be without the cut, so the result never depends on itself
      const visible = scroll.clientHeight - current;
      const content = rows.offsetHeight - Math.max(current, 0);
      let next: number | null = null;
      if (content > visible + 1) {
        next = 0;
        for (const row of Array.from(rows.children) as HTMLElement[]) {
          if (row.offsetHeight < 10) continue; // dividers
          const middle = row.offsetTop + row.offsetHeight / 2 - visible;
          if (middle > SCROLL_PEEK) break;
          next = Math.round(middle);
        }
      }
      if (next !== cutRef.current) {
        cutRef.current = next;
        setCut(next);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(rows);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={scrollRef} className="relative w-full min-h-0 flex-1 overflow-y-auto" style={cut !== null ? { marginBottom: -cut } : undefined}>
      <div ref={rowsRef} className="content-stretch flex flex-col gap-[30px] items-start relative w-full" style={cut !== null && cut > 0 ? { paddingBottom: cut } : undefined}>
        {children}
      </div>
    </div>
  );
}

// Overlay standard: 40px from title to content, 30px between rows. The title stays put; rows scroll when they do not fit.
// Sub-pages keep the main page's height, so each panel stays one size while its main rows are unchanged.
function PanelShell({ title, subPage, onBack, subContent, children }: { title: string; subPage: string | null; onBack: () => void; subContent?: ReactNode; children: ReactNode }) {
  const content = subPage ? subContent : children;
  const rootRef = useRef<HTMLDivElement>(null);
  const [mainHeight, setMainHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (subPage === null && rootRef.current) setMainHeight(rootRef.current.offsetHeight);
  });
  return (
    <div ref={rootRef} className="content-stretch flex flex-col gap-[40px] items-start relative w-full min-h-0" style={subPage && mainHeight ? { height: mainHeight } : undefined}>
      <PanelHeader title={subPage ?? title} onBack={subPage ? onBack : undefined} />
      {content && <ScrollArea>{content}</ScrollArea>}
    </div>
  );
}

export type NlcPrefs = { on: boolean; date: boolean; time: boolean; repeats: boolean; autoParsing: boolean };

// Natural Language Capture sub-page, laid out like Haptic feedback and Sounds: the on/off, a key line, then the options,
// always listed and inactive (#D9D9D9, not tappable) while NLC is off, keeping their saved choices; repeats only while
// repeat reminders are available.
function NlcSettings({ prefs, onChange, repeatsAvailable }: { prefs: NlcPrefs; onChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean }) {
  return (
    <>
      <ToggleRow label="Natural Language Capture" isOn={prefs.on} onToggle={() => onChange('on', !prefs.on)} infoTitle="Picks out dates, times and repeats as you type a reminder, such as 'tomorrow at 3pm'." />
      <KeyLine />
      <ToggleRow label="Recognise dates" isOn={prefs.date} disabled={!prefs.on} onToggle={() => onChange('date', !prefs.date)} infoTitle="Recognises dates such as 'tomorrow' or 'next Friday'." />
      <ToggleRow label="Recognise times" isOn={prefs.time} disabled={!prefs.on} onToggle={() => onChange('time', !prefs.time)} infoTitle="Recognises times such as 'at 3pm' or 'in the morning'." />
      {repeatsAvailable && <ToggleRow label="Recognise repeats" isOn={prefs.repeats} disabled={!prefs.on} onToggle={() => onChange('repeats', !prefs.repeats)} infoTitle="Recognises repeats such as 'every Monday' or 'daily'." />}
      <ToggleRow label="Apply as you type" isOn={prefs.autoParsing} disabled={!prefs.on} onToggle={() => onChange('autoParsing', !prefs.autoParsing)} infoTitle="When on, recognised dates, times and repeats are applied as you type. When off, tap a highlighted word to apply it." />
    </>
  );
}

// Haptic feedback sub-page: the panel's own on/off plus its groups, always listed (template groups only while templates are available).
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
      <KeyLine />
      {groups.map(({ label, info, actions }) => (
        <ToggleRow key={label} label={label} isOn={groupOn(actions)} disabled={!config[masterKey]} onToggle={() => setGroup(actions, !groupOn(actions))} infoTitle={info} />
      ))}
    </>
  );
}

// Sounds sub-page: same behaviour as Haptic feedback, with its own saved choices.
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
      <KeyLine />
      {groups.map(({ label, info, actions }) => (
        <ToggleRow key={label} label={label} isOn={groupOn(actions)} disabled={!config[masterKey]} onToggle={() => setGroup(actions, !groupOn(actions))} infoTitle={info} />
      ))}
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
      {isDenied && <MenuRow label="Turn on in Settings" onClick={() => { window.location.href = "app-settings:"; }} infoTitle="Notifications are turned off for Reminderly in iOS Settings. Open Settings to allow them. Your choices below are kept." />}
      <ToggleRow label="Notifications" isOn={prefs.alerts} onToggle={() => onChange("alerts", !prefs.alerts)} infoTitle="Alerts you when a reminder with a time is due." />
      <ToggleRow label="Sound" isOn={prefs.sound} disabled={!prefs.alerts} onToggle={() => onChange("sound", !prefs.sound)} infoTitle="Plays your iPhone's alert sound with each reminder alert. You can change the sound in iOS Settings, Sounds & Haptics." />
      <KeyLine />
      <ToggleRow label="App badge" isOn={prefs.badge} onToggle={() => onChange("badge", !prefs.badge)} infoTitle="Shows the number of overdue reminders on the Reminderly app icon." />
      <ToggleRow label="Include today in badge" isOn={prefs.includeToday} disabled={!prefs.badge} onToggle={() => onChange("includeToday", !prefs.includeToday)} infoTitle="Also counts reminders due today in the app icon badge." />
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

// The phrases registered in ios/App/App/AppShortcuts.swift; keep both in step. All of them always work.
export const SIRI_PHRASES = [
  "Add to Reminderly app",
  "Remind me in Reminderly app",
  "New reminder in Reminderly app",
  "Add a reminder in Reminderly app",
];

// Siri shortcuts sub-page, laid out like Haptic feedback: the on/off, a key line, then the phrases Siri recognises and how to go on,
// inactive (#D9D9D9) while Siri is off. The phrases are a list to read, not a choice.
function SiriSettings({ siriOn, onSiriChange }: { siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  return (
    <>
      <ToggleRow label="Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />
      <KeyLine />
      <p className="font-['Lato:SemiBold',sans-serif] leading-[23px] text-[17px] w-full" style={{ color: siriOn ? '#939393' : '#D9D9D9' }}>
        You can use any of these with Siri...
      </p>
      {SIRI_PHRASES.map((phrase) => (
        <p key={phrase} className="font-['Lato:Bold',sans-serif] leading-[23px] text-[17px] w-full" style={{ color: siriOn ? '#1C2C42' : '#D9D9D9' }}>
          {`\u201C${phrase}\u201D`}
        </p>
      ))}
      <p className="font-['Lato:SemiBold',sans-serif] leading-[23px] text-[17px] w-full" style={{ color: siriOn ? '#939393' : '#D9D9D9' }}>
        Then reply when Siri asks.
      </p>
    </>
  );
}
const SOUNDS_INFO = "Choose when Reminderly plays a soft click, such as when you complete or delete an item.";

export function RemindersSettingsContent({ onOpenTutorial, notificationsAvailable, notifPrefs, notifPermissionDenied, onNotifChange, datePresetsAvailable, datePresetsOn, onDatePresetsChange, soundsAvailable, nlcAvailable, nlcPrefs, onNlcChange, repeatsAvailable, hapticsAvailable, oneMinuteAvailable, oneMinuteOn, onOneMinuteChange, siriAvailable, siriOn, onSiriChange }: { onOpenTutorial?: () => void; notificationsAvailable: boolean; notifPrefs: NotifPrefs; notifPermissionDenied: boolean; onNotifChange: (key: keyof NotifPrefs, value: boolean) => void; datePresetsAvailable: boolean; datePresetsOn: boolean; onDatePresetsChange: (value: boolean) => void; soundsAvailable: boolean; nlcAvailable: boolean; nlcPrefs: NlcPrefs; onNlcChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean; hapticsAvailable: boolean; oneMinuteAvailable: boolean; oneMinuteOn: boolean; onOneMinuteChange: (value: boolean) => void; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);

  return (
    <PanelShell
      title="Reminders settings"
      subPage={subPage}
      onBack={() => setSubPage(null)}
      subContent={subPage === "Natural Language Capture" ? <NlcSettings prefs={nlcPrefs} onChange={onNlcChange} repeatsAvailable={repeatsAvailable} /> : subPage === "Haptic feedback" ? <HapticSettings panel="reminders" /> : subPage === "Sounds" ? <SoundSettings panel="reminders" /> : subPage === "Notifications" ? <NotificationSettings prefs={notifPrefs} isDenied={notifPermissionDenied} onChange={onNotifChange} /> : subPage === "Siri shortcuts" ? <SiriSettings siriOn={siriOn} onSiriChange={onSiriChange} /> : null}
    >
      {datePresetsAvailable && <ToggleRow label="Show date presets" isOn={datePresetsOn} onToggle={() => onDatePresetsChange(!datePresetsOn)} infoTitle="Shows quick date buttons, such as Tomorrow and Tonight, when you add or edit a reminder." />}
      {siriAvailable && <MenuRow label="Siri shortcuts" onClick={() => setSubPage("Siri shortcuts")} infoTitle="Turn Siri on or off and see what to say to add a reminder with your voice." />}
      {oneMinuteAvailable && <ToggleRow label="1 minute time increments" isOn={oneMinuteOn} onToggle={() => onOneMinuteChange(!oneMinuteOn)} infoTitle="Lets you set reminder times to the exact minute. When off, the time picker moves in 5 minute steps." />}
      {notificationsAvailable && <MenuRow label="Notifications" onClick={() => setSubPage("Notifications")} infoTitle="Choose how Reminderly alerts you when reminders are due, with or without sound, and whether the app icon shows a badge." />}
      {nlcAvailable && <MenuRow label="Natural Language Capture" onClick={() => setSubPage("Natural Language Capture")} infoTitle="Reminderly can pick out dates, times and repeats as you type, such as 'tomorrow at 3pm' or 'every Monday'. Choose what is recognised and how it works." />}
      {hapticsAvailable && <MenuRow label="Haptic feedback" onClick={() => setSubPage("Haptic feedback")} infoTitle="Choose when your iPhone gives a small vibration, such as when you complete or delete a reminder." />}
      {soundsAvailable && <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />}
      {onOpenTutorial && <TutorialRow label="Reminders tutorial" onClick={onOpenTutorial} />}
    </PanelShell>
  );
}

export function ListsSettingsContent({ onOpenTutorial, soundsAvailable, hapticsAvailable, templatesAvailable, siriAvailable, siriOn, onSiriChange, sortAzOn, onSortAzChange, autoClearOn, onAutoClearChange }: { onOpenTutorial?: () => void; soundsAvailable: boolean; hapticsAvailable: boolean; templatesAvailable: boolean; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void; sortAzOn: boolean; onSortAzChange: (value: boolean) => void; autoClearOn: boolean; onAutoClearChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);

  return (
    <PanelShell title="Lists settings" subPage={subPage} onBack={() => setSubPage(null)} subContent={subPage === "Haptic feedback" ? <HapticSettings panel="lists" templatesAvailable={templatesAvailable} /> : subPage === "Sounds" ? <SoundSettings panel="lists" templatesAvailable={templatesAvailable} /> : null}>
      <ToggleRow label="Sort items A to Z" isOn={sortAzOn} onToggle={() => onSortAzChange(!sortAzOn)} infoTitle="Sorts the items in every list alphabetically. When off, items appear in the order you added them, most recent at the top." />
      <ToggleRow label="Clear done lists nightly" isOn={autoClearOn} onToggle={() => onAutoClearChange(!autoClearOn)} infoTitle="At midnight, lists with every item ticked move to Done." />
      {siriAvailable && <ToggleRow label="Use Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />}
      {hapticsAvailable && <MenuRow label="Haptic feedback" onClick={() => setSubPage("Haptic feedback")} infoTitle="Choose when your iPhone gives a small vibration, such as when you check off a list item or delete a list." />}
      {soundsAvailable && <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />}
      {onOpenTutorial && <TutorialRow label="Lists tutorial" onClick={onOpenTutorial} />}
    </PanelShell>
  );
}
