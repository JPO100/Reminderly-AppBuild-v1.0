import { useState, useRef, useEffect, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { canChangeModuleFlag } from "../settings/resolver";
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
import { getSettingsChecks } from "../dev/settings-checks";
import { getAttachmentChecks } from "../dev/attachment-checks";
import type { Check } from "../dev/check-system";
import type { GeneratedDummyListsPayload, GeneratedList } from "../utils/dummy-list-generator";
import DevToolsHome, { LastModuleNotice } from "../../imports/DevTools";
import DummyRemindersPage from "../../imports/DummyReminders";
import DummyListsPage from "../../imports/DummyLists";
import type { Reminder } from "../reminder-utils";
import type { NlcMode } from "../utils/nlc-interaction";
import type { NlcRecognitionConfig } from "../utils/nlc-parser";
import svgPathsGear from "../../imports/svg-rl6qtmr1a6";
import svgPathsHex from "../../imports/svg-8hjr6ht2yw";
import loginSvgPaths from "../../imports/svg-xgk7qm25s1";
import passwordPageSvgPaths from "../../imports/svg-y29dfn20l5";
import passwordResetSvgPaths from "../../imports/svg-p8ebad7jx7";

const DEV_TOOLS_PASSWORD = '123';

type DevToolsPage = 'home' | 'dummy-reminders' | 'dummy-lists' | 'dev-tools-password' | 'system' | 'natural-language' | 'onboarding' | 'testing' | 'reminders' | 'lists' | 'siri' | 'config' | 'testing-tools';

// Dev tools look: #F7F7F7 page with 20px side and 24px top margins, a 45px header, and white cards
// (6px corners) 24px apart. Card rows are 60px with 20px side padding and a full-width 1px #F7F7F7 line between rows.
function DevCircleButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="relative shrink-0 p-0 m-0 border-none bg-transparent flex items-center justify-center cursor-pointer size-[45px]">
      <svg className="block shrink-0" width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
        {children}
      </svg>
    </button>
  );
}

function DevRobotIcon() {
  return (
    <svg className="block shrink-0" width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M31.25 27.5V25C31.25 21.4645 31.25 19.6967 30.1517 18.5983C29.0533 17.5 27.2855 17.5 23.75 17.5H21.25C17.7145 17.5 15.9467 17.5 14.8483 18.5983C13.75 19.6967 13.75 21.4645 13.75 25V27.5C13.75 31.0355 13.75 32.8033 14.8483 33.9017C15.9467 35 17.7145 35 21.25 35H23.75C27.2855 35 29.0533 35 30.1517 33.9017C31.25 32.8033 31.25 31.0355 31.25 27.5Z" stroke="#141B34" strokeWidth="1.875" strokeLinejoin="round"/>
      <path d="M31.25 30C33.0178 30 33.9017 30 34.4508 29.4508C35 28.9017 35 28.0178 35 26.25C35 24.4822 35 23.5983 34.4508 23.0492C33.9017 22.5 33.0178 22.5 31.25 22.5" stroke="#141B34" strokeWidth="1.875" strokeLinejoin="round"/>
      <path d="M13.75 30C11.9822 30 11.0983 30 10.5492 29.4508C10 28.9017 10 28.0178 10 26.25C10 24.4822 10 23.5983 10.5492 23.0492C11.0983 22.5 11.9822 22.5 13.75 22.5" stroke="#141B34" strokeWidth="1.875" strokeLinejoin="round"/>
      <path d="M24.375 11.875C24.375 12.9105 23.5355 13.75 22.5 13.75C21.4645 13.75 20.625 12.9105 20.625 11.875C20.625 10.8395 21.4645 10 22.5 10C23.5355 10 24.375 10.8395 24.375 11.875Z" stroke="#141B34" strokeWidth="1.875"/>
      <path d="M22.5 13.75V17.5" stroke="#141B34" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.75 23.75V25" stroke="#141B34" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.25 23.75V25" stroke="#141B34" strokeWidth="1.875" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 29.375C20 29.375 20.8333 30 22.5 30C24.1667 30 25 29.375 25 29.375" stroke="#141B34" strokeWidth="1.875" strokeLinecap="round"/>
    </svg>
  );
}

// Header: robot on the home page, back button on sub-pages; title centred; close on the right.
export function DevHeader({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return (
    <div className="relative flex items-center justify-between shrink-0 w-full h-[45px]" data-name="header">
      {onBack ? (
        <DevCircleButton onClick={onBack} label="Back">
          <path d="M24.4037 14.9305C24.9124 14.3565 25.7373 14.3565 26.246 14.9305C26.7546 15.5044 26.7546 16.4347 26.246 17.0087L21.4332 22.4385L26.3548 27.9913C26.8634 28.5653 26.8634 29.4956 26.3548 30.0695C25.8461 30.6435 25.0212 30.6435 24.5125 30.0695L18.8744 23.7083C18.7938 23.6509 18.7172 23.583 18.647 23.5038C18.1385 22.9299 18.1385 21.9995 18.647 21.4256L24.4037 14.9305Z" fill="white"/>
        </DevCircleButton>
      ) : (
        <DevRobotIcon />
      )}
      <p className="absolute left-1/2 -translate-x-1/2 font-['Lato:Bold',sans-serif] text-[20px] text-[#1C2C42] leading-[normal] whitespace-nowrap pointer-events-none">{title}</p>
      <DevCircleButton onClick={onClose} label="Close dev tools">
        <path d="M16.8425 28.1565L28.1562 16.8428" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M16.8425 16.8435L28.1562 28.1572" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </DevCircleButton>
    </div>
  );
}

// Page: header stays put, cards scroll beneath it. No background of its own: the panel supplies the grey and the
// 15px top corners (iOS paints clipped corners black over scrolling content, so nothing here may cover them).
export function DevPage({ title, onBack, onClose, children }: { title: string; onBack?: () => void; onClose: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[24px] items-start pt-[24px] px-[20px] relative w-full flex-1 min-h-0">
      <DevHeader title={title} onBack={onBack} onClose={onClose} />
      <div className="flex flex-col gap-[24px] items-start w-full flex-1 min-h-0 overflow-y-auto pb-[24px]">
        {children}
      </div>
    </div>
  );
}

function PageShell({ title, onBack, onClose, children }: { title: string; onBack: () => void; onClose: () => void; children: ReactNode }) {
  return <DevPage title={title} onBack={onBack} onClose={onClose}>{children}</DevPage>;
}

// Card: 20px top and bottom (5px card padding plus each row's own 15px). Optional 20px title with 15px above and below.
export function DevCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-[6px] py-[5px] w-full shrink-0 flex flex-col">
      {title && <p className="px-[20px] pt-[15px] pb-[15px] font-['Lato:Bold',sans-serif] text-[20px] text-[#1C2C42] leading-[20px]">{title}</p>}
      <div className="flex flex-col w-full divide-y divide-[#F7F7F7]">{children}</div>
    </div>
  );
}

// Free content inside a card (inputs, buttons, results), with the card's row padding.
export function DevCardBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-[20px] px-[20px] py-[15px] w-full">{children}</div>;
}

