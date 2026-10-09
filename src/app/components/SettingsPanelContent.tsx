import { useState } from "react";
import type { ReactNode } from "react";
import { ToggleRow, MenuRow, SectionSubtitle, KeyLine } from "./DevToolsOverlay";
import svgPathsDummy from "../../imports/svg-enpj30u9ti";

// Phase 1: UI only. Toggles hold local state and nothing is saved; click-through rows open empty pages.
// The System settings Siri toggle is held in App so both panels stay in sync.

function PanelHeader({ title, onBack, onClose, closeLabel }: { title: string; onBack?: () => void; onClose: () => void; closeLabel: string }) {
  return (
    <div className="filters-menu flex items-center justify-between relative shrink-0 w-full h-[45px]">
      <div className="flex gap-[20px] items-center">
        {onBack && (
          <button type="button" onClick={onBack} className="cursor-pointer shrink-0" aria-label="Back">
            <div className="h-[17px] relative shrink-0 w-[9px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 17">
                <path d={svgPathsDummy.p347e8980} fill="#1C2C42" />
              </svg>
            </div>
          </button>
        )}
        <div className="font-['Lato',sans-serif] font-bold text-[20px] text-[#1C2C42] whitespace-nowrap">
          {title}
        </div>
      </div>
      <button
        className="relative shrink-0 p-0 m-0 border-none bg-transparent flex items-center justify-center self-center cursor-pointer w-[45px] h-[45px]"
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
      >
        <svg className="block shrink-0" width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
          <path d="M17.0199 17.0201L27.9801 27.9803M17.0199 27.9803L27.9801 17.0201" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function PanelShell({ title, closeLabel, subPage, onBack, onClose, children }: { title: string; closeLabel: string; subPage: string | null; onBack: () => void; onClose: () => void; children: ReactNode }) {
  return (
    <div className="content-stretch flex flex-col gap-[30px] items-start pt-[30px] pb-[60px] px-[24px] relative w-full flex-1 min-h-0" style={{ overflowY: 'auto' }}>
      {subPage ? (
        <PanelHeader title={subPage} onBack={onBack} onClose={onClose} closeLabel={closeLabel} />
      ) : (
        <>
          <PanelHeader title={title} onClose={onClose} closeLabel={closeLabel} />
          {children}
        </>
      )}
    </div>
  );
}

const SIRI_INFO = "Lets you use Siri and the Shortcuts app to create and manage reminders with your voice. Turn this off to stop Reminderly appearing in Siri and Shortcuts.";
const SOUNDS_INFO = "Choose the sounds Reminderly plays, such as when a reminder is due or completed.";

export function RemindersSettingsContent({ onClose, topContent, useOneMinuteIncrements, siriOn, onSiriChange }: { onClose: () => void; topContent?: ReactNode; useOneMinuteIncrements: boolean; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [oneMinute, setOneMinute] = useState(useOneMinuteIncrements);
  const [showSubtitles, setShowSubtitles] = useState(false);

  return (
    <PanelShell title="Reminders settings" closeLabel="Close reminders settings" subPage={subPage} onBack={() => setSubPage(null)} onClose={onClose}>
      {topContent}
      <MenuRow label="Natural Language Capture" onClick={() => setSubPage("Natural Language Capture")} infoTitle="Reminderly can pick out dates, times and repeats as you type, such as 'tomorrow at 3pm' or 'every Monday'. Choose what is recognised and how it works." />
      <MenuRow label="Haptic feedback" onClick={() => setSubPage("Haptic feedback")} infoTitle="Choose when your iPhone gives a small vibration, such as when you complete or delete a reminder." />
      <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />
      <ToggleRow label="Show calendar" isOn={showCalendar} onToggle={() => setShowCalendar(prev => !prev)} infoTitle="Shows a calendar view so you can see your reminders by date." />
      <ToggleRow label="Use 1 minute time increments" isOn={oneMinute} onToggle={() => setOneMinute(prev => !prev)} infoTitle="Lets you set reminder times to the exact minute. When off, the time picker moves in 5 minute steps." />
      <ToggleRow label="Show reminder sub-titles" isOn={showSubtitles} onToggle={() => setShowSubtitles(prev => !prev)} infoTitle="Shows extra detail under each reminder, such as its date, time and repeat." />
      <KeyLine />
      <SectionSubtitle text="System settings" />
      <ToggleRow label="Use Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />
    </PanelShell>
  );
}

export function ListsSettingsContent({ onClose, siriOn, onSiriChange }: { onClose: () => void; siriOn: boolean; onSiriChange: (value: boolean) => void }) {
  const [subPage, setSubPage] = useState<string | null>(null);
  const [smartReminders, setSmartReminders] = useState(false);
  const [listTemplates, setListTemplates] = useState(false);

  return (
    <PanelShell title="Lists settings" closeLabel="Close lists settings" subPage={subPage} onBack={() => setSubPage(null)} onClose={onClose}>
      <MenuRow label="Sounds" onClick={() => setSubPage("Sounds")} infoTitle={SOUNDS_INFO} />
      <ToggleRow label="Use Smart Reminders" isOn={smartReminders} onToggle={() => setSmartReminders(prev => !prev)} infoTitle="Link a reminder to a list so it tracks your progress, for example '3 of 5 items'." />
      <ToggleRow label="Use list templates" isOn={listTemplates} onToggle={() => setListTemplates(prev => !prev)} infoTitle="Save a list as a template so you can reuse it again and again, such as a packing or shopping list." />
      <KeyLine />
      <SectionSubtitle text="System settings" />
      <ToggleRow label="Use Siri shortcuts" isOn={siriOn} onToggle={() => onSiriChange(!siriOn)} infoTitle={SIRI_INFO} />
    </PanelShell>
  );
}
