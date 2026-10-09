import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { getHapticsConfig, setHapticsConfig } from "../utils/haptics";
import type { HapticAction, HapticsConfig } from "../utils/haptics";
import { runChecks, formatReportAsText, groupResultsBySection } from "../dev/check-system";
import type { RunReport } from "../dev/check-system";
import { getScheduleChecks } from "../dev/schedule-checks";
import { getReminderChecks } from "../dev/reminder-checks";
import { getNlcParserChecks } from "../dev/nlc-parser-checks";
import { getNlcInteractionChecks } from "../dev/nlc-interaction-checks";
import { getDoneDeletedChecks } from "../dev/done-deleted-checks";
import { getCompletionChecks } from "../dev/completion-checks";
import { getDevToolsChecks } from "../dev/dev-tools-checks";
import { getListChecks } from "../dev/list-checks";
import { getNotificationChecks } from "../dev/notification-checks";
import type { Check } from "../dev/check-system";
import type { GeneratedDummyListsPayload, GeneratedList } from "../utils/dummy-list-generator";
import DevToolsHome from "../../imports/DevTools";
import DummyRemindersPage from "../../imports/DummyReminders";
import DummyListsPage from "../../imports/DummyLists";
import type { Reminder } from "../reminder-utils";
import svgPathsDummy from "../../imports/svg-enpj30u9ti";
import type { NlcMode } from "../utils/nlc-interaction";
import type { NlcRecognitionConfig } from "../utils/nlc-parser";
import svgPathsGear from "../../imports/svg-rl6qtmr1a6";
import svgPathsHex from "../../imports/svg-8hjr6ht2yw";
import loginSvgPaths from "../../imports/svg-xgk7qm25s1";
import passwordPageSvgPaths from "../../imports/svg-y29dfn20l5";
import passwordResetSvgPaths from "../../imports/svg-p8ebad7jx7";

const DEV_TOOLS_PASSWORD = '123';

type DevToolsPage = 'home' | 'dummy-reminders' | 'dummy-lists' | 'dev-tools-password' | 'haptics' | 'system' | 'natural-language' | 'onboarding' | 'notifications-area' | 'testing' | 'reminders' | 'lists';

function BackHeader({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full mb-[15px]" data-name="header">
      <div className="content-stretch flex gap-[20px] items-center relative shrink-0">
        <button
          onClick={onBack}
          className="cursor-pointer shrink-0"
          aria-label="Back"
        >
          <div className="h-[17px] relative shrink-0 w-[9px]">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 17">
              <path d={svgPathsDummy.p347e8980} fill="var(--fill-0, #1C2C42)" id="Union" />
            </svg>
          </div>
        </button>
        <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] whitespace-nowrap">
          <p className="leading-[normal]">{title}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="flex items-center justify-center relative shrink-0 size-[25.456px] cursor-pointer"
        aria-label="Close dev tools"
      >
        <div className="flex-none rotate-45">
          <div className="relative size-[18px]" data-name="Union">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
              <path d={svgPathsDummy.p1cbc7100} fill="var(--fill-0, #1C2C42)" id="Union" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}

function PageShell({ title, onBack, onClose, children }: { title: string; onBack: () => void; onClose: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[30px] items-start pt-[30px] px-[20px] pb-[60px] relative w-full flex-1 min-h-0" style={{ overflowY: 'auto' }}>
      <BackHeader title={title} onBack={onBack} onClose={onClose} />
      {children}
    </div>
  );
}

function InfoIcon({ color = '#939393' }: { color?: string }) {
  return (
    <svg width="16.5" height="16.5" viewBox="0 0 17 17" fill="none" className="shrink-0">
      <path d="M7.6875 6.75C7.84307 6.75 8.03551 6.7485 8.19922 6.77051C8.36125 6.79232 8.5773 6.84631 8.77441 7.00488L8.8584 7.0791L8.93262 7.16309C9.09119 7.36019 9.14517 7.57625 9.16699 7.73828C9.189 7.90198 9.1875 8.09443 9.1875 8.25V12C9.1875 12.4142 8.85171 12.75 8.4375 12.75C8.02329 12.75 7.6875 12.4142 7.6875 12V8.25C7.27329 8.25 6.9375 7.91421 6.9375 7.5C6.93751 7.08579 7.27329 6.75 7.6875 6.75Z" fill={color}/>
      <path d="M8.24902 4.5C8.66312 4.50013 8.99902 4.83587 8.99902 5.25C8.99902 5.66413 8.66312 5.99987 8.24902 6H8.24219C7.82798 6 7.4922 5.66421 7.49219 5.25C7.49219 4.83579 7.82797 4.5 8.24219 4.5H8.24902Z" fill={color}/>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.25 0C12.8063 0 16.5 3.69365 16.5 8.25C16.5 12.8063 12.8063 16.5 8.25 16.5C3.69365 16.5 0 12.8063 0 8.25C0 3.69365 3.69365 0 8.25 0ZM8.25 1.5C4.52208 1.5 1.5 4.52208 1.5 8.25C1.5 11.9779 4.52208 15 8.25 15C11.9779 15 15 11.9779 15 8.25C15 4.52208 11.9779 1.5 8.25 1.5Z" fill={color}/>
    </svg>
  );
}

