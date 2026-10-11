import { useState } from "react";
import type { ReactNode } from "react";
import { ToggleRow, MenuRow } from "./DevToolsOverlay";
import svgPathsDummy from "../../imports/svg-enpj30u9ti";
import { getHapticsConfig, setHapticsConfig, HAPTIC_ACTION_LABELS } from "../utils/haptics";
import type { HapticsConfig } from "../utils/haptics";

// Phase 1: UI only. Toggles hold local state and nothing is saved; click-through rows open empty pages.
// Each panel has its own Siri preference, saved by App. Each row shows only when its Siri flag is on.

// Centred overlay header: title centred, back arrow on the left for sub-pages.
function PanelHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="relative flex items-center justify-center shrink-0 w-full">
      {onBack && (
        <button type="button" onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer shrink-0 p-0 m-0 border-none bg-transparent" aria-label="Back">
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

// Overlay standard: 40px from title to content, 30px between rows. The title stays put; rows scroll when they do not fit.
function PanelShell({ title, subPage, onBack, subContent, children }: { title: string; subPage: string | null; onBack: () => void; subContent?: ReactNode; children: ReactNode }) {
  const content = subPage ? subContent : children;
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start relative w-full min-h-0">
      <PanelHeader title={subPage ?? title} onBack={subPage ? onBack : undefined} />
      {content && (
        <div className="content-stretch flex flex-col gap-[30px] items-start relative w-full min-h-0 overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
}

export type NlcPrefs = { on: boolean; date: boolean; time: boolean; repeats: boolean; autoParsing: boolean };

// Natural Language Capture sub-page. Options show while NLC is on; repeats only while repeat reminders are available.
function NlcSettings({ prefs, onChange, repeatsAvailable }: { prefs: NlcPrefs; onChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean }) {
  return (
    <>
      <ToggleRow label="Natural Language Capture" isOn={prefs.on} onToggle={() => onChange('on', !prefs.on)} infoTitle="Picks out dates, times and repeats as you type a reminder, such as 'tomorrow at 3pm'." />
      {prefs.on && (
        <>
          <ToggleRow label="Recognise dates" isOn={prefs.date} onToggle={() => onChange('date', !prefs.date)} infoTitle="Recognises dates such as 'tomorrow' or 'next Friday'." />
          <ToggleRow label="Recognise times" isOn={prefs.time} onToggle={() => onChange('time', !prefs.time)} infoTitle="Recognises times such as 'at 3pm' or 'in the morning'." />
          {repeatsAvailable && <ToggleRow label="Recognise repeats" isOn={prefs.repeats} onToggle={() => onChange('repeats', !prefs.repeats)} infoTitle="Recognises repeats such as 'every Monday' or 'daily'." />}
          <ToggleRow label="Apply as you type" isOn={prefs.autoParsing} onToggle={() => onChange('autoParsing', !prefs.autoParsing)} infoTitle="When on, recognised dates, times and repeats are applied as you type. When off, tap a highlighted word to apply it." />
        </>
      )}
    </>
  );
}

// Haptic feedback sub-page. The saved choices are shared by both settings panels.
// The top toggle switches every action off in one go and back on to the previous choices; the actions always stay listed.
function HapticSettings() {
  const [config, setConfig] = useState<HapticsConfig>(getHapticsConfig);
  const update = (next: HapticsConfig) => {
    setConfig(next);
    setHapticsConfig(next);
  };
  const setAll = (on: boolean) => {
    // Off keeps each action's saved choice, so on restores them. If none were on, on turns them all on.
    const next = { ...config, allHaptics: on };
    if (on && !HAPTIC_ACTION_LABELS.some(({ action }) => config[action])) {
      for (const { action } of HAPTIC_ACTION_LABELS) next[action] = true;
    }
    update(next);
  };
  const setAction = (action: (typeof HAPTIC_ACTION_LABELS)[number]['action'], on: boolean) => {
    // While the top toggle is off every action counts as off, so turning one on enables only that one
    const next = { ...config };
    if (!config.allHaptics) for (const { action: a } of HAPTIC_ACTION_LABELS) next[a] = false;
    next[action] = on;
    // The top toggle is on while any action is on
    next.allHaptics = HAPTIC_ACTION_LABELS.some(({ action: a }) => next[a]);
    update(next);
  };
  const isOn = (action: (typeof HAPTIC_ACTION_LABELS)[number]['action']) => config.allHaptics && config[action];
  return (
    <>
      <ToggleRow label="Haptic feedback" isOn={config.allHaptics} onToggle={() => setAll(!config.allHaptics)} infoTitle="Turns every vibration below off in one go. Turning it back on restores your previous choices." />
      {HAPTIC_ACTION_LABELS.map(({ action, label, info }) => (
        <ToggleRow key={action} label={label} isOn={isOn(action)} onToggle={() => setAction(action, !isOn(action))} infoTitle={info} />
      ))}
    </>
  );
}

// Last row in both settings overlays. Uses the MenuRow chevron (same size, colour and 15px right inset), rotated to point up.
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

const SIRI_INFO = "Lets you use Siri and the Shortcuts app to create and manage reminders with your voice. Turn this off to stop Reminderly appearing in Siri and Shortcuts.";
const SOUNDS_INFO = "Choose the sounds Reminderly plays, such as when a reminder is due or completed.";

export function RemindersSettingsContent({ onOpenTutorial, calendarAvailable, soundsAvailable, nlcAvailable, nlcPrefs, onNlcChange, repeatsAvailable, hapticsAvailable, oneMinuteAvailable, oneMinuteOn, onOneMinuteChange, siriAvailable, siriOn, onSiriChange }: { onOpenTutorial?: () => void; calendarAvailable: boolean; soundsAvailable: boolean; nlcAvailable: boolean; nlcPrefs: NlcPrefs; onNlcChange: (key: keyof NlcPrefs, value: boolean) => void; repeatsAvailable: boolean; hapticsAvailable: boolean; oneMinuteAvailable: boolean; oneMinuteOn: boolean; onOneMinuteChange: (value: boolean) => void; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <PanelShell
      title="Reminders settings"
      subPage={subPage}
      onBack={() => setSubPage(null)}
      subContent={subPage === "Natural Language Capture" ? <NlcSettings prefs={nlcPrefs} onChange={onNlcChange} repeatsAvailable={repeatsAvailable} /> : subPage === "Haptic feedback" ? <HapticSettings /> : null}
    >
      {calendarAvailable && <ToggleRow label="Show calendar" isOn={showCalendar} onToggle={() => setShowCalendar(prev => !prev)} infoTitle="Shows a calendar view so you can see your reminders by date." />}
      {siriAvailable && <ToggleRow label="Use Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />}
      {oneMinuteAvailable && <ToggleRow label="1 minute time increments" isOn={oneMinuteOn} onToggle={() => onOneMinuteChange(!oneMinuteOn)} infoTitle="Lets you set reminder times to the exact minute. When off, the time picker moves in 5 minute steps." />}
      {nlcAvailable && <MenuRow label="Natural Language Capture" onClick={() => setSubPage("Natural Language Capture")} infoTitle="Reminderly can pick out dates, times and repeats as you type, such as 'tomorrow at 3pm' or 'every Monday'. Choose what is recognised and how it works." />}
      {hapticsAvailable && <MenuRow label="Haptic feedback" onClick={() => setSubPage("Haptic feedback")} infoTitle="Choose when your iPhone gives a small vibration, such as when you complete or delete a reminder." />}
      {soundsAvailable && <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />}
      {onOpenTutorial && <TutorialRow label="Reminders tutorial" onClick={onOpenTutorial} />}
    </PanelShell>
  );
}

export function ListsSettingsContent({ onOpenTutorial, soundsAvailable, hapticsAvailable, siriAvailable, siriOn, onSiriChange }: { onOpenTutorial?: () => void; soundsAvailable: boolean; hapticsAvailable: boolean; siriAvailable: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);

  return (
    <PanelShell title="Lists settings" subPage={subPage} onBack={() => setSubPage(null)} subContent={subPage === "Haptic feedback" ? <HapticSettings /> : null}>
      {siriAvailable && <ToggleRow label="Use Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />}
      {hapticsAvailable && <MenuRow label="Haptic feedback" onClick={() => setSubPage("Haptic feedback")} infoTitle="Choose when your iPhone gives a small vibration, such as when you check off a list item or delete a list." />}
      {soundsAvailable && <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />}
      {onOpenTutorial && <TutorialRow label="Lists tutorial" onClick={onOpenTutorial} />}
    </PanelShell>
  );
}