function DevToggle({ isOn, onToggle, disabled }: { isOn: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (!disabled) onToggle(); }}
      className={`flex h-[30px] items-center p-[3.75px] rounded-[37.5px] shrink-0 w-[56px] transition-colors ${disabled ? 'bg-[#D9D9D9] justify-start' : (isOn ? 'bg-[#4784f8] justify-end' : 'bg-[#C9C9C9] justify-start')}`}
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      <div className="relative shrink-0 size-[22.5px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
          <circle cx="11.25" cy="11.25" fill="white" r="11.25" />
        </svg>
      </div>
    </button>
  );
}

function DevChevron({ muted }: { muted?: boolean }) {
  return (
    <svg width="7" height="13" viewBox="0 0 7 13" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M1.92753 0.349745C1.50716 -0.116582 0.82549 -0.116582 0.405113 0.349745C-0.0151913 0.816064 -0.0152062 1.57198 0.405113 2.03828L4.38238 6.45L0.315234 10.9617C-0.10508 11.428 -0.105076 12.1839 0.315234 12.6503C0.735611 13.1166 1.41728 13.1166 1.83766 12.6503L6.4969 7.48173C6.5635 7.43513 6.62678 7.37992 6.68481 7.31555C7.10508 6.84926 7.10505 6.09333 6.68481 5.62701L1.92753 0.349745Z" fill={muted ? '#D9D9D9' : '#939393'} />
    </svg>
  );
}

const devRowLabelClass = "flex-1 min-w-0 text-left font-['Lato:Bold',sans-serif] leading-[20px] text-[17px]";

// Toggle on the left of the label; info icon on the right.
export function DevToggleRow({ label, isOn, onToggle, disabled, infoHeader, infoTitle }: { label: string; isOn: boolean; onToggle: () => void; disabled?: boolean; infoHeader?: string; infoTitle?: string }) {
  return (
    <div className="flex h-[60px] items-center gap-[20px] px-[20px] w-full">
      <DevToggle isOn={isOn} onToggle={onToggle} disabled={disabled} />
      <p className={devRowLabelClass} style={{ color: disabled ? '#D9D9D9' : (isOn ? '#1C2C42' : '#C9C9C9') }}>{label}</p>
      {infoTitle && <InfoIconWithOverlay color={disabled || !isOn ? '#D9D9D9' : undefined} header={infoHeader || label} title={infoTitle} />}
    </div>
  );
}

// Home page feature rows: the toggle switches the feature, the rest of the row opens its page.
export function DevNavToggleRow({ label, isOn, onToggle, onClick }: { label: string; isOn: boolean; onToggle: () => void; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-[60px] items-center gap-[20px] px-[20px] w-full cursor-pointer">
      <DevToggle isOn={isOn} onToggle={onToggle} />
      <p className={devRowLabelClass} style={{ color: isOn ? '#1C2C42' : '#D9D9D9' }}>{label}</p>
      <DevChevron muted={!isOn} />
    </button>
  );
}