export function DevToolsInfoOverlay({ visible, onClose, header, title }: { visible: boolean; onClose: () => void; header: string; title: string }) {
  if (!visible) return null;
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <div
          className="bg-white relative flex flex-col gap-[40px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px] pointer-events-auto outline-none"
          style={{ width: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-['Lato:Bold',sans-serif] text-[20px] text-[#1C2C42] leading-[normal] text-center whitespace-pre-wrap" style={{ fontWeight: 700 }}>{header}</p>
          <p className="font-['Lato:Bold',sans-serif] text-[17px] text-[#BABABA] text-center whitespace-pre-wrap" style={{ fontWeight: 700, lineHeight: '24px' }}>{title}</p>
          <button
            onClick={onClose}
            className="bg-[#4784f8] h-[50px] w-full rounded-[100px] cursor-pointer flex items-center justify-center shrink-0"
          >
            <p className="font-['Lato:Bold',sans-serif] text-[17px] text-white leading-[normal]" style={{ fontWeight: 700 }}>Close</p>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

export function InfoIconWithOverlay({ color, header, title }: { color?: string; header: string; title: string }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <>
      <span onClick={(e) => { e.stopPropagation(); setShowInfo(true); }} className="shrink-0 cursor-pointer">
        <InfoIcon color={color} />
      </span>
      <DevToolsInfoOverlay visible={showInfo} onClose={() => setShowInfo(false)} header={header} title={title} />
    </>
  );
}

function ToggleRow({ label, isOn, onToggle, disabled, infoHeader, infoTitle }: { label: string; isOn: boolean; onToggle: () => void; disabled?: boolean; infoHeader?: string; infoTitle?: string }) {
  return (
    <div className="flex h-[30px] items-center justify-between w-full">
      <div className="flex items-center gap-[16px]">
        <p
          className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic text-[17px] whitespace-nowrap"
          style={{ color: disabled ? '#D9D9D9' : (isOn ? '#1C2C42' : '#C9C9C9') }}
        >
          {label}
        </p>
        <InfoIconWithOverlay color={disabled || !isOn ? '#D9D9D9' : undefined} header={infoHeader || label} title={infoTitle || ''} />
      </div>
      <button
        onClick={() => { if (!disabled) onToggle(); }}
        className={`flex h-[30px] items-center p-[3.75px] rounded-[37.5px] shrink-0 w-[56px] transition-colors ${disabled ? 'bg-[#D9D9D9] justify-start' : (isOn ? 'bg-[#4784f8] justify-end' : 'bg-[#C9C9C9] justify-start')}`}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      >
        <div className="relative shrink-0 size-[22.5px]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
            <circle cx="11.25" cy="11.25" fill="white" r="11.25" />
          </svg>
        </div>
      </button>
    </div>
  );
}

function MenuRow({ label, onClick, disabled, infoHeader, infoTitle }: { label: string; onClick: () => void; disabled?: boolean; infoHeader?: string; infoTitle?: string }) {
  return (
    <button
      onClick={() => { if (!disabled) onClick(); }}
      className="flex h-[30px] items-center justify-between w-full pr-[15px]"
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      <div className="flex items-center gap-[16px]">
        <p className="font-['Lato:Bold',sans-serif] leading-[normal] text-[17px] whitespace-nowrap"
           style={{ color: disabled ? '#D9D9D9' : '#1C2C42' }}>
          {label}
        </p>
        <InfoIconWithOverlay color={disabled ? '#D9D9D9' : undefined} header={infoHeader || label} title={infoTitle || ''} />
      </div>
      <svg width="7" height="13" viewBox="0 0 7 13" fill="none" className="shrink-0">
        <path d="M1.92753 0.349745C1.50716 -0.116582 0.82549 -0.116582 0.405113 0.349745C-0.0151913 0.816064 -0.0152062 1.57198 0.405113 2.03828L4.38238 6.45L0.315234 10.9617C-0.10508 11.428 -0.105076 12.1839 0.315234 12.6503C0.735611 13.1166 1.41728 13.1166 1.83766 12.6503L6.4969 7.48173C6.5635 7.43513 6.62678 7.37992 6.68481 7.31555C7.10508 6.84926 7.10505 6.09333 6.68481 5.62701L1.92753 0.349745Z" fill={disabled ? '#D9D9D9' : '#939393'} />
      </svg>
    </button>
  );
}

function SectionSubtitle({ text }: { text: string }) {
  return (
    <div className="flex h-[10px] items-center w-full">
      <p className="font-['Lato:SemiBold',sans-serif] text-[14px] text-[#939393] leading-[normal]">{text}</p>
    </div>
  );
}

function KeyLine() {
  return <div className="w-full h-px bg-[#E4E4E4] shrink-0" />;
}

function DevToolsPasswordPage({ onBack, onClose, passwordRequired, onPasswordRequiredChange }: { onBack: () => void; onClose: () => void; passwordRequired: boolean; onPasswordRequiredChange: (value: boolean) => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <PageShell title="Dev tools password" onBack={onBack} onClose={onClose}>
      <SectionSubtitle text="Settings" />
      <ToggleRow label="Password required" isOn={passwordRequired} onToggle={() => onPasswordRequiredChange(!passwordRequired)} infoTitle="When enabled, the Dev Tools login screen requires the correct password before granting access. When disabled, the Log-in button unlocks Dev Tools without any password. The current password is shown below this toggle when enabled." />
      {passwordRequired && (
        <div className="flex h-[10px] items-center w-full">
          <p className="font-['Lato:SemiBold',sans-serif] text-[14px] text-[#939393] leading-[normal]">Current password: {DEV_TOOLS_PASSWORD}</p>
        </div>
      )}
      <KeyLine />
      <SectionSubtitle text="Password reset" />
      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
        <div className="w-[85px] shrink-0">
          <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic relative shrink-0 text-[#1C2C42] text-[17px] whitespace-nowrap">Password</p>
        </div>
        <div className="content-stretch flex items-center px-[20px] relative rounded-[100px] flex-1 min-w-0 h-[50px] group">
          <div aria-hidden="true" className="absolute border border-[#BABABA] group-focus-within:border-[#939393] border-solid inset-0 pointer-events-none rounded-[100px]" />
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password..."
            className="flex-1 self-center h-auto bg-transparent outline-none font-['Lato:SemiBold',sans-serif] not-italic text-[16px] text-[#1C2C42] placeholder:text-[#C9C9C9] focus:placeholder:text-transparent placeholder-lato-semibold leading-[26px]"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-[20px] top-0 bottom-0 my-auto h-[15.5px] w-[21.5px] cursor-pointer flex items-center justify-center"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.5 15.5">
              <g>
                <path clipRule="evenodd" d={loginSvgPaths.p11ad9280} fill={showNewPassword ? "#1C2C42" : "#C9C9C9"} fillRule="evenodd" />
                <path clipRule="evenodd" d={loginSvgPaths.pb9ed400} fill={showNewPassword ? "#1C2C42" : "#C9C9C9"} fillRule="evenodd" />
              </g>
            </svg>
          </button>
        </div>
      </div>
      <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
        <div className="w-[85px] shrink-0">
          <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic relative shrink-0 text-[#1C2C42] text-[17px] whitespace-nowrap">Confirm</p>
        </div>
        <div className="content-stretch flex items-center px-[20px] relative rounded-[100px] flex-1 min-w-0 h-[50px] group">
          <div aria-hidden="true" className="absolute border border-[#BABABA] group-focus-within:border-[#939393] border-solid inset-0 pointer-events-none rounded-[100px]" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Password..."
            className="flex-1 self-center h-auto bg-transparent outline-none font-['Lato:SemiBold',sans-serif] not-italic text-[16px] text-[#1C2C42] placeholder:text-[#C9C9C9] focus:placeholder:text-transparent placeholder-lato-semibold leading-[26px]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-[20px] top-0 bottom-0 my-auto h-[15.5px] w-[21.5px] cursor-pointer flex items-center justify-center"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.5 15.5">
              <g>
                <path clipRule="evenodd" d={loginSvgPaths.p11ad9280} fill={showConfirmPassword ? "#1C2C42" : "#C9C9C9"} fillRule="evenodd" />
                <path clipRule="evenodd" d={loginSvgPaths.pb9ed400} fill={showConfirmPassword ? "#1C2C42" : "#C9C9C9"} fillRule="evenodd" />
              </g>
            </svg>
          </button>
        </div>
      </div>
      <div className="bg-[#4784f8] h-[50px] relative rounded-[100px] shrink-0 w-full cursor-pointer">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
              <p className="leading-[normal]">Reset</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

const HAPTIC_ACTION_LABELS: { action: HapticAction; label: string; info: string }[] = [
  { action: 'markDone', label: 'Mark reminder done', info: 'Fires haptic feedback when a reminder is marked as completed.' },
  { action: 'createReminder', label: 'Create new reminder', info: 'Fires haptic feedback when a new reminder is created.' },
  { action: 'markListComplete', label: 'Mark list complete', info: 'Fires haptic feedback when an entire list is marked as done.' },
  { action: 'deleteReminder', label: 'Delete reminder', info: 'Fires haptic feedback when a reminder is deleted.' },
  { action: 'deleteListItem', label: 'Delete list item', info: 'Fires haptic feedback when a list item is deleted.' },
  { action: 'clearAllDoneDeleted', label: 'Clear all done/deleted', info: 'Fires haptic feedback when all done or deleted items are cleared.' },
  { action: 'uncompleteReminder', label: 'Uncomplete reminder', info: 'Fires haptic feedback when a completed reminder is restored to active.' },
  { action: 'undeleteReminder', label: 'Undelete reminder', info: 'Fires haptic feedback when a deleted reminder is restored.' },
  { action: 'undoListCompletion', label: 'Undo list completion', info: 'Fires haptic feedback when a completed list is restored to active.' },
  { action: 'toggleListItemCheckbox', label: 'Toggle list item checkbox', info: 'Fires haptic feedback when a list item checkbox is toggled.' },
  { action: 'swipeRevealDelete', label: 'Swipe to reveal delete', info: 'Fires haptic feedback when swiping a list item reveals the delete button.' },
];

function HapticsPage({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [config, setConfig] = useState<HapticsConfig>(getHapticsConfig);

  const update = (next: HapticsConfig) => {
    setConfig(next);
    setHapticsConfig(next);
  };

  return (
    <PageShell title="Haptics" onBack={onBack} onClose={onClose}>
      <SectionSubtitle text="Master" />
      <ToggleRow label="All haptics" isOn={config.allHaptics} onToggle={() => update({ ...config, allHaptics: !config.allHaptics })} infoTitle="Global toggle for all haptic feedback. When off, no vibration feedback fires for any action. Individual action settings are preserved and restored when this is turned back on." />
      <KeyLine />
      <SectionSubtitle text="Actions" />
      {HAPTIC_ACTION_LABELS.map(({ action, label, info }) => (
        <ToggleRow key={action} label={label} isOn={config[action]} onToggle={() => update({ ...config, [action]: !config[action] })} disabled={!config.allHaptics} infoTitle={info} />
      ))}
    </PageShell>
  );
}

function SystemPage({ onBack, onClose, siriShortcutsEnabled, onSiriShortcutsEnabledChange, settingsMenuEnabled, onSettingsMenuEnabledChange, onNavigateDevToolsPassword, onNavigateHaptics }: { onBack: () => void; onClose: () => void; siriShortcutsEnabled: boolean; onSiriShortcutsEnabledChange: (value: boolean) => void; settingsMenuEnabled: boolean; onSettingsMenuEnabledChange: (value: boolean) => void; onNavigateDevToolsPassword: () => void; onNavigateHaptics: () => void }) {
  return (
    <PageShell title="System" onBack={onBack} onClose={onClose}>
      <SectionSubtitle text="Features" />
      <ToggleRow label="Siri shortcuts" isOn={siriShortcutsEnabled} onToggle={() => onSiriShortcutsEnabledChange(!siriShortcutsEnabled)} infoTitle="Controls whether Siri shortcut integration is available in the app. When enabled, users can trigger reminder actions via Siri voice commands and the Shortcuts app. This is an app-wide feature toggle independent of other Dev Tools settings." />
      <ToggleRow label="Settings menu" isOn={settingsMenuEnabled} onToggle={() => onSettingsMenuEnabledChange(!settingsMenuEnabled)} infoTitle="When enabled, the Reminders tab shows a Settings button in the filter row in place of Sometime, and the Later filter includes Sometime reminders in the Later colour. When disabled, the Sometime filter is shown and the Settings button is hidden. Reminder data is not changed." />
      <KeyLine />
      <SectionSubtitle text="Settings" />
      <MenuRow label="Dev tools password" onClick={onNavigateDevToolsPassword} infoTitle="Opens the Dev Tools Password page where you can enable or disable the login password requirement, view the current password, and reset the password. Changes here affect the Dev Tools login screen shown on every open." />
      <MenuRow label="Haptics" onClick={onNavigateHaptics} infoTitle="Opens the Haptics settings page. Haptics control vibration feedback for app actions like completing reminders, deleting items, and toggling checkboxes. Each action can be enabled or disabled individually, or all haptics can be turned off globally." />
    </PageShell>
  );
}

function NaturalLanguagePage({ onBack, onClose, nlcEnabled, onNlcEnabledChange, nlcMode, onNlcModeChange, recognition, onRecognitionChange }: { onBack: () => void; onClose: () => void; nlcEnabled: boolean; onNlcEnabledChange: (enabled: boolean) => void; nlcMode: NlcMode; onNlcModeChange: (mode: NlcMode) => void; recognition: NlcRecognitionConfig; onRecognitionChange: (config: NlcRecognitionConfig) => void }) {
  const [pendingNlcState, setPendingNlcState] = useState<boolean | null>(null);

  return (
    <>
    <div className="flex flex-col h-full relative w-full" data-name="natural-language-page">
      <PageShell title="Natural Language" onBack={onBack} onClose={onClose}>
        <ToggleRow label="Enable Natural Language Capture" isOn={nlcEnabled} onToggle={() => setPendingNlcState(!nlcEnabled)} infoTitle="Master toggle for the NLC system. When enabled, the app can automatically detect dates, times, and repeat patterns as the user types a reminder. Disabling this turns off all NLC sub-features below and reverts to manual-only scheduling." />
        <KeyLine />
        <SectionSubtitle text="Features" />
        <ToggleRow label="Date recognition" isOn={recognition.date} onToggle={() => onRecognitionChange({ ...recognition, date: !recognition.date })} disabled={!nlcEnabled} infoTitle="Allows NLC to detect and parse date references like 'tomorrow', 'next Friday', or 'March 5th' from reminder text. Parsed dates are applied to the reminder's schedule automatically. Requires Enable Natural Language Capture to be on." />
        <ToggleRow label="Time recognition" isOn={recognition.time} onToggle={() => onRecognitionChange({ ...recognition, time: !recognition.time })} disabled={!nlcEnabled} infoTitle="Allows NLC to detect and parse time references like 'at 3pm' or 'in the morning' from reminder text. Parsed times are applied to the reminder's schedule automatically. Requires Enable Natural Language Capture to be on." />
        <ToggleRow label="Repeats recognition" isOn={recognition.repeats} onToggle={() => onRecognitionChange({ ...recognition, repeats: !recognition.repeats })} disabled={!nlcEnabled} infoTitle="Allows NLC to detect and parse repeat patterns like 'every Monday' or 'daily' from reminder text. Parsed patterns are applied as repeat rules on the reminder. Requires Enable Natural Language Capture to be on." />
        <ToggleRow label="Phone number recognition" isOn={false} onToggle={() => {}} disabled infoTitle="Planned feature: will allow NLC to detect phone numbers in reminder text and offer quick-dial actions. Not yet implemented — this toggle is reserved for a future release. Currently locked in the disabled state." />
        <ToggleRow label="Contact recognition" isOn={false} onToggle={() => {}} disabled infoTitle="Planned feature: will allow NLC to detect contact names in reminder text and link them to address book entries. Not yet implemented — this toggle is reserved for a future release. Currently locked in the disabled state." />
        <KeyLine />
        <SectionSubtitle text="Settings" />
        <ToggleRow label="Auto-parsing" isOn={nlcMode === 'auto'} onToggle={() => onNlcModeChange('auto')} disabled={!nlcEnabled} infoTitle="NLC parses the reminder text in real time as the user types. Dates, times, and repeats are detected and applied immediately without user action. Only one parsing mode can be active. Requires Enable Natural Language Capture to be on." />
        <ToggleRow label="Click-parsing" isOn={nlcMode === 'click'} onToggle={() => onNlcModeChange('click')} disabled={!nlcEnabled} infoTitle="NLC only parses the reminder text when the user explicitly triggers it by tapping the parse button. Gives the user full control over when detection runs. Only one parsing mode can be active. Requires Enable Natural Language Capture to be on." />
      </PageShell>
    </div>
      {pendingNlcState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingNlcState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div
              className="bg-white relative flex flex-col gap-[35px] items-center py-[40px] px-[34px] rounded-[32px] pointer-events-auto"
              style={{ width: 322 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingNlcState
                    ? 'Turn on NLC?'
                    : 'Turn off NLC?'}
                </p>
              </div>
              <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingNlcState
                    ? 'Dates and times will be recognised automatically as you type. Existing reminders remain unchanged until edited.'
                    : 'Reminders will be saved exactly as typed. Dates and times will only be set manually.'}
                </p>
              </div>
              <div className="flex gap-[16px] w-full justify-between">
                <button
                  onClick={() => setPendingNlcState(null)}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#BABABA' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Cancel</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onNlcEnabledChange(pendingNlcState);
                    setPendingNlcState(null);
                  }}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#4784F8' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">
                        {pendingNlcState ? 'Yes, turn on' : 'Yes, turn off'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function OnboardingPage({ onBack, onClose, isOnboardingTutorialEnabled, onOnboardingTutorialEnabledChange, showTutorialOnFirstLaunch, onShowTutorialOnFirstLaunchChange, showTutorialOnEveryStart, onShowTutorialOnEveryStartChange }: { onBack: () => void; onClose: () => void; isOnboardingTutorialEnabled: boolean; onOnboardingTutorialEnabledChange: (next: boolean) => void; showTutorialOnFirstLaunch: boolean; onShowTutorialOnFirstLaunchChange: (value: boolean) => void; showTutorialOnEveryStart: boolean; onShowTutorialOnEveryStartChange: (value: boolean) => void }) {
  const [pendingOnboardingState, setPendingOnboardingState] = useState<boolean | null>(null);

  return (
    <>
    <div className="flex flex-col h-full relative w-full" data-name="onboarding-page">
      <PageShell title="Onboarding" onBack={onBack} onClose={onClose}>
        <ToggleRow label="Enable onboarding" isOn={isOnboardingTutorialEnabled} onToggle={() => setPendingOnboardingState(!isOnboardingTutorialEnabled)} infoTitle="Master toggle for the onboarding tutorial system. When enabled, the tutorial is accessible from the Settings menu and can be shown to users on first launch or every app start. Disabling this hides the tutorial from Settings and prevents all automatic display." />
        <KeyLine />
        <SectionSubtitle text="Settings" />
        <ToggleRow label="Show tutorial on first launch" isOn={showTutorialOnFirstLaunch} onToggle={() => { const next = !showTutorialOnFirstLaunch; onShowTutorialOnFirstLaunchChange(next); if (next) onShowTutorialOnEveryStartChange(false); }} disabled={!isOnboardingTutorialEnabled} infoTitle="Shows the onboarding tutorial automatically the first time a user opens the app. Enabling this disables 'Show tutorial on every app start' — only one launch trigger can be active. Requires Enable onboarding to be on." />
        <ToggleRow label="Show tutorial on every app start" isOn={showTutorialOnEveryStart} onToggle={() => { const next = !showTutorialOnEveryStart; onShowTutorialOnEveryStartChange(next); if (next) onShowTutorialOnFirstLaunchChange(false); }} disabled={!isOnboardingTutorialEnabled} infoTitle="Shows the onboarding tutorial every time the app is opened, regardless of whether the user has seen it before. Enabling this disables 'Show tutorial on first launch' — only one launch trigger can be active. Requires Enable onboarding to be on." />
      </PageShell>
    </div>
      {pendingOnboardingState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingOnboardingState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div
              className="bg-white relative flex flex-col gap-[35px] items-center py-[40px] px-[34px] rounded-[32px] pointer-events-auto"
              style={{ width: 322 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingOnboardingState
                    ? 'Turn on onboarding tutorial?'
                    : 'Turn off onboarding tutorial?'}
                </p>
              </div>
              <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingOnboardingState
                    ? 'The onboarding tutorial will be accessible from Settings and shown to new users on first launch.'
                    : 'The onboarding tutorial will be hidden from Settings and will not be shown to new users.'}
                </p>
              </div>
              <div className="flex gap-[16px] w-full justify-between">
                <button
                  onClick={() => setPendingOnboardingState(null)}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#BABABA' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Cancel</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onOnboardingTutorialEnabledChange(pendingOnboardingState);
                    setPendingOnboardingState(null);
                  }}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#4784F8' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">
                        {pendingOnboardingState ? 'Yes, turn on' : 'Yes, turn off'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NotificationsAreaPage({ onBack, onClose, enableNotifications, onEnableNotificationsChange, reminderAlerts, onReminderAlertsChange, appBadge, onAppBadgeChange, includeTodayInBadge, onIncludeTodayInBadgeChange }: { onBack: () => void; onClose: () => void; enableNotifications: boolean; onEnableNotificationsChange: (value: boolean) => void; reminderAlerts: boolean; onReminderAlertsChange: (value: boolean) => void; appBadge: boolean; onAppBadgeChange: (value: boolean) => void; includeTodayInBadge: boolean; onIncludeTodayInBadgeChange: (value: boolean) => void }) {
  const [pendingNotificationsState, setPendingNotificationsState] = useState<boolean | null>(null);

  return (
    <>
    <PageShell title="Notifications" onBack={onBack} onClose={onClose}>
      <ToggleRow label="Enable notifications" isOn={enableNotifications} onToggle={() => setPendingNotificationsState(!enableNotifications)} infoTitle="Master toggle for the notifications system. When enabled, the app can send system notifications and display an app badge count. Disabling this turns off all notification sub-features below including system alerts, app badge, and badge count settings." />
      <KeyLine />
      <SectionSubtitle text="Features" />
      <ToggleRow label="Reminder system notifications" isOn={reminderAlerts} onToggle={() => onReminderAlertsChange(!reminderAlerts)} disabled={!enableNotifications} infoTitle="Controls whether the app sends native iOS system notifications when a reminder is due. Notifications appear as banners, alerts, and in the notification centre. Requires Enable notifications to be on." />
      <ToggleRow label="Reminder app badge notifications" isOn={appBadge} onToggle={() => onAppBadgeChange(!appBadge)} disabled={!enableNotifications} infoTitle="Controls whether the app displays a numeric badge on the app icon showing how many reminders need attention. The badge count reflects overdue reminders by default. Requires Enable notifications to be on." />
      <KeyLine />
      <SectionSubtitle text="Settings" />
      <ToggleRow label="Include today in app badge count" isOn={appBadge && includeTodayInBadge} onToggle={() => onIncludeTodayInBadgeChange(!includeTodayInBadge)} disabled={!enableNotifications || !appBadge} infoTitle="When enabled, reminders due today are included in the app icon badge count alongside overdue reminders. When disabled, only overdue reminders contribute to the badge number. Requires both Enable notifications and App badge to be on." />
    </PageShell>
      {pendingNotificationsState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingNotificationsState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div
              className="bg-white relative flex flex-col gap-[35px] items-center py-[40px] px-[34px] rounded-[32px] pointer-events-auto"
              style={{ width: 322 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingNotificationsState
                    ? 'Turn on notifications?'
                    : 'Turn off notifications?'}
                </p>
              </div>
              <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingNotificationsState
                    ? 'The Notifications feature will be enabled, turning on access to system notifications, app badge, and badge count settings.'
                    : 'The Notifications feature will be disabled, turning off access to system notifications, app badge, and badge count settings.'}
                </p>
              </div>
              <div className="flex gap-[16px] w-full justify-between">
                <button
                  onClick={() => setPendingNotificationsState(null)}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#BABABA' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Cancel</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onEnableNotificationsChange(pendingNotificationsState);
                    setPendingNotificationsState(null);
                  }}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#4784F8' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">
                        {pendingNotificationsState ? 'Yes, turn on' : 'Yes, turn off'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function TestingPage({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<RunReport | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleRunChecks = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setReport(null);
    setCopyStatus('idle');
    try {
      const result = await runChecks(() => {
        const scheduleChecks = getScheduleChecks().map(c => ({ ...c, name: `[Schedule and reminder logic] ${c.name}` }));
        const reminderChecks = getReminderChecks().map(c => ({ ...c, name: `[Persistence and hydration] ${c.name}` }));
        const nlcParserChecks = getNlcParserChecks().map(c => ({ ...c, name: `[Natural language parsing] ${c.name}` }));
        const nlcInteractionChecks = getNlcInteractionChecks().map(c => ({ ...c, name: `[Natural language interaction] ${c.name}` }));
        const doneDeletedChecks = getDoneDeletedChecks().map(c => ({ ...c, name: `[Done, deleted, and completion] ${c.name}` }));
        const completionChecks = getCompletionChecks().map(c => ({ ...c, name: `[Done, deleted, and completion] ${c.name}` }));
        const listChecks = getListChecks().map(c => ({ ...c, name: `[Lists and smart reminders] ${c.name}` }));
        const devToolsChecks = getDevToolsChecks().map(c => ({ ...c, name: `[Dev tools and feature flags] ${c.name}` }));
        const notificationChecks = getNotificationChecks().map(c => ({ ...c, name: `[Notification and badge] ${c.name}` }));
        return [...scheduleChecks, ...reminderChecks, ...nlcParserChecks, ...nlcInteractionChecks, ...doneDeletedChecks, ...completionChecks, ...listChecks, ...devToolsChecks, ...notificationChecks];
      });
      setReport(result);
    } catch (error) {
      console.error('Failed to run checks:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyResults = () => {
    if (!report || !textAreaRef.current) return;
    try {
      textAreaRef.current.select();
      document.execCommand('copy');
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleReset = () => {
    setReport(null);
    setCopyStatus('idle');
  };

  return (
    <PageShell title="Testing" onBack={onBack} onClose={onClose}>
      <div className="flex flex-col gap-[12px] shrink-0">
        <div className="flex gap-[12px]">
          <button
            onClick={handleRunChecks}
            disabled={isRunning}
            className="bg-[#4784f8] text-white font-['Lato',sans-serif] font-bold text-[14px] px-[20px] py-[10px] rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run self-checks'}
          </button>
          <button
            onClick={handleCopyResults}
            disabled={!report}
            className="bg-[#4784f8] text-white font-['Lato',sans-serif] font-bold text-[14px] px-[20px] py-[10px] rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copyStatus === 'copied' ? 'Copied!' : 'Copy results'}
          </button>
          <button
            onClick={handleReset}
            disabled={!report}
            className="bg-[#6b7280] text-white font-['Lato',sans-serif] font-bold text-[14px] px-[20px] py-[10px] rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>
      {report && (
        <div className="flex flex-col gap-[8px] flex-1 min-h-0">
          <div className="font-['Lato',sans-serif] text-[14px] text-[#1C2C42] shrink-0">
            <span className="font-bold">Run invocation id: {report.runId}</span>
            {' | '}
            <span className="font-bold">Passed: {report.passCount}</span>
            {' | '}
            <span className="font-bold">Failed: {report.failCount}</span>
            {' | '}
            <span className="font-bold">Duration: {report.durationMs}ms</span>
          </div>
          <div className="flex flex-col gap-[4px] flex-1 overflow-y-auto min-h-0">
            {(() => {
              const grouped = groupResultsBySection(report.results);
              if (grouped.hasAnySections) {
                return grouped.sections.map((section) => (
                  <div key={section.sectionName || 'unsectioned'} className="flex flex-col gap-[4px]">
                    {section.sectionName !== '' && (
                      <div className="font-['Lato',sans-serif] text-[14px] text-[#1C2C42] font-bold mt-[8px] mb-[4px]">
                        {section.sectionName}
                      </div>
                    )}
                    {section.results.map((result) => (
                      <div
                        key={result.id}
                        className={`flex flex-col gap-[4px] p-[8px] rounded-[4px] ${
                          result.passed ? 'bg-[#e8f5e9]' : 'bg-[#ffebee]'
                        }`}
                      >
                        <div className="flex items-center gap-[8px]">
                          <span className="font-['Lato',sans-serif] text-[16px]">
                            {result.passed ? '✓' : '✗'}
                          </span>
                          <span className="font-['Lato',sans-serif] text-[14px] text-[#1C2C42]">
                            {result.name.replace(/^\[.+?\] /, '')}
                          </span>
                        </div>
                        {result.error && (
                          <div className="font-['Lato',sans-serif] text-[12px] text-[#c62828] ml-[24px]">
                            {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              } else {
                return report.results.map((result) => (
                  <div
                    key={result.id}
                    className={`flex flex-col gap-[4px] p-[8px] rounded-[4px] ${
                      result.passed ? 'bg-[#e8f5e9]' : 'bg-[#ffebee]'
                    }`}
                  >
                    <div className="flex items-center gap-[8px]">
                      <span className="font-['Lato',sans-serif] text-[16px]">
                        {result.passed ? '✓' : '✗'}
                      </span>
                      <span className="font-['Lato',sans-serif] text-[14px] text-[#1C2C42]">
                        {result.name}
                      </span>
                    </div>
                    {result.error && (
                      <div className="font-['Lato',sans-serif] text-[12px] text-[#c62828] ml-[24px]">
                        {result.error}
                      </div>
                    )}
                  </div>
                ));
              }
            })()}
          </div>
          <textarea
            ref={textAreaRef}
            value={formatReportAsText(report)}
            readOnly
            className="absolute opacity-0 pointer-events-none"
            style={{ top: -9999, left: -9999 }}
            aria-hidden="true"
          />
        </div>
      )}
    </PageShell>
  );
}

function RemindersPage({ onBack, onClose, enableReminders, onEnableRemindersChange, useOneMinuteIncrements, onUseOneMinuteIncrementsChange, onNavigateDummyReminders }: { onBack: () => void; onClose: () => void; enableReminders: boolean; onEnableRemindersChange: (value: boolean) => void; useOneMinuteIncrements: boolean; onUseOneMinuteIncrementsChange: (value: boolean) => void; onNavigateDummyReminders: () => void }) {
  const [repeatToggle, setRepeatToggle] = useState(true);
  const [pendingRemindersState, setPendingRemindersState] = useState<boolean | null>(null);

  return (
    <>
    <div className="flex flex-col h-full relative w-full" data-name="reminders-page">
      <PageShell title="Reminders" onBack={onBack} onClose={onClose}>
        <ToggleRow label="Enable reminders" isOn={enableReminders} onToggle={() => setPendingRemindersState(!enableReminders)} infoTitle="Master toggle for the reminders feature. Controls access to repeat reminders, time increment settings, and the dummy reminders page. Disabling this restricts all reminder sub-features and settings on this page." />
        <KeyLine />
        <SectionSubtitle text="Features" />
        <ToggleRow label="Repeat reminders" isOn={repeatToggle} onToggle={() => setRepeatToggle(prev => !prev)} disabled={!enableReminders} infoTitle="Controls whether reminders can have repeat rules (e.g. daily, weekly, monthly). When disabled, the repeat option is hidden from the reminder creation and edit flows. Requires Enable reminders to be on." />
        <KeyLine />
        <SectionSubtitle text="Settings" />
        <ToggleRow label="Display 1 minute time increments" isOn={useOneMinuteIncrements} onToggle={() => onUseOneMinuteIncrementsChange(!useOneMinuteIncrements)} disabled={!enableReminders} infoTitle="Changes the time picker to show one-minute intervals instead of the default five-minute intervals. Affects the time picker in both the new reminder and edit reminder flows. Requires Enable reminders to be on." />
        <KeyLine />
        <MenuRow label="Dummy reminders" onClick={onNavigateDummyReminders} disabled={!enableReminders} infoTitle="Opens the Dummy Reminders page where you can generate test reminders across all time categories (overdue, today, this week, later, sometime, done), configure repeat flags, and clear all reminders. Requires Enable reminders to be on." />
      </PageShell>
    </div>
      {pendingRemindersState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingRemindersState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div
              className="bg-white relative flex flex-col gap-[35px] items-center py-[40px] px-[34px] rounded-[32px] pointer-events-auto"
              style={{ width: 322 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingRemindersState
                    ? 'Turn on reminders?'
                    : 'Turn off reminders?'}
                </p>
              </div>
              <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingRemindersState
                    ? 'The Reminders feature will be enabled, turning on access to repeat reminders, time increments, and dummy reminders.'
                    : 'The Reminders feature will be disabled, turning off access to repeat reminders, time increments, and dummy reminders.'}
                </p>
              </div>
              <div className="flex gap-[16px] w-full justify-between">
                <button
                  onClick={() => setPendingRemindersState(null)}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#BABABA' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Cancel</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onEnableRemindersChange(pendingRemindersState);
                    setPendingRemindersState(null);
                  }}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#4784F8' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">
                        {pendingRemindersState ? 'Yes, turn on' : 'Yes, turn off'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ListsAreaPage({ onBack, onClose, isListsEnabled, onListsEnabledChange, smartRemindersEnabled, onSmartRemindersEnabledChange, savedListsEnabled, onSavedListsEnabledChange, pinnedListsEnabled, onPinnedListsEnabledChange, useDefaultTemplatesInCleanState, onUseDefaultTemplatesInCleanStateChange, onNavigateDummyLists }: { onBack: () => void; onClose: () => void; isListsEnabled: boolean; onListsEnabledChange: (enabled: boolean) => void; smartRemindersEnabled: boolean; onSmartRemindersEnabledChange: (value: boolean) => void; savedListsEnabled: boolean; onSavedListsEnabledChange: (value: boolean) => void; pinnedListsEnabled: boolean; onPinnedListsEnabledChange: (value: boolean) => void; useDefaultTemplatesInCleanState: boolean; onUseDefaultTemplatesInCleanStateChange: (value: boolean) => void; onNavigateDummyLists: () => void }) {
  const [pendingListsState, setPendingListsState] = useState<boolean | null>(null);

  return (
    <>
    <div className="flex flex-col h-full relative w-full" data-name="lists-area-page">
      <PageShell title="Lists" onBack={onBack} onClose={onClose}>
        <ToggleRow label="Enable lists" isOn={isListsEnabled} onToggle={() => setPendingListsState(!isListsEnabled)} infoTitle="Master toggle for the lists feature. Controls access to smart reminders, list templates, pinned lists, and the dummy lists page. Disabling this restricts all list sub-features. Also forces the filters menu to use the Standard layout." />
        <KeyLine />
        <SectionSubtitle text="Features" />
        <ToggleRow label="Smart reminders" isOn={smartRemindersEnabled} onToggle={() => onSmartRemindersEnabledChange(!smartRemindersEnabled)} disabled={!isListsEnabled} infoTitle="Allows reminders to be linked to a list, turning them into smart reminders that track list item progress. Smart reminders display a completion count (e.g. '3 of 5 items'). Requires Enable lists to be on." />
        <ToggleRow label="List templates" isOn={savedListsEnabled} onToggle={() => onSavedListsEnabledChange(!savedListsEnabled)} disabled={!isListsEnabled} infoTitle="Enables saved list templates that users can create and reuse. Templates appear in the list creation flow and can be pre-populated with default items. Also unlocks the 'Use default template set' setting below. Requires Enable lists to be on." />
        <ToggleRow label="Pinned lists" isOn={pinnedListsEnabled} onToggle={() => onPinnedListsEnabledChange(!pinnedListsEnabled)} disabled={!isListsEnabled} infoTitle="Allows users to pin frequently used lists for quick access. Pinned lists appear in a dedicated section above other lists in the lists view. Requires Enable lists to be on." />
        <KeyLine />
        <SectionSubtitle text="Settings" />
        <ToggleRow label="Use template set in clean state" isOn={useDefaultTemplatesInCleanState} onToggle={() => onUseDefaultTemplatesInCleanStateChange(!useDefaultTemplatesInCleanState)} disabled={!isListsEnabled || !savedListsEnabled} infoTitle="When all lists are cleared, the app automatically restores the default set of list templates instead of showing an empty state. Only applies when list templates are enabled. Requires both Enable lists and List templates to be on." />
        <KeyLine />
        <MenuRow label="Dummy lists" onClick={onNavigateDummyLists} disabled={!isListsEnabled} infoTitle="Opens the Dummy Lists page where you can generate test lists with configurable item counts, choose to include done items, smart reminder lists, and saved list templates, then clear or regenerate. Requires Enable lists to be on." />
      </PageShell>
    </div>
      {pendingListsState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingListsState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div
              className="bg-white relative flex flex-col gap-[35px] items-center py-[40px] px-[34px] rounded-[32px] pointer-events-auto"
              style={{ width: 322 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingListsState
                    ? 'Turn on Lists?'
                    : 'Turn off Lists?'}
                </p>
              </div>
              <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingListsState
                    ? 'The Lists feature will be enabled, allowing full access to all features.'
                    : 'The Lists feature will be disabled, restricting access to certain features.'}
                </p>
              </div>
              <div className="flex gap-[16px] w-full justify-between">
                <button
                  onClick={() => setPendingListsState(null)}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#BABABA' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">Cancel</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onListsEnabledChange(pendingListsState);
                    setPendingListsState(null);
                  }}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#4784F8' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">
                        {pendingListsState ? 'Yes, turn on' : 'Yes, turn off'}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function LoginScreen({ onUnlock, passwordRequired }: { onUnlock: () => void; passwordRequired: boolean }) {
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [revealVisible, setRevealVisible] = useState(false);
  const [revealFading, setRevealFading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRevealTimers = () => {
    if (revealTimerRef.current !== null) { clearTimeout(revealTimerRef.current); revealTimerRef.current = null; }
    if (fadeTimerRef.current !== null) { clearTimeout(fadeTimerRef.current); fadeTimerRef.current = null; }
  };

  useEffect(() => {
    return () => { clearRevealTimers(); };
  }, []);

  useEffect(() => {
    if (password !== 'GILBURN' && revealVisible) {
      clearRevealTimers();
      setRevealVisible(false);
      setRevealFading(false);
    }
  }, [password, revealVisible]);

  const handleSubmit = () => {
    if (password === 'GILBURN') {
      clearRevealTimers();
      setRevealVisible(true);
      setRevealFading(false);
      revealTimerRef.current = setTimeout(() => {
        setRevealFading(true);
        fadeTimerRef.current = setTimeout(() => {
          setRevealVisible(false);
          setRevealFading(false);
          setPassword('');
        }, 300);
      }, 2700);
    }
    if (!passwordRequired) {
      onUnlock();
      return;
    }
    if (password === DEV_TOOLS_PASSWORD) {
      onUnlock();
    } else {
      if (password !== 'GILBURN') {
        setShowError(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePasswordPointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    if (document.activeElement === passwordInputRef.current) return;
    event.preventDefault();
    passwordInputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[60px] items-center pt-[80px] relative size-full">
          {/* Logo and title */}
          <div className="content-stretch flex flex-col gap-[29px] items-center relative shrink-0">
            <div className="relative shrink-0 size-[50px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50 50">
                <g>
                  <path d={loginSvgPaths.p340e8d80} fill="var(--fill-0, #4784F8)" />
                  <g>
                    <path d={loginSvgPaths.p3f8c3b80} fill="var(--fill-0, #4784F8)" />
                    <path d={loginSvgPaths.p1babae00} fill="var(--fill-0, #4784F8)" />
                  </g>
                </g>
              </svg>
            </div>
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[22px] text-center whitespace-nowrap">
              <p className="leading-[normal]">Log-in to Reminderly</p>
            </div>
          </div>

          {/* Password input, button, error */}
          <div className="content-stretch flex flex-col gap-[30px] items-center relative shrink-0 w-full">
            {/* Password input */}
            <div className="h-[60px] relative rounded-[100px] shrink-0 w-full group">
              <div aria-hidden="true" className="absolute border border-[#BABABA] group-focus-within:border-[#939393] border-solid inset-0 pointer-events-none rounded-[100px]" />
              <div className="flex items-center justify-center px-[30px] relative size-full">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setShowError(false); }}
                  onKeyDown={handleKeyDown}
                  onPointerDown={handlePasswordPointerDown}
                  placeholder="Password..."
                  className="flex-1 bg-transparent outline-none font-['Lato:Bold',sans-serif] not-italic text-[20px] text-[#1C2C42] placeholder:text-[#C9C9C9] focus:placeholder:text-transparent placeholder-lato-semibold text-center leading-[26px]"
                />
                {/* Eye icon - toggles password visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[30px] top-0 bottom-0 my-auto h-[15.5px] w-[21.5px] cursor-pointer flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg className="block w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.5 15.5">
                    <g>
                      <path clipRule="evenodd" d={loginSvgPaths.p11ad9280} fill={showPassword ? "#1C2C42" : "#C9C9C9"} fillRule="evenodd" />
                      <path clipRule="evenodd" d={loginSvgPaths.pb9ed400} fill={showPassword ? "#1C2C42" : "#C9C9C9"} fillRule="evenodd" />
                    </g>
                  </svg>
                </button>
              </div>
            </div>

            {/* Log-in button */}
            <button
              onClick={handleSubmit}
              disabled={passwordRequired && password.length === 0}
              className={`content-stretch flex gap-[16px] h-[60px] items-center justify-center px-[30px] py-[22px] relative rounded-[100px] shrink-0 w-full ${(passwordRequired && password.length === 0) ? 'bg-[#939393] cursor-default' : 'bg-[#4784f8] cursor-pointer'}`}
            >
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white whitespace-nowrap">
                <p className="leading-[normal]">Log-in</p>
              </div>
            </button>

            {/* Revealed password */}
            {revealVisible && (
              <div
                className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-[#1C2C42] text-center whitespace-nowrap"
                style={{ opacity: revealFading ? 0 : 1, transition: revealFading ? 'opacity 300ms ease' : 'none' }}
              >
                <p className="leading-[normal]">{DEV_TOOLS_PASSWORD}</p>
              </div>
            )}

            {/* Error message */}
            {showError && (
              <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-[red] text-center whitespace-nowrap">
                <p className="leading-[normal]">That password doesn't look right?</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DevToolsContent({ onClose, onClearReminders, addReminder, addReminders, nlcMode, onNlcModeChange, nlcEnabled, onNlcEnabledChange, nlcRecognition, onNlcRecognitionChange, hideOverdue, onHideOverdueChange, isOnboardingTutorialEnabled, onOnboardingTutorialEnabledChange, isListsEnabled, onListsEnabledChange, showTutorialOnFirstLaunch, onShowTutorialOnFirstLaunchChange, showTutorialOnEveryStart, onShowTutorialOnEveryStartChange, isDevToolsUnlocked, onDevToolsUnlock, isDevToolsPasswordRequired, onDevToolsPasswordRequiredChange, useOneMinuteIncrements, onUseOneMinuteIncrementsChange, smartRemindersEnabled, onSmartRemindersEnabledChange, savedListsEnabled, onSavedListsEnabledChange, pinnedListsEnabled, onPinnedListsEnabledChange, settingsMenuEnabled, onSettingsMenuEnabledChange, notifReminderAlerts, onNotifReminderAlertsChange, notifAppBadge, onNotifAppBadgeChange, notifIncludeTodayInBadge, onNotifIncludeTodayInBadgeChange, siriShortcutsEnabled, onSiriShortcutsEnabledChange, useDefaultTemplatesInCleanState, onUseDefaultTemplatesInCleanStateChange, onClearLists, onGenerateLists }: { onClose: () => void; onClearReminders: () => void; addReminder: (reminder: Reminder) => void; addReminders: (reminders: Reminder[]) => void; nlcMode: NlcMode; onNlcModeChange: (mode: NlcMode) => void; nlcEnabled: boolean; onNlcEnabledChange: (enabled: boolean) => void; nlcRecognition: NlcRecognitionConfig; onNlcRecognitionChange: (config: NlcRecognitionConfig) => void; hideOverdue: boolean; onHideOverdueChange: (value: boolean) => void; isOnboardingTutorialEnabled: boolean; onOnboardingTutorialEnabledChange: (next: boolean) => void; isListsEnabled: boolean; onListsEnabledChange: (enabled: boolean) => void; showTutorialOnFirstLaunch: boolean; onShowTutorialOnFirstLaunchChange: (value: boolean) => void; showTutorialOnEveryStart: boolean; onShowTutorialOnEveryStartChange: (value: boolean) => void; isDevToolsUnlocked: boolean; onDevToolsUnlock: () => void; isDevToolsPasswordRequired: boolean; onDevToolsPasswordRequiredChange: (value: boolean) => void; useOneMinuteIncrements: boolean; onUseOneMinuteIncrementsChange: (value: boolean) => void; smartRemindersEnabled: boolean; onSmartRemindersEnabledChange: (value: boolean) => void; savedListsEnabled: boolean; onSavedListsEnabledChange: (value: boolean) => void; pinnedListsEnabled: boolean; onPinnedListsEnabledChange: (value: boolean) => void; settingsMenuEnabled: boolean; onSettingsMenuEnabledChange: (value: boolean) => void; notifReminderAlerts: boolean; onNotifReminderAlertsChange: (value: boolean) => void; notifAppBadge: boolean; onNotifAppBadgeChange: (value: boolean) => void; notifIncludeTodayInBadge: boolean; onNotifIncludeTodayInBadgeChange: (value: boolean) => void; siriShortcutsEnabled: boolean; onSiriShortcutsEnabledChange: (value: boolean) => void; useDefaultTemplatesInCleanState: boolean; onUseDefaultTemplatesInCleanStateChange: (value: boolean) => void; onClearLists: (useDefaultTemplatesInCleanState: boolean) => void; onGenerateLists: (payload: GeneratedDummyListsPayload) => void }) {
  const [page, setPage] = useState<DevToolsPage>('home');
  const [enableReminders, setEnableReminders] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  let content;
  if (!isDevToolsUnlocked) {
    content = (
      <div className="flex flex-col items-start pt-[30px] px-[30px] pb-[30px] relative w-full flex-1 min-h-0">
        <LoginScreen onUnlock={onDevToolsUnlock} passwordRequired={isDevToolsPasswordRequired} />
      </div>
    );
  } else if (page === 'home') {
    content = (
      <DevToolsHome
        onClose={onClose}
        onNavigateReminders={() => setPage('reminders')}
        onNavigateLists={() => setPage('lists')}
        onNavigateNlc={() => setPage('natural-language')}
        onNavigateNotifications={() => setPage('notifications-area')}
        onNavigateOnboarding={() => setPage('onboarding')}
        onNavigateTesting={() => setPage('testing')}
        onNavigateSystem={() => setPage('system')}
        enableReminders={enableReminders}
        onEnableRemindersChange={setEnableReminders}
        enableLists={isListsEnabled}
        onEnableListsChange={onListsEnabledChange}
        enableNlc={nlcEnabled}
        onEnableNlcChange={onNlcEnabledChange}
        enableNotifications={enableNotifications}
        onEnableNotificationsChange={setEnableNotifications}
        enableOnboarding={isOnboardingTutorialEnabled}
        onEnableOnboardingChange={onOnboardingTutorialEnabledChange}
      />
    );
  } else if (page === 'testing') {
    content = (
      <TestingPage onBack={() => setPage('home')} onClose={onClose} />
    );
  } else if (page === 'reminders') {
    content = (
      <RemindersPage onBack={() => setPage('home')} onClose={onClose} enableReminders={enableReminders} onEnableRemindersChange={setEnableReminders} useOneMinuteIncrements={useOneMinuteIncrements} onUseOneMinuteIncrementsChange={onUseOneMinuteIncrementsChange} onNavigateDummyReminders={() => setPage('dummy-reminders')} />
    );
  } else if (page === 'dummy-reminders') {
    content = (
      <DummyRemindersPage onBack={() => setPage('reminders')} onClose={onClose} addReminders={addReminders} hideOverdue={hideOverdue} onHideOverdueChange={onHideOverdueChange} onClearReminders={onClearReminders} />
    );
  } else if (page === 'lists') {
    content = (
      <ListsAreaPage onBack={() => setPage('home')} onClose={onClose} isListsEnabled={isListsEnabled} onListsEnabledChange={onListsEnabledChange} smartRemindersEnabled={smartRemindersEnabled} onSmartRemindersEnabledChange={onSmartRemindersEnabledChange} savedListsEnabled={savedListsEnabled} onSavedListsEnabledChange={onSavedListsEnabledChange} pinnedListsEnabled={pinnedListsEnabled} onPinnedListsEnabledChange={onPinnedListsEnabledChange} useDefaultTemplatesInCleanState={useDefaultTemplatesInCleanState} onUseDefaultTemplatesInCleanStateChange={onUseDefaultTemplatesInCleanStateChange} onNavigateDummyLists={() => setPage('dummy-lists')} />
    );
  } else if (page === 'dummy-lists') {
    content = (
      <DummyListsPage onBack={() => setPage('lists')} onClose={onClose} onClearLists={() => onClearLists(useDefaultTemplatesInCleanState)} onGenerateLists={onGenerateLists} />
    );
  } else if (page === 'natural-language') {
    content = (
      <NaturalLanguagePage onBack={() => setPage('home')} onClose={onClose} nlcEnabled={nlcEnabled} onNlcEnabledChange={onNlcEnabledChange} nlcMode={nlcMode} onNlcModeChange={onNlcModeChange} recognition={nlcRecognition} onRecognitionChange={onNlcRecognitionChange} />
    );
  } else if (page === 'onboarding') {
    content = (
      <OnboardingPage onBack={() => setPage('home')} onClose={onClose} isOnboardingTutorialEnabled={isOnboardingTutorialEnabled} onOnboardingTutorialEnabledChange={onOnboardingTutorialEnabledChange} showTutorialOnFirstLaunch={showTutorialOnFirstLaunch} onShowTutorialOnFirstLaunchChange={onShowTutorialOnFirstLaunchChange} showTutorialOnEveryStart={showTutorialOnEveryStart} onShowTutorialOnEveryStartChange={onShowTutorialOnEveryStartChange} />
    );
  } else if (page === 'system') {
    content = (
      <SystemPage onBack={() => setPage('home')} onClose={onClose} siriShortcutsEnabled={siriShortcutsEnabled} onSiriShortcutsEnabledChange={onSiriShortcutsEnabledChange} settingsMenuEnabled={settingsMenuEnabled} onSettingsMenuEnabledChange={onSettingsMenuEnabledChange} onNavigateDevToolsPassword={() => setPage('dev-tools-password')} onNavigateHaptics={() => setPage('haptics')} />
    );
  } else if (page === 'dev-tools-password') {
    content = (
      <DevToolsPasswordPage onBack={() => setPage('system')} onClose={onClose} passwordRequired={isDevToolsPasswordRequired} onPasswordRequiredChange={onDevToolsPasswordRequiredChange} />
    );
  } else if (page === 'haptics') {
    content = (
      <HapticsPage onBack={() => setPage('system')} onClose={onClose} />
    );
  } else if (page === 'notifications-area') {
    content = (
      <NotificationsAreaPage onBack={() => setPage('home')} onClose={onClose} enableNotifications={enableNotifications} onEnableNotificationsChange={setEnableNotifications} reminderAlerts={notifReminderAlerts} onReminderAlertsChange={onNotifReminderAlertsChange} appBadge={notifAppBadge} onAppBadgeChange={onNotifAppBadgeChange} includeTodayInBadge={notifIncludeTodayInBadge} onIncludeTodayInBadgeChange={onNotifIncludeTodayInBadgeChange} />
    );
  }

  return (
    <div className="flex flex-col h-full relative w-full max-w-[768px]" data-name="dev-tools-content">
      {content}
    </div>
  );
}

export default function DevToolsOverlay({ onClose, onClearReminders, addReminder, addReminders, nlcMode, onNlcModeChange, nlcEnabled, onNlcEnabledChange, nlcRecognition, onNlcRecognitionChange, hideOverdue, onHideOverdueChange, isOnboardingTutorialEnabled, onOnboardingTutorialEnabledChange, isListsEnabled, onListsEnabledChange, showTutorialOnFirstLaunch, onShowTutorialOnFirstLaunchChange, showTutorialOnEveryStart, onShowTutorialOnEveryStartChange, isDevToolsUnlocked, onDevToolsUnlock, isDevToolsPasswordRequired, onDevToolsPasswordRequiredChange, useOneMinuteIncrements, onUseOneMinuteIncrementsChange, smartRemindersEnabled, onSmartRemindersEnabledChange, savedListsEnabled, onSavedListsEnabledChange, pinnedListsEnabled, onPinnedListsEnabledChange, settingsMenuEnabled, onSettingsMenuEnabledChange, notifReminderAlerts, onNotifReminderAlertsChange, notifAppBadge, onNotifAppBadgeChange, notifIncludeTodayInBadge, onNotifIncludeTodayInBadgeChange, siriShortcutsEnabled, onSiriShortcutsEnabledChange, useDefaultTemplatesInCleanState, onUseDefaultTemplatesInCleanStateChange, onClearLists, onGenerateLists }: { onClose: () => void; onClearReminders: () => void; addReminder: (reminder: Reminder) => void; addReminders: (reminders: Reminder[]) => void; nlcMode: NlcMode; onNlcModeChange: (mode: NlcMode) => void; nlcEnabled: boolean; onNlcEnabledChange: (enabled: boolean) => void; nlcRecognition: NlcRecognitionConfig; onNlcRecognitionChange: (config: NlcRecognitionConfig) => void; hideOverdue: boolean; onHideOverdueChange: (value: boolean) => void; isOnboardingTutorialEnabled: boolean; onOnboardingTutorialEnabledChange: (next: boolean) => void; isListsEnabled: boolean; onListsEnabledChange: (enabled: boolean) => void; showTutorialOnFirstLaunch: boolean; onShowTutorialOnFirstLaunchChange: (value: boolean) => void; showTutorialOnEveryStart: boolean; onShowTutorialOnEveryStartChange: (value: boolean) => void; isDevToolsUnlocked: boolean; onDevToolsUnlock: () => void; isDevToolsPasswordRequired: boolean; onDevToolsPasswordRequiredChange: (value: boolean) => void; useOneMinuteIncrements: boolean; onUseOneMinuteIncrementsChange: (value: boolean) => void; smartRemindersEnabled: boolean; onSmartRemindersEnabledChange: (value: boolean) => void; savedListsEnabled: boolean; onSavedListsEnabledChange: (value: boolean) => void; pinnedListsEnabled: boolean; onPinnedListsEnabledChange: (value: boolean) => void; settingsMenuEnabled: boolean; onSettingsMenuEnabledChange: (value: boolean) => void; notifReminderAlerts: boolean; onNotifReminderAlertsChange: (value: boolean) => void; notifAppBadge: boolean; onNotifAppBadgeChange: (value: boolean) => void; notifIncludeTodayInBadge: boolean; onNotifIncludeTodayInBadgeChange: (value: boolean) => void; siriShortcutsEnabled: boolean; onSiriShortcutsEnabledChange: (value: boolean) => void; useDefaultTemplatesInCleanState: boolean; onUseDefaultTemplatesInCleanStateChange: (value: boolean) => void; onClearLists: (useDefaultTemplatesInCleanState: boolean) => void; onGenerateLists: (payload: GeneratedDummyListsPayload) => void }) {
  return (
    <div className="bg-white content-stretch flex flex-col items-center relative rounded-tl-[20px] rounded-tr-[20px] size-full" data-name="dev-tools-overlay">
      <DevToolsContent onClose={onClose} onClearReminders={onClearReminders} addReminder={addReminder} addReminders={addReminders} nlcMode={nlcMode} onNlcModeChange={onNlcModeChange} nlcEnabled={nlcEnabled} onNlcEnabledChange={onNlcEnabledChange} nlcRecognition={nlcRecognition} onNlcRecognitionChange={onNlcRecognitionChange} hideOverdue={hideOverdue} onHideOverdueChange={onHideOverdueChange} isOnboardingTutorialEnabled={isOnboardingTutorialEnabled} onOnboardingTutorialEnabledChange={onOnboardingTutorialEnabledChange} isListsEnabled={isListsEnabled} onListsEnabledChange={onListsEnabledChange} showTutorialOnFirstLaunch={showTutorialOnFirstLaunch} onShowTutorialOnFirstLaunchChange={onShowTutorialOnFirstLaunchChange} showTutorialOnEveryStart={showTutorialOnEveryStart} onShowTutorialOnEveryStartChange={onShowTutorialOnEveryStartChange} isDevToolsUnlocked={isDevToolsUnlocked} onDevToolsUnlock={onDevToolsUnlock} isDevToolsPasswordRequired={isDevToolsPasswordRequired} onDevToolsPasswordRequiredChange={onDevToolsPasswordRequiredChange} useOneMinuteIncrements={useOneMinuteIncrements} onUseOneMinuteIncrementsChange={onUseOneMinuteIncrementsChange} smartRemindersEnabled={smartRemindersEnabled} onSmartRemindersEnabledChange={onSmartRemindersEnabledChange} savedListsEnabled={savedListsEnabled} onSavedListsEnabledChange={onSavedListsEnabledChange} pinnedListsEnabled={pinnedListsEnabled} onPinnedListsEnabledChange={onPinnedListsEnabledChange} settingsMenuEnabled={settingsMenuEnabled} onSettingsMenuEnabledChange={onSettingsMenuEnabledChange} notifReminderAlerts={notifReminderAlerts} onNotifReminderAlertsChange={onNotifReminderAlertsChange} notifAppBadge={notifAppBadge} onNotifAppBadgeChange={onNotifAppBadgeChange} notifIncludeTodayInBadge={notifIncludeTodayInBadge} onNotifIncludeTodayInBadgeChange={onNotifIncludeTodayInBadgeChange} siriShortcutsEnabled={siriShortcutsEnabled} onSiriShortcutsEnabledChange={onSiriShortcutsEnabledChange} useDefaultTemplatesInCleanState={useDefaultTemplatesInCleanState} onUseDefaultTemplatesInCleanStateChange={onUseDefaultTemplatesInCleanStateChange} onClearLists={onClearLists} onGenerateLists={onGenerateLists} />
    </div>
  );
}
