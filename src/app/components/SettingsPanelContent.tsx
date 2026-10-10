import { useState } from "react";
import type { ReactNode } from "react";
import { ToggleRow, MenuRow } from "./DevToolsOverlay";
import svgPathsDummy from "../../imports/svg-enpj30u9ti";

// Phase 1: UI only. Toggles hold local state and nothing is saved; click-through rows open empty pages.
// Each panel has its own Siri toggle, held in App so it survives the overlay closing. The two are independent.

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

// Overlay standard: 40px from title to content, 30px between rows.
function PanelShell({ title, subPage, onBack, children }: { title: string; subPage: string | null; onBack: () => void; children: ReactNode }) {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start relative w-full">
      <PanelHeader title={subPage ?? title} onBack={subPage ? onBack : undefined} />
      {!subPage && (
        <div className="content-stretch flex flex-col gap-[30px] items-start relative w-full shrink-0">
          {children}
        </div>
      )}
    </div>
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

export function RemindersSettingsContent({ onOpenTutorial, useOneMinuteIncrements, siriOn, onSiriChange }: { onOpenTutorial?: () => void; useOneMinuteIncrements: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [oneMinute, setOneMinute] = useState(useOneMinuteIncrements);

  return (
    <PanelShell title="Reminders settings" subPage={subPage} onBack={() => setSubPage(null)}>
      <ToggleRow label="Show calendar" isOn={showCalendar} onToggle={() => setShowCalendar(prev => !prev)} infoTitle="Shows a calendar view so you can see your reminders by date." />
      <ToggleRow label="Use Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />
      <ToggleRow label="1 minute time increments" isOn={oneMinute} onToggle={() => setOneMinute(prev => !prev)} infoTitle="Lets you set reminder times to the exact minute. When off, the time picker moves in 5 minute steps." />
      <MenuRow label="Natural Language Capture" onClick={() => setSubPage("Natural Language Capture")} infoTitle="Reminderly can pick out dates, times and repeats as you type, such as 'tomorrow at 3pm' or 'every Monday'. Choose what is recognised and how it works." />
      <MenuRow label="Haptic feedback" onClick={() => setSubPage("Haptic feedback")} infoTitle="Choose when your iPhone gives a small vibration, such as when you complete or delete a reminder." />
      <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />
      {onOpenTutorial && <TutorialRow label="Reminders tutorial" onClick={onOpenTutorial} />}
    </PanelShell>
  );
}

export function ListsSettingsContent({ onOpenTutorial, siriOn, onSiriChange }: { onOpenTutorial?: () => void; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const [smartReminders, setSmartReminders] = useState(false);

  return (
    <PanelShell title="Lists settings" subPage={subPage} onBack={() => setSubPage(null)}>
      <ToggleRow label="Use Smart Reminders" isOn={smartReminders} onToggle={() => setSmartReminders(prev => !prev)} infoTitle="Link a reminder to a list so it tracks your progress, for example '3 of 5 items'." />
      <ToggleRow label="Use Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />
      <MenuRow label="Haptic feedback" onClick={() => setSubPage("Haptic feedback")} infoTitle="Choose when your iPhone gives a small vibration, such as when you check off a list item or delete a list." />
      <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />
      {onOpenTutorial && <TutorialRow label="Lists tutorial" onClick={onOpenTutorial} />}
    </PanelShell>
  );
}