// Click-through row: label on the left, info icon and chevron on the right.
export function DevMenuRow({ label, onClick, disabled, infoHeader, infoTitle }: { label: string; onClick: () => void; disabled?: boolean; infoHeader?: string; infoTitle?: string }) {
  return (
    <button type="button" onClick={() => { if (!disabled) onClick(); }} className="flex h-[60px] items-center gap-[16px] px-[20px] w-full" style={{ cursor: disabled ? 'default' : 'pointer' }}>
      <p className={devRowLabelClass} style={{ color: disabled ? '#D9D9D9' : '#1C2C42' }}>{label}</p>
      {infoTitle && <InfoIconWithOverlay color={disabled ? '#D9D9D9' : undefined} header={infoHeader || label} title={infoTitle} />}
      <DevChevron muted={disabled} />
    </button>
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
        <div
          className="bg-white relative flex flex-col gap-[40px] items-center pt-[40px] pb-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card outline-none"
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

// Info icons always show in Dev tools. In the user-facing settings panels they follow the Dev tools > System
// "Show info icons" toggle (default off), provided around those panels in App. All infoTitle copy is kept.
export const ShowInfoIconsContext = createContext(true);

export function InfoIconWithOverlay({ color, header, title }: { color?: string; header: string; title: string }) {
  const [showInfo, setShowInfo] = useState(false);
  const showInfoIcons = useContext(ShowInfoIconsContext);
  if (!showInfoIcons) return null;
  return (
    <>
      <span onClick={(e) => { e.stopPropagation(); setShowInfo(true); }} className="shrink-0 cursor-pointer">
        <InfoIcon color={color} />
      </span>
      <DevToolsInfoOverlay visible={showInfo} onClose={() => setShowInfo(false)} header={header} title={title} />
    </>
  );
}

export function ToggleRow({ label, isOn, onToggle, disabled, infoHeader, infoTitle }: { label: string; isOn: boolean; onToggle: () => void; disabled?: boolean; infoHeader?: string; infoTitle?: string }) {
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

export function MenuRow({ label, onClick, disabled, infoHeader, infoTitle }: { label: string; onClick: () => void; disabled?: boolean; infoHeader?: string; infoTitle?: string }) {
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

export function SectionSubtitle({ text }: { text: string }) {
  return (
    <div className="flex h-[10px] items-center w-full">
      <p className="font-['Lato:SemiBold',sans-serif] text-[14px] text-[#939393] leading-[normal]">{text}</p>
    </div>
  );
}

export function KeyLine() {
  return <div className="w-full h-px bg-[#E4E4E4] shrink-0" />;
}

function DevToolsPasswordPage({ onBack, onClose, passwordRequired, onPasswordRequiredChange }: { onBack: () => void; onClose: () => void; passwordRequired: boolean; onPasswordRequiredChange: (value: boolean) => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <PageShell title="Dev tools password" onBack={onBack} onClose={onClose}>
      <DevCard title="Settings">
      <DevToggleRow label="Password required" isOn={passwordRequired} onToggle={() => onPasswordRequiredChange(!passwordRequired)} infoTitle="When enabled, the Dev Tools login screen requires the correct password before granting access. When disabled, the Log-in button unlocks Dev Tools without any password. The current password is shown below this toggle when enabled." />
      {passwordRequired && (
        <div className="flex h-[60px] items-center px-[20px] w-full">
          <p className="font-['Lato:SemiBold',sans-serif] text-[14px] text-[#939393] leading-[normal]">Current password: {DEV_TOOLS_PASSWORD}</p>
        </div>
      )}
      </DevCard>
      <DevCard title="Password reset">
      <DevCardBody>
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
      </DevCardBody>
      </DevCard>
    </PageShell>
  );
}

function SystemPage({ onBack, onClose, hapticsFlag, onHapticsFlagChange, soundsFlag, onSoundsFlagChange, lockScreenWidgetFlag, onLockScreenWidgetFlagChange, siriShortcutsEnabled, onSiriShortcutsEnabledChange, settingsMenuEnabled, onSettingsMenuEnabledChange, showInfoIcons, onShowInfoIconsChange, onNavigateDevToolsPassword, onNavigateHaptics }: { onBack: () => void; onClose: () => void; hapticsFlag: boolean; onHapticsFlagChange: (value: boolean) => void; soundsFlag: boolean; onSoundsFlagChange: (value: boolean) => void; lockScreenWidgetFlag: boolean; onLockScreenWidgetFlagChange: (value: boolean) => void; siriShortcutsEnabled: boolean; onSiriShortcutsEnabledChange: (value: boolean) => void; settingsMenuEnabled: boolean; onSettingsMenuEnabledChange: (value: boolean) => void; showInfoIcons: boolean; onShowInfoIconsChange: (value: boolean) => void; onNavigateDevToolsPassword: () => void; onNavigateHaptics: () => void }) {
  return (
    <PageShell title="System" onBack={onBack} onClose={onClose}>
      <DevCard title="Features">
      <DevToggleRow label="Settings menu" isOn={settingsMenuEnabled} onToggle={() => onSettingsMenuEnabledChange(!settingsMenuEnabled)} infoTitle="When enabled, the Reminders tab shows a Settings button in the filter row in place of Sometime, and the Later filter includes Sometime reminders in the Later colour. When disabled, the Sometime filter is shown and the Settings button is hidden. Reminder data is not changed." />
      <DevToggleRow label="Haptics" isOn={hapticsFlag} onToggle={() => onHapticsFlagChange(!hapticsFlag)} infoTitle="Controls whether haptic feedback is available. When off, no haptics fire and the Haptic feedback rows are hidden from Reminders and Lists settings. The user's own haptic choices are kept." />
      <DevToggleRow label="Sounds" isOn={soundsFlag} onToggle={() => onSoundsFlagChange(!soundsFlag)} infoTitle="Controls whether click sounds are available. When off, no sounds play and the Sounds rows are hidden from Reminders and Lists settings. The user's own sound choices are kept." />
      <DevToggleRow label="Lock screen widget" isOn={lockScreenWidgetFlag} onToggle={() => onLockScreenWidgetFlagChange(!lockScreenWidgetFlag)} infoTitle="Controls the Reminderly lock screen widget. When off, no reminder data is shared with the widget and any shared data is cleared, so an installed widget shows an empty state. Reminders are not affected. On by default." />
      <DevToggleRow label="Show info icons" isOn={showInfoIcons} onToggle={() => onShowInfoIconsChange(!showInfoIcons)} infoTitle="Shows the info icons next to rows in the Reminders and Lists settings panels. Tapping an icon opens a short description of the setting. Dev Tools info icons are always shown. Off by default." />
      </DevCard>
    </PageShell>
  );
}

function NaturalLanguagePage({ onBack, onClose, nlcEnabled, onNlcEnabledChange, nlcMode, onNlcModeChange, recognition, onRecognitionChange }: { onBack: () => void; onClose: () => void; nlcEnabled: boolean; onNlcEnabledChange: (enabled: boolean) => void; nlcMode: NlcMode; onNlcModeChange: (mode: NlcMode) => void; recognition: NlcRecognitionConfig; onRecognitionChange: (config: NlcRecognitionConfig) => void }) {
  const [pendingNlcState, setPendingNlcState] = useState<boolean | null>(null);

  return (
    <>
    <div className="flex flex-col h-full relative w-full" data-name="natural-language-page">
      <PageShell title="Natural Language" onBack={onBack} onClose={onClose}>
        <DevCard>
        <DevToggleRow label="Enable Natural Language Capture" isOn={nlcEnabled} onToggle={() => setPendingNlcState(!nlcEnabled)} infoTitle="Master toggle for the NLC system. When enabled, the app can automatically detect dates, times, and repeat patterns as the user types a reminder. Disabling this turns off all NLC sub-features below and reverts to manual-only scheduling." />
        </DevCard>
      </PageShell>
    </div>
      {pendingNlcState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingNlcState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
            <div
              className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
              style={{ width: 340 }}
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
              <div className="flex gap-[30px] w-full justify-between">
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
        <DevCard>
        <DevToggleRow label="Enable onboarding" isOn={isOnboardingTutorialEnabled} onToggle={() => setPendingOnboardingState(!isOnboardingTutorialEnabled)} infoTitle="Master toggle for the onboarding tutorial system. When enabled, the tutorial is accessible from the Settings menu and can be shown to users on first launch or every app start. Disabling this hides the tutorial from Settings and prevents all automatic display." />
        </DevCard>
        <DevCard title="Settings">
        <DevToggleRow label="Show tutorial on first launch" isOn={showTutorialOnFirstLaunch} onToggle={() => { const next = !showTutorialOnFirstLaunch; onShowTutorialOnFirstLaunchChange(next); if (next) onShowTutorialOnEveryStartChange(false); }} disabled={!isOnboardingTutorialEnabled} infoTitle="Shows the onboarding tutorial automatically the first time a user opens the app. Enabling this turns off 'Show tutorial on every app start' in Testing tools. Only one launch trigger can be active. Requires Onboarding to be on." />
        </DevCard>
      </PageShell>
    </div>
      {pendingOnboardingState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingOnboardingState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
            <div
              className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
              style={{ width: 340 }}
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
              <div className="flex gap-[30px] w-full justify-between">
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
        const settingsChecks = getSettingsChecks().map(c => ({ ...c, name: `[Settings foundation] ${c.name}` }));
        const attachmentChecks = getAttachmentChecks().map(c => ({ ...c, name: `[Reminder attachments] ${c.name}` }));
        return [...scheduleChecks, ...reminderChecks, ...nlcParserChecks, ...nlcInteractionChecks, ...doneDeletedChecks, ...completionChecks, ...listChecks, ...devToolsChecks, ...notificationChecks, ...settingsChecks, ...attachmentChecks];
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
    <PageShell title="Self checks" onBack={onBack} onClose={onClose}>
      <DevCard>
      <DevCardBody>
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
      </DevCardBody>
      </DevCard>
      {report && (
        <DevCard>
        <DevCardBody>
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
        </DevCardBody>
        </DevCard>
      )}
    </PageShell>
  );
}

function RemindersPage({ onBack, onClose, enableReminders, onEnableRemindersChange, isListsEnabled, notificationsFlag, setNotificationsFlag, repeatToggle, setRepeatToggle, oneMinuteFlag, setOneMinuteFlag, calendarFlag, setCalendarFlag, attachmentsFlag, setAttachmentsFlag, datePresetsFlag, setDatePresetsFlag }: { onBack: () => void; onClose: () => void; enableReminders: boolean; onEnableRemindersChange: (value: boolean) => void; isListsEnabled: boolean; notificationsFlag: boolean; setNotificationsFlag: (value: boolean) => void; repeatToggle: boolean; setRepeatToggle: (value: boolean) => void; oneMinuteFlag: boolean; setOneMinuteFlag: (value: boolean) => void; calendarFlag: boolean; setCalendarFlag: (value: boolean) => void; attachmentsFlag: boolean; setAttachmentsFlag: (value: boolean) => void; datePresetsFlag: boolean; setDatePresetsFlag: (value: boolean) => void }) {
  const isLastModule = enableReminders && !isListsEnabled;
  const [showLastModuleNotice, setShowLastModuleNotice] = useState(false);
  const [pendingRemindersState, setPendingRemindersState] = useState<boolean | null>(null);

  return (
    <>
    <div className="flex flex-col h-full relative w-full" data-name="reminders-page">
      <PageShell title="Reminders" onBack={onBack} onClose={onClose}>
        <DevCard>
        <DevToggleRow label="Enable reminders" isOn={enableReminders} onToggle={() => { if (isLastModule) setShowLastModuleNotice(true); else setPendingRemindersState(!enableReminders); }} infoTitle="Master availability flag for Reminders. When off, the app shows Lists only, reminder notifications are cancelled and the badge cleared. Reminder data and preferences are kept and return when turned back on. Reminders and Lists cannot both be off: while Lists is off, tapping this explains why." />
        </DevCard>
        <DevCard title="Features">
        <DevToggleRow label="Notifications" isOn={notificationsFlag} onToggle={() => setNotificationsFlag(!notificationsFlag)} disabled={!enableReminders} infoTitle="Controls whether reminder notifications are available to users. The user chooses alerts, sound and the app badge in Reminders settings > Notifications. When off, pending notifications are cancelled, the badge clears and the user setting is hidden. The user's choices are kept. Requires Enable reminders to be on." />
        <DevToggleRow label="Repeat reminders" isOn={repeatToggle} onToggle={() => setRepeatToggle(!repeatToggle)} disabled={!enableReminders} infoTitle="Controls whether reminders can have repeat rules (e.g. daily, weekly, monthly). When disabled, the repeat option is hidden from the reminder creation and edit flows. Requires Enable reminders to be on." />
        <DevToggleRow label="1 minute time increments" isOn={oneMinuteFlag} onToggle={() => setOneMinuteFlag(!oneMinuteFlag)} disabled={!enableReminders} infoTitle="Controls whether the 1 minute time increments setting is available to users. The user's own choice is a user preference (Testing tools > User preferences until it moves to Reminders settings). Hides the user setting and uses 5 minute steps when off. The user's choice is kept." />
        <DevToggleRow label="Calendar" isOn={calendarFlag} onToggle={() => setCalendarFlag(!calendarFlag)} disabled={!enableReminders} infoTitle="Controls whether the calendar view is available to users. The user turns it on in Reminders settings > Show calendar. Hides the user setting and the calendar when off. The user's choice is kept. Requires Enable reminders to be on." />
        <DevToggleRow label="Reminder attachments" isOn={attachmentsFlag} onToggle={() => setAttachmentsFlag(!attachmentsFlag)} disabled={!enableReminders} infoTitle="Controls whether users can attach a file or image to reminders. When on, the paperclip shows in the new and edit reminder panel and the attachment indicator shows on reminders. Existing attachments are kept but hidden when off. Requires Enable reminders to be on." />
        <DevToggleRow label="Date presets" isOn={datePresetsFlag} onToggle={() => setDatePresetsFlag(!datePresetsFlag)} disabled={!enableReminders} infoTitle="Controls whether the date preset pills (Tomorrow, Tonight, Next week) are available in the new and edit reminder panel. The user turns them off in Reminders settings > Show date presets. Hides the user setting and the pills when off. The user's choice is kept. Requires Enable reminders to be on." />
        </DevCard>
      </PageShell>
    </div>
      {showLastModuleNotice && <LastModuleNotice onClose={() => setShowLastModuleNotice(false)} />}
      {pendingRemindersState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingRemindersState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
            <div
              className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
              style={{ width: 340 }}
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
                    ? 'Reminders will be shown again, with reminder notifications and the badge restored.'
                    : 'The app will show Lists only. Reminder notifications stop and the badge clears. Reminders and settings are kept.'}
                </p>
              </div>
              <div className="flex gap-[30px] w-full justify-between">
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

function ListsAreaPage({ onBack, onClose, enableReminders, isListsEnabled, onListsEnabledChange, smartRemindersEnabled, onSmartRemindersEnabledChange, savedListsEnabled, onSavedListsEnabledChange, pinnedListsEnabled, onPinnedListsEnabledChange, useDefaultTemplatesInCleanState, onUseDefaultTemplatesInCleanStateChange, onNavigateDummyLists }: { onBack: () => void; onClose: () => void; enableReminders: boolean; isListsEnabled: boolean; onListsEnabledChange: (enabled: boolean) => void; smartRemindersEnabled: boolean; onSmartRemindersEnabledChange: (value: boolean) => void; savedListsEnabled: boolean; onSavedListsEnabledChange: (value: boolean) => void; pinnedListsEnabled: boolean; onPinnedListsEnabledChange: (value: boolean) => void; useDefaultTemplatesInCleanState: boolean; onUseDefaultTemplatesInCleanStateChange: (value: boolean) => void; onNavigateDummyLists: () => void }) {
  const [pendingListsState, setPendingListsState] = useState<boolean | null>(null);
  const isLastModule = isListsEnabled && !enableReminders;
  const [showLastModuleNotice, setShowLastModuleNotice] = useState(false);

  return (
    <>
    <div className="flex flex-col h-full relative w-full" data-name="lists-area-page">
      <PageShell title="Lists" onBack={onBack} onClose={onClose}>
        <DevCard>
        <DevToggleRow label="Enable lists" isOn={isListsEnabled} onToggle={() => { if (isLastModule) setShowLastModuleNotice(true); else setPendingListsState(!isListsEnabled); }} infoTitle="Master toggle for the lists feature. Controls access to smart reminders, list templates, pinned lists, and the dummy lists page. Disabling this restricts all list sub-features. Also forces the filters menu to use the Standard layout. Reminders and Lists cannot both be off: while Reminders is off, tapping this explains why." />
        </DevCard>
        <DevCard title="Features">
        <DevToggleRow label="Smart reminders" isOn={smartRemindersEnabled} onToggle={() => onSmartRemindersEnabledChange(!smartRemindersEnabled)} disabled={!isListsEnabled} infoTitle="Allows reminders to be linked to a list, turning them into smart reminders that track list item progress. Smart reminders display a completion count (e.g. '3 of 5 items'). Requires Enable lists to be on." />
        <DevToggleRow label="List templates" isOn={savedListsEnabled} onToggle={() => onSavedListsEnabledChange(!savedListsEnabled)} disabled={!isListsEnabled} infoTitle="Enables saved list templates that users can create and reuse. Templates appear in the list creation flow and can be pre-populated with default items. Also unlocks the 'Use default template set' setting below. Requires Enable lists to be on." />
        <DevToggleRow label="Pinned lists" isOn={pinnedListsEnabled} onToggle={() => onPinnedListsEnabledChange(!pinnedListsEnabled)} disabled={!isListsEnabled} infoTitle="Allows users to pin frequently used lists for quick access. Pinned lists appear in a dedicated section above other lists in the lists view. Requires Enable lists to be on." />
        </DevCard>
      </PageShell>
    </div>
      {showLastModuleNotice && <LastModuleNotice onClose={() => setShowLastModuleNotice(false)} />}
      {pendingListsState !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingListsState(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
            <div
              className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
              style={{ width: 340 }}
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
              <div className="flex gap-[30px] w-full justify-between">
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

  // Login: robot logo, 70px password field and 65px Login button, 24px apart, on the grey page.
  return (
    <div className="flex flex-col gap-[24px] items-center pt-[174px] relative w-full">
      <svg className="block shrink-0" width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M34.0492 29.1V25.8C34.0492 21.1331 34.0492 18.7997 32.5994 17.3498C31.1496 15.9 28.8161 15.9 24.1492 15.9H20.8492C16.1823 15.9 13.8489 15.9 12.399 17.3498C10.9492 18.7997 10.9492 21.1331 10.9492 25.8V29.1C10.9492 33.7669 10.9492 36.1004 12.399 37.5502C13.8489 39 16.1823 39 20.8492 39H24.1492C28.8161 39 31.1496 39 32.5994 37.5502C34.0492 36.1004 34.0492 33.7669 34.0492 29.1Z" stroke="#141B34" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M34.0508 32.4C36.3842 32.4 37.551 32.4 38.2759 31.6751C39.0008 30.9502 39.0008 29.7835 39.0008 27.45C39.0008 25.1165 39.0008 23.9498 38.2759 23.2249C37.551 22.5 36.3842 22.5 34.0508 22.5" stroke="#141B34" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M10.95 32.4C8.61655 32.4 7.44982 32.4 6.72491 31.6751C6 30.9502 6 29.7835 6 27.45C6 25.1165 6 23.9498 6.72491 23.2249C7.44982 22.5 8.61655 22.5 10.95 22.5" stroke="#141B34" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M24.9734 8.475C24.9734 9.8419 23.8653 10.95 22.4984 10.95C21.1315 10.95 20.0234 9.8419 20.0234 8.475C20.0234 7.1081 21.1315 6 22.4984 6C23.8653 6 24.9734 7.1081 24.9734 8.475Z" stroke="#141B34" strokeWidth="2.5"/>
        <path d="M22.5 10.95V15.9" stroke="#141B34" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.5508 24.15V25.8" stroke="#141B34" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M27.4492 24.15V25.8" stroke="#141B34" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.1992 31.575C19.1992 31.575 20.2992 32.4 22.4992 32.4C24.6992 32.4 25.7992 31.575 25.7992 31.575" stroke="#141B34" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>

      {/* Password field: lock icon on the left, eye icon on the right */}
      <div className="bg-white flex gap-[15px] h-[70px] items-center px-[20px] relative rounded-[6px] shrink-0 w-full">
        <svg className="block shrink-0" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="30" height="30" rx="6" fill="#D9D9D9" fillOpacity="0.5"/>
          <path d="M9.4311 19.9283C9.59302 21.1309 10.5891 22.073 11.8012 22.1287C12.8212 22.1756 13.8573 22.2001 14.9983 22.2001C16.1393 22.2001 17.1754 22.1756 18.1953 22.1287C19.4075 22.073 20.4035 21.1309 20.5655 19.9283C20.6711 19.1435 20.7583 18.3392 20.7583 17.5201C20.7583 16.701 20.6711 15.8967 20.5655 15.1119C20.4035 13.9093 19.4075 12.9672 18.1953 12.9114C17.1754 12.8645 16.1393 12.8401 14.9983 12.8401C13.8573 12.8401 12.8212 12.8645 11.8012 12.9114C10.5891 12.9672 9.59302 13.9093 9.4311 15.1119C9.32543 15.8967 9.23828 16.701 9.23828 17.5201C9.23828 18.3392 9.32543 19.1435 9.4311 19.9283Z" fill="#1C2C42"/>
          <path d="M11.7617 12.84V11.04C11.7617 9.25065 13.2123 7.80005 15.0017 7.80005C16.7911 7.80005 18.2417 9.25065 18.2417 11.04V12.84" stroke="#1C2C42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          ref={passwordInputRef}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setShowError(false); }}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePasswordPointerDown}
          aria-label="Password"
          className="flex-1 min-w-0 bg-transparent outline-none font-['Lato:Bold',sans-serif] not-italic text-[20px] text-[#1C2C42] leading-[26px]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="shrink-0 h-[15.5px] w-[21.5px] cursor-pointer flex items-center justify-center"
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

      {/* Login button */}
      <button
        onClick={handleSubmit}
        disabled={passwordRequired && password.length === 0}
        className={`flex h-[65px] items-center justify-center relative rounded-[6px] shrink-0 w-full ${(passwordRequired && password.length === 0) ? 'bg-[#939393] cursor-default' : 'bg-[#4784f8] cursor-pointer'}`}
      >
        <p className="font-['Lato:Bold',sans-serif] leading-[normal] text-[20px] text-white whitespace-nowrap">Login</p>
      </button>

      {/* Revealed password */}
      {revealVisible && (
        <p
          className="font-['Lato:SemiBold',sans-serif] leading-[normal] text-[17px] text-[#1C2C42] text-center whitespace-nowrap"
          style={{ opacity: revealFading ? 0 : 1, transition: revealFading ? 'opacity 300ms ease' : 'none' }}
        >
          {DEV_TOOLS_PASSWORD}
        </p>
      )}

      {/* Error message */}
      {showError && (
        <p className="font-['Lato:SemiBold',sans-serif] leading-[normal] text-[17px] text-[red] text-center whitespace-nowrap">That password doesn't look right?</p>
      )}
    </div>
  );
}

function DevToolsContent({ onClose, hapticsFlag, onHapticsFlagChange, soundsFlag, onSoundsFlagChange, lockScreenWidgetFlag, onLockScreenWidgetFlagChange, remindersFlag, onRemindersFlagChange, notificationsFlag, onNotificationsFlagChange, repeatFlag, onRepeatFlagChange, oneMinuteFlag, onOneMinuteFlagChange, calendarFlag, onCalendarFlagChange, attachmentsFlag, onAttachmentsFlagChange, datePresetsFlag, onDatePresetsFlagChange, onClearReminders, addReminder, addReminders, nlcMode, onNlcModeChange, nlcEnabled, onNlcEnabledChange, nlcRecognition, onNlcRecognitionChange, hideOverdue, onHideOverdueChange, isOnboardingTutorialEnabled, onOnboardingTutorialEnabledChange, isListsEnabled, onListsEnabledChange, showTutorialOnFirstLaunch, onShowTutorialOnFirstLaunchChange, showTutorialOnEveryStart, onShowTutorialOnEveryStartChange, isDevToolsUnlocked, onDevToolsUnlock, isDevToolsPasswordRequired, onDevToolsPasswordRequiredChange, useOneMinuteIncrements, onUseOneMinuteIncrementsChange, smartRemindersEnabled, onSmartRemindersEnabledChange, savedListsEnabled, onSavedListsEnabledChange, pinnedListsEnabled, onPinnedListsEnabledChange, settingsMenuEnabled, onSettingsMenuEnabledChange, showInfoIcons, onShowInfoIconsChange, notifReminderAlerts, onNotifReminderAlertsChange, notifAppBadge, onNotifAppBadgeChange, notifIncludeTodayInBadge, onNotifIncludeTodayInBadgeChange, siriShortcutsEnabled, onSiriShortcutsEnabledChange, useDefaultTemplatesInCleanState, onUseDefaultTemplatesInCleanStateChange, onClearLists, onGenerateLists }: { onClose: () => void; hapticsFlag: boolean; onHapticsFlagChange: (value: boolean) => void; soundsFlag: boolean; onSoundsFlagChange: (value: boolean) => void; lockScreenWidgetFlag: boolean; onLockScreenWidgetFlagChange: (value: boolean) => void; remindersFlag: boolean; onRemindersFlagChange: (value: boolean) => void; notificationsFlag: boolean; onNotificationsFlagChange: (value: boolean) => void; repeatFlag: boolean; onRepeatFlagChange: (value: boolean) => void; oneMinuteFlag: boolean; onOneMinuteFlagChange: (value: boolean) => void; calendarFlag: boolean; onCalendarFlagChange: (value: boolean) => void; attachmentsFlag: boolean; onAttachmentsFlagChange: (value: boolean) => void; datePresetsFlag: boolean; onDatePresetsFlagChange: (value: boolean) => void; onClearReminders: () => void; addReminder: (reminder: Reminder) => void; addReminders: (reminders: Reminder[]) => void; nlcMode: NlcMode; onNlcModeChange: (mode: NlcMode) => void; nlcEnabled: boolean; onNlcEnabledChange: (enabled: boolean) => void; nlcRecognition: NlcRecognitionConfig; onNlcRecognitionChange: (config: NlcRecognitionConfig) => void; hideOverdue: boolean; onHideOverdueChange: (value: boolean) => void; isOnboardingTutorialEnabled: boolean; onOnboardingTutorialEnabledChange: (next: boolean) => void; isListsEnabled: boolean; onListsEnabledChange: (enabled: boolean) => void; showTutorialOnFirstLaunch: boolean; onShowTutorialOnFirstLaunchChange: (value: boolean) => void; showTutorialOnEveryStart: boolean; onShowTutorialOnEveryStartChange: (value: boolean) => void; isDevToolsUnlocked: boolean; onDevToolsUnlock: () => void; isDevToolsPasswordRequired: boolean; onDevToolsPasswordRequiredChange: (value: boolean) => void; useOneMinuteIncrements: boolean; onUseOneMinuteIncrementsChange: (value: boolean) => void; smartRemindersEnabled: boolean; onSmartRemindersEnabledChange: (value: boolean) => void; savedListsEnabled: boolean; onSavedListsEnabledChange: (value: boolean) => void; pinnedListsEnabled: boolean; onPinnedListsEnabledChange: (value: boolean) => void; settingsMenuEnabled: boolean; onSettingsMenuEnabledChange: (value: boolean) => void; showInfoIcons: boolean; onShowInfoIconsChange: (value: boolean) => void; notifReminderAlerts: boolean; onNotifReminderAlertsChange: (value: boolean) => void; notifAppBadge: boolean; onNotifAppBadgeChange: (value: boolean) => void; notifIncludeTodayInBadge: boolean; onNotifIncludeTodayInBadgeChange: (value: boolean) => void; siriShortcutsEnabled: boolean; onSiriShortcutsEnabledChange: (value: boolean) => void; useDefaultTemplatesInCleanState: boolean; onUseDefaultTemplatesInCleanStateChange: (value: boolean) => void; onClearLists: (useDefaultTemplatesInCleanState: boolean) => void; onGenerateLists: (payload: GeneratedDummyListsPayload) => void }) {
  const [page, setPage] = useState<DevToolsPage>('home');
  const enableReminders = remindersFlag;
  const setEnableReminders = onRemindersFlagChange;
  const enableNotifications = notificationsFlag;
  const setEnableNotifications = onNotificationsFlagChange;

  // Reminders and Lists cannot both be off. Every change to either goes through these.
  const changeRemindersFlag = (next: boolean) => {
    if (canChangeModuleFlag(next, isListsEnabled)) setEnableReminders(next);
  };
  const changeListsFlag = (next: boolean) => {
    if (canChangeModuleFlag(next, enableReminders)) onListsEnabledChange(next);
  };

  let content;
  if (!isDevToolsUnlocked) {
    content = (
      <div className="flex flex-col items-start pt-[24px] px-[20px] pb-[24px] relative w-full flex-1 min-h-0 overflow-y-auto">
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
        onNavigateOnboarding={() => setPage('onboarding')}
        onNavigateTesting={() => setPage('testing-tools')}
        onNavigateSystem={() => setPage('system')}
        onNavigateSiri={() => setPage('siri')}
        onNavigateConfig={() => setPage('config')}
        onNavigateDevToolsPassword={() => setPage('dev-tools-password')}
        enableReminders={enableReminders}
        onEnableRemindersChange={changeRemindersFlag}
        enableLists={isListsEnabled}
        onEnableListsChange={changeListsFlag}
        enableNlc={nlcEnabled}
        onEnableNlcChange={onNlcEnabledChange}
        enableOnboarding={isOnboardingTutorialEnabled}
        onEnableOnboardingChange={onOnboardingTutorialEnabledChange}
        enableSiri={siriShortcutsEnabled}
        onEnableSiriChange={onSiriShortcutsEnabledChange}
      />
    );
  } else if (page === 'testing') {
    content = (
      <TestingPage onBack={() => setPage('testing-tools')} onClose={onClose} />
    );
  } else if (page === 'reminders') {
    content = (
      <RemindersPage onBack={() => setPage('home')} onClose={onClose} enableReminders={enableReminders} onEnableRemindersChange={changeRemindersFlag} isListsEnabled={isListsEnabled} notificationsFlag={enableNotifications} setNotificationsFlag={setEnableNotifications} repeatToggle={repeatFlag} setRepeatToggle={onRepeatFlagChange} oneMinuteFlag={oneMinuteFlag} setOneMinuteFlag={onOneMinuteFlagChange} calendarFlag={calendarFlag} setCalendarFlag={onCalendarFlagChange} attachmentsFlag={attachmentsFlag} setAttachmentsFlag={onAttachmentsFlagChange} datePresetsFlag={datePresetsFlag} setDatePresetsFlag={onDatePresetsFlagChange} />
    );
  } else if (page === 'dummy-reminders') {
    content = (
      <DummyRemindersPage onBack={() => setPage('testing-tools')} onClose={onClose} addReminders={addReminders} hideOverdue={hideOverdue} onHideOverdueChange={onHideOverdueChange} onClearReminders={onClearReminders} />
    );
  } else if (page === 'lists') {
    content = (
      <ListsAreaPage onBack={() => setPage('home')} onClose={onClose} enableReminders={enableReminders} isListsEnabled={isListsEnabled} onListsEnabledChange={changeListsFlag} smartRemindersEnabled={smartRemindersEnabled} onSmartRemindersEnabledChange={onSmartRemindersEnabledChange} savedListsEnabled={savedListsEnabled} onSavedListsEnabledChange={onSavedListsEnabledChange} pinnedListsEnabled={pinnedListsEnabled} onPinnedListsEnabledChange={onPinnedListsEnabledChange} useDefaultTemplatesInCleanState={useDefaultTemplatesInCleanState} onUseDefaultTemplatesInCleanStateChange={onUseDefaultTemplatesInCleanStateChange} onNavigateDummyLists={() => setPage('dummy-lists')} />
    );
  } else if (page === 'dummy-lists') {
    content = (
      <DummyListsPage onBack={() => setPage('testing-tools')} onClose={onClose} onClearLists={() => onClearLists(useDefaultTemplatesInCleanState)} onGenerateLists={onGenerateLists} />
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
      <SystemPage onBack={() => setPage('home')} onClose={onClose} hapticsFlag={hapticsFlag} onHapticsFlagChange={onHapticsFlagChange} soundsFlag={soundsFlag} onSoundsFlagChange={onSoundsFlagChange} lockScreenWidgetFlag={lockScreenWidgetFlag} onLockScreenWidgetFlagChange={onLockScreenWidgetFlagChange} siriShortcutsEnabled={siriShortcutsEnabled} onSiriShortcutsEnabledChange={onSiriShortcutsEnabledChange} settingsMenuEnabled={settingsMenuEnabled} onSettingsMenuEnabledChange={onSettingsMenuEnabledChange} showInfoIcons={showInfoIcons} onShowInfoIconsChange={onShowInfoIconsChange} onNavigateDevToolsPassword={() => setPage('dev-tools-password')}  />
    );
  } else if (page === 'dev-tools-password') {
    content = (
      <DevToolsPasswordPage onBack={() => setPage('home')} onClose={onClose} passwordRequired={isDevToolsPasswordRequired} onPasswordRequiredChange={onDevToolsPasswordRequiredChange} />
    );
  } else if (page === 'siri') {
    content = (
      <PageShell title="Siri shortcuts" onBack={() => setPage('home')} onClose={onClose}>
        <DevCard>
        <DevToggleRow label="Siri for reminders" isOn={siriShortcutsEnabled} onToggle={() => onSiriShortcutsEnabledChange(!siriShortcutsEnabled)} infoTitle="Controls whether Reminderly acts on the 'Add to Reminderly' Siri shortcut. When off, the shortcut still appears in iOS but the request is ignored." />
        </DevCard>
      </PageShell>
    );
  } else if (page === 'config') {
    content = (
      <PageShell title="Config tools" onBack={() => setPage('home')} onClose={onClose}>
        <DevCard title="Lists">
        <DevToggleRow label="Use template set in clean state" isOn={useDefaultTemplatesInCleanState} onToggle={() => onUseDefaultTemplatesInCleanStateChange(!useDefaultTemplatesInCleanState)} disabled={!isListsEnabled || !savedListsEnabled} infoTitle="When all lists are cleared, the app automatically restores the default set of list templates instead of showing an empty state. Only applies when list templates are enabled. Requires both Lists and List templates to be on." />
        </DevCard>
      </PageShell>
    );
  } else if (page === 'testing-tools') {
    content = (
      <PageShell title="Testing tools" onBack={() => setPage('home')} onClose={onClose}>
        <DevCard>
        <DevMenuRow label="Self checks" onClick={() => setPage('testing')} infoTitle="Runs the automated self checks and shows the results, which can be copied." />
        <DevMenuRow label="Dummy reminders" onClick={() => setPage('dummy-reminders')} disabled={!enableReminders} infoTitle="Opens the Dummy Reminders page where you can generate test reminders across all time categories (overdue, today, this week, later, sometime, done), configure repeat flags, and clear all reminders. Requires Reminders to be on." />
        <DevMenuRow label="Dummy lists" onClick={() => setPage('dummy-lists')} disabled={!isListsEnabled} infoTitle="Opens the Dummy Lists page where you can generate test lists with configurable item counts, choose to include done items, smart reminder lists, and saved list templates, then clear or regenerate. Requires Lists to be on." />
        <DevToggleRow label="Show tutorial on every app start" isOn={showTutorialOnEveryStart} onToggle={() => { const next = !showTutorialOnEveryStart; onShowTutorialOnEveryStartChange(next); if (next) onShowTutorialOnFirstLaunchChange(false); }} disabled={!isOnboardingTutorialEnabled} infoTitle="Shows the onboarding tutorial every time the app is opened, regardless of whether it has been seen before. Enabling this turns off 'Show tutorial on first launch' in Feature flags > Onboarding. Only one launch trigger can be active. Requires Onboarding to be on." />
        </DevCard>
      </PageShell>
    );
  }

  return (
    <div className="flex flex-col h-full relative w-full max-w-[768px]" data-name="dev-tools-content">
      {content}
    </div>
  );
}

export default function DevToolsOverlay({ onClose, hapticsFlag, onHapticsFlagChange, soundsFlag, onSoundsFlagChange, lockScreenWidgetFlag, onLockScreenWidgetFlagChange, remindersFlag, onRemindersFlagChange, notificationsFlag, onNotificationsFlagChange, repeatFlag, onRepeatFlagChange, oneMinuteFlag, onOneMinuteFlagChange, calendarFlag, onCalendarFlagChange, attachmentsFlag, onAttachmentsFlagChange, datePresetsFlag, onDatePresetsFlagChange, onClearReminders, addReminder, addReminders, nlcMode, onNlcModeChange, nlcEnabled, onNlcEnabledChange, nlcRecognition, onNlcRecognitionChange, hideOverdue, onHideOverdueChange, isOnboardingTutorialEnabled, onOnboardingTutorialEnabledChange, isListsEnabled, onListsEnabledChange, showTutorialOnFirstLaunch, onShowTutorialOnFirstLaunchChange, showTutorialOnEveryStart, onShowTutorialOnEveryStartChange, isDevToolsUnlocked, onDevToolsUnlock, isDevToolsPasswordRequired, onDevToolsPasswordRequiredChange, useOneMinuteIncrements, onUseOneMinuteIncrementsChange, smartRemindersEnabled, onSmartRemindersEnabledChange, savedListsEnabled, onSavedListsEnabledChange, pinnedListsEnabled, onPinnedListsEnabledChange, settingsMenuEnabled, onSettingsMenuEnabledChange, showInfoIcons, onShowInfoIconsChange, notifReminderAlerts, onNotifReminderAlertsChange, notifAppBadge, onNotifAppBadgeChange, notifIncludeTodayInBadge, onNotifIncludeTodayInBadgeChange, siriShortcutsEnabled, onSiriShortcutsEnabledChange, useDefaultTemplatesInCleanState, onUseDefaultTemplatesInCleanStateChange, onClearLists, onGenerateLists }: { onClose: () => void; hapticsFlag: boolean; onHapticsFlagChange: (value: boolean) => void; soundsFlag: boolean; onSoundsFlagChange: (value: boolean) => void; lockScreenWidgetFlag: boolean; onLockScreenWidgetFlagChange: (value: boolean) => void; remindersFlag: boolean; onRemindersFlagChange: (value: boolean) => void; notificationsFlag: boolean; onNotificationsFlagChange: (value: boolean) => void; repeatFlag: boolean; onRepeatFlagChange: (value: boolean) => void; oneMinuteFlag: boolean; onOneMinuteFlagChange: (value: boolean) => void; calendarFlag: boolean; onCalendarFlagChange: (value: boolean) => void; attachmentsFlag: boolean; onAttachmentsFlagChange: (value: boolean) => void; datePresetsFlag: boolean; onDatePresetsFlagChange: (value: boolean) => void; onClearReminders: () => void; addReminder: (reminder: Reminder) => void; addReminders: (reminders: Reminder[]) => void; nlcMode: NlcMode; onNlcModeChange: (mode: NlcMode) => void; nlcEnabled: boolean; onNlcEnabledChange: (enabled: boolean) => void; nlcRecognition: NlcRecognitionConfig; onNlcRecognitionChange: (config: NlcRecognitionConfig) => void; hideOverdue: boolean; onHideOverdueChange: (value: boolean) => void; isOnboardingTutorialEnabled: boolean; onOnboardingTutorialEnabledChange: (next: boolean) => void; isListsEnabled: boolean; onListsEnabledChange: (enabled: boolean) => void; showTutorialOnFirstLaunch: boolean; onShowTutorialOnFirstLaunchChange: (value: boolean) => void; showTutorialOnEveryStart: boolean; onShowTutorialOnEveryStartChange: (value: boolean) => void; isDevToolsUnlocked: boolean; onDevToolsUnlock: () => void; isDevToolsPasswordRequired: boolean; onDevToolsPasswordRequiredChange: (value: boolean) => void; useOneMinuteIncrements: boolean; onUseOneMinuteIncrementsChange: (value: boolean) => void; smartRemindersEnabled: boolean; onSmartRemindersEnabledChange: (value: boolean) => void; savedListsEnabled: boolean; onSavedListsEnabledChange: (value: boolean) => void; pinnedListsEnabled: boolean; onPinnedListsEnabledChange: (value: boolean) => void; settingsMenuEnabled: boolean; onSettingsMenuEnabledChange: (value: boolean) => void; showInfoIcons: boolean; onShowInfoIconsChange: (value: boolean) => void; notifReminderAlerts: boolean; onNotifReminderAlertsChange: (value: boolean) => void; notifAppBadge: boolean; onNotifAppBadgeChange: (value: boolean) => void; notifIncludeTodayInBadge: boolean; onNotifIncludeTodayInBadgeChange: (value: boolean) => void; siriShortcutsEnabled: boolean; onSiriShortcutsEnabledChange: (value: boolean) => void; useDefaultTemplatesInCleanState: boolean; onUseDefaultTemplatesInCleanStateChange: (value: boolean) => void; onClearLists: (useDefaultTemplatesInCleanState: boolean) => void; onGenerateLists: (payload: GeneratedDummyListsPayload) => void }) {
  return (
    <div className="bg-[#F7F7F7] content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full" data-name="dev-tools-overlay">
      <DevToolsContent onClose={onClose} hapticsFlag={hapticsFlag} onHapticsFlagChange={onHapticsFlagChange} soundsFlag={soundsFlag} onSoundsFlagChange={onSoundsFlagChange} lockScreenWidgetFlag={lockScreenWidgetFlag} onLockScreenWidgetFlagChange={onLockScreenWidgetFlagChange} remindersFlag={remindersFlag} onRemindersFlagChange={onRemindersFlagChange} notificationsFlag={notificationsFlag} onNotificationsFlagChange={onNotificationsFlagChange} repeatFlag={repeatFlag} onRepeatFlagChange={onRepeatFlagChange} oneMinuteFlag={oneMinuteFlag} onOneMinuteFlagChange={onOneMinuteFlagChange} calendarFlag={calendarFlag} onCalendarFlagChange={onCalendarFlagChange} attachmentsFlag={attachmentsFlag} onAttachmentsFlagChange={onAttachmentsFlagChange} datePresetsFlag={datePresetsFlag} onDatePresetsFlagChange={onDatePresetsFlagChange} onClearReminders={onClearReminders} addReminder={addReminder} addReminders={addReminders} nlcMode={nlcMode} onNlcModeChange={onNlcModeChange} nlcEnabled={nlcEnabled} onNlcEnabledChange={onNlcEnabledChange} nlcRecognition={nlcRecognition} onNlcRecognitionChange={onNlcRecognitionChange} hideOverdue={hideOverdue} onHideOverdueChange={onHideOverdueChange} isOnboardingTutorialEnabled={isOnboardingTutorialEnabled} onOnboardingTutorialEnabledChange={onOnboardingTutorialEnabledChange} isListsEnabled={isListsEnabled} onListsEnabledChange={onListsEnabledChange} showTutorialOnFirstLaunch={showTutorialOnFirstLaunch} onShowTutorialOnFirstLaunchChange={onShowTutorialOnFirstLaunchChange} showTutorialOnEveryStart={showTutorialOnEveryStart} onShowTutorialOnEveryStartChange={onShowTutorialOnEveryStartChange} isDevToolsUnlocked={isDevToolsUnlocked} onDevToolsUnlock={onDevToolsUnlock} isDevToolsPasswordRequired={isDevToolsPasswordRequired} onDevToolsPasswordRequiredChange={onDevToolsPasswordRequiredChange} useOneMinuteIncrements={useOneMinuteIncrements} onUseOneMinuteIncrementsChange={onUseOneMinuteIncrementsChange} smartRemindersEnabled={smartRemindersEnabled} onSmartRemindersEnabledChange={onSmartRemindersEnabledChange} savedListsEnabled={savedListsEnabled} onSavedListsEnabledChange={onSavedListsEnabledChange} pinnedListsEnabled={pinnedListsEnabled} onPinnedListsEnabledChange={onPinnedListsEnabledChange} settingsMenuEnabled={settingsMenuEnabled} onSettingsMenuEnabledChange={onSettingsMenuEnabledChange} showInfoIcons={showInfoIcons} onShowInfoIconsChange={onShowInfoIconsChange} notifReminderAlerts={notifReminderAlerts} onNotifReminderAlertsChange={onNotifReminderAlertsChange} notifAppBadge={notifAppBadge} onNotifAppBadgeChange={onNotifAppBadgeChange} notifIncludeTodayInBadge={notifIncludeTodayInBadge} onNotifIncludeTodayInBadgeChange={onNotifIncludeTodayInBadgeChange} siriShortcutsEnabled={siriShortcutsEnabled} onSiriShortcutsEnabledChange={onSiriShortcutsEnabledChange} useDefaultTemplatesInCleanState={useDefaultTemplatesInCleanState} onUseDefaultTemplatesInCleanStateChange={onUseDefaultTemplatesInCleanStateChange} onClearLists={onClearLists} onGenerateLists={onGenerateLists} />
    </div>
  );
}
