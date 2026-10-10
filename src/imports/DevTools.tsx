import { useState } from "react";
import svgPaths from "./svg-7kpmedzeqd";
function ToggleBtn({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <div className="h-[30px] relative shrink-0 w-[56px]" data-name="toggle-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: 'pointer' }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56 30">
        <g id="toggle-btn">
          <rect fill={isOn ? "#4784F8" : "#C9C9C9"} height="30" rx="15" width="56" />
          <circle cx={isOn ? "41" : "15"} cy="15" fill="white" id="btn" r="11.25" style={{ transition: 'cx 0.2s ease' }} />
        </g>
      </svg>
    </div>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full h-[45px]" data-name="header">
      <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] whitespace-nowrap">
        <p className="leading-[normal]">Dev tools</p>
      </div>
      <button
        className="relative shrink-0 p-0 m-0 border-none bg-transparent flex items-center justify-center self-center cursor-pointer w-[45px] h-[45px]"
        type="button"
        onClick={onClose}
        aria-label="Close dev tools"
      >
        <svg className="block shrink-0" width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="45" height="45" rx="22.5" fill="#4784F8"/>
          <path d="M17.0199 17.0201L27.9801 27.9803M17.0199 27.9803L27.9801 17.0201" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function NavRow({ label, onClick, plain }: { label: string; onClick: () => void; plain?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${plain ? 'h-[60px]' : 'h-[50px] bg-[#f5f5f5] rounded-[100px]'} relative shrink-0 w-full cursor-pointer`}
    >
      <div className="flex flex-row items-center size-full">
        <div className={`content-stretch flex items-center ${plain ? 'pr-[15px]' : 'px-[30px]'} py-[15px] relative size-full`}>
          <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative">
            <div className={`flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative min-w-0 ${plain ? 'text-[#1C2C42] text-[17px]' : 'text-[#939393] text-[17px]'} whitespace-nowrap`}>
              <p className="leading-[normal] truncate">{label}</p>
            </div>
            <div className="flex items-center justify-center relative shrink-0">
              <div className="-scale-y-100 flex-none rotate-180">
                <div className="h-[13px] relative w-[7px]" data-name="Union">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 13">
                    <path d={svgPaths.p1b692f00} fill="var(--fill-0, #939393)" id="Union" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function NavRowWithToggle({ label, isOn, onToggle, onClick }: { label: string; isOn: boolean; onToggle: () => void; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-[60px] relative shrink-0 w-full"
      style={{ cursor: 'pointer' }}
    >
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pr-[15px] py-[15px] relative size-full gap-[16px]">
          <ToggleBtn isOn={isOn} onToggle={onToggle} />
          <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative">
            <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative min-w-0 text-[17px] whitespace-nowrap" style={{ color: isOn ? '#1C2C42' : '#D9D9D9' }}>
              <p className="leading-[normal] truncate">{label}</p>
            </div>
            <div className="flex items-center justify-center relative shrink-0">
              <div className="-scale-y-100 flex-none rotate-180">
                <div className="h-[13px] relative w-[7px]" data-name="Union">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 13">
                    <path d={svgPaths.p1b692f00} fill={isOn ? '#939393' : '#D9D9D9'} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

const homeOverlayCopy: Record<string, { onTitle: string; onSubtitle: string; offTitle: string; offSubtitle: string }> = {
  reminders: {
    onTitle: 'Turn on reminders?',
    onSubtitle: 'The Reminders feature will be enabled, turning on access to repeat reminders, time increments, and dummy reminders.',
    offTitle: 'Turn off reminders?',
    offSubtitle: 'The Reminders feature will be disabled, turning off access to repeat reminders, time increments, and dummy reminders.',
  },
  lists: {
    onTitle: 'Turn on Lists?',
    onSubtitle: 'The Lists feature will be enabled, allowing full access to all features.',
    offTitle: 'Turn off Lists?',
    offSubtitle: 'The Lists feature will be disabled, restricting access to certain features.',
  },
  nlc: {
    onTitle: 'Turn on NLC?',
    onSubtitle: 'Dates and times will be recognised automatically as you type. Existing reminders remain unchanged until edited.',
    offTitle: 'Turn off NLC?',
    offSubtitle: 'Reminders will be saved exactly as typed. Dates and times will only be set manually.',
  },
  notifications: {
    onTitle: 'Turn on notifications?',
    onSubtitle: 'The Notifications feature will be enabled, turning on access to system notifications, app badge, and badge count settings.',
    offTitle: 'Turn off notifications?',
    offSubtitle: 'The Notifications feature will be disabled, turning off access to system notifications, app badge, and badge count settings.',
  },
  onboarding: {
    onTitle: 'Turn on onboarding tutorial?',
    onSubtitle: 'The onboarding tutorial will be accessible from Settings and shown to new users on first launch.',
    offTitle: 'Turn off onboarding tutorial?',
    offSubtitle: 'The onboarding tutorial will be hidden from Settings and will not be shown to new users.',
  },
};

export default function DevTools({
  onClose,
  onNavigateReminders,
  onNavigateLists,
  onNavigateNlc,
  onNavigateNotifications,
  onNavigateOnboarding,
  onNavigateTesting,
  onNavigateSystem,
  enableReminders,
  onEnableRemindersChange,
  enableLists,
  onEnableListsChange,
  enableNlc,
  onEnableNlcChange,
  enableNotifications,
  onEnableNotificationsChange,
  enableOnboarding,
  onEnableOnboardingChange,
}: {
  onClose: () => void;
  onNavigateReminders: () => void;
  onNavigateLists: () => void;
  onNavigateNlc: () => void;
  onNavigateNotifications: () => void;
  onNavigateOnboarding: () => void;
  onNavigateTesting: () => void;
  onNavigateSystem: () => void;
  enableReminders: boolean;
  onEnableRemindersChange: (value: boolean) => void;
  enableLists: boolean;
  onEnableListsChange: (value: boolean) => void;
  enableNlc: boolean;
  onEnableNlcChange: (value: boolean) => void;
  enableNotifications: boolean;
  onEnableNotificationsChange: (value: boolean) => void;
  enableOnboarding: boolean;
  onEnableOnboardingChange: (value: boolean) => void;
}) {
  const [pendingToggle, setPendingToggle] = useState<{ feature: string; target: boolean } | null>(null);

  const handleConfirm = () => {
    if (!pendingToggle) return;
    const handlers: Record<string, (value: boolean) => void> = {
      reminders: onEnableRemindersChange,
      lists: onEnableListsChange,
      nlc: onEnableNlcChange,
      notifications: onEnableNotificationsChange,
      onboarding: onEnableOnboardingChange,
    };
    handlers[pendingToggle.feature](pendingToggle.target);
    setPendingToggle(null);
  };

  const copy = pendingToggle ? homeOverlayCopy[pendingToggle.feature] : null;

  return (
    <>
    <div className="bg-white content-stretch flex flex-col gap-[24px] items-start pb-[24px] pt-[24px] px-[20px] relative rounded-tl-[15px] rounded-tr-[15px] size-full" data-name="dev-tools">
      <Header onClose={onClose} />
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-center min-h-px min-w-px relative w-full">
        <div className="content-stretch flex flex-col items-start relative w-full" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full divide-y divide-[#E4E4E4]">
            <NavRowWithToggle label="Reminders" isOn={enableReminders} onToggle={() => setPendingToggle({ feature: 'reminders', target: !enableReminders })} onClick={onNavigateReminders} />
            <NavRowWithToggle label="Lists" isOn={enableLists} onToggle={() => setPendingToggle({ feature: 'lists', target: !enableLists })} onClick={onNavigateLists} />
            <NavRowWithToggle label="Natural Language Capture" isOn={enableNlc} onToggle={() => setPendingToggle({ feature: 'nlc', target: !enableNlc })} onClick={onNavigateNlc} />
            <NavRowWithToggle label="Notifications" isOn={enableNotifications} onToggle={() => setPendingToggle({ feature: 'notifications', target: !enableNotifications })} onClick={onNavigateNotifications} />
            <NavRowWithToggle label="Onboarding" isOn={enableOnboarding} onToggle={() => setPendingToggle({ feature: 'onboarding', target: !enableOnboarding })} onClick={onNavigateOnboarding} />
            <NavRow label="Testing" onClick={onNavigateTesting} plain />
            <NavRow label="System" onClick={onNavigateSystem} plain />
            <div />
          </div>
        </div>
      </div>
    </div>
      {pendingToggle && copy && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingToggle(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px]">
            <div
              className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto"
              style={{ width: 340 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingToggle.target ? copy.onTitle : copy.offTitle}
                </p>
              </div>
              <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
                <p className="leading-[normal] whitespace-pre-wrap">
                  {pendingToggle.target ? copy.onSubtitle : copy.offSubtitle}
                </p>
              </div>
              <div className="flex gap-[30px] w-full justify-between">
                <button
                  onClick={() => setPendingToggle(null)}
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
                  onClick={handleConfirm}
                  className="h-[50px] rounded-[100px] cursor-pointer px-[16px]"
                  style={{ backgroundColor: '#4784F8' }}
                >
                  <div className="flex items-center justify-center size-full">
                    <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                      <p className="leading-[normal]">
                        {pendingToggle.target ? 'Yes, turn on' : 'Yes, turn off'}
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
