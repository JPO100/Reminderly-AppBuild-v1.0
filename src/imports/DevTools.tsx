import { useState } from "react";
import { DevPage, DevCard, DevNavToggleRow, DevMenuRow } from "../app/components/DevToolsOverlay";

// Shown when the last enabled of Reminders and Lists is tapped: one module must stay on.
export function LastModuleNotice({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
        <div
          className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
          style={{ width: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
            <p className="leading-[normal] whitespace-pre-wrap">One module must stay on</p>
          </div>
          <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
            <p className="leading-[normal] whitespace-pre-wrap">At least one of Reminders or Lists must stay on. Turn the other on first.</p>
          </div>
          <button
            onClick={onClose}
            className="h-[50px] rounded-[100px] cursor-pointer px-[16px] w-full"
            style={{ backgroundColor: '#4784F8' }}
          >
            <div className="flex items-center justify-center size-full">
              <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                <p className="leading-[normal]">OK</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

const homeOverlayCopy: Record<string, { onTitle: string; onSubtitle: string; offTitle: string; offSubtitle: string }> = {
  reminders: {
    onTitle: 'Turn on reminders?',
    onSubtitle: 'Reminders will be shown again, with reminder notifications and the badge restored.',
    offTitle: 'Turn off reminders?',
    offSubtitle: 'The app will show Lists only. Reminder notifications stop and the badge clears. Reminders and settings are kept.',
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
  onNavigateOnboarding,
  onNavigateTesting,
  onNavigateSystem,
  onNavigateSiri,
  onNavigateConfig,
  onNavigateDevToolsPassword,
  enableReminders,
  onEnableRemindersChange,
  enableLists,
  onEnableListsChange,
  enableNlc,
  onEnableNlcChange,
  enableOnboarding,
  onEnableOnboardingChange,
  enableSiri,
  onEnableSiriChange,
}: {
  onClose: () => void;
  onNavigateReminders: () => void;
  onNavigateLists: () => void;
  onNavigateNlc: () => void;
  onNavigateOnboarding: () => void;
  onNavigateTesting: () => void;
  onNavigateSystem: () => void;
  onNavigateSiri: () => void;
  onNavigateConfig: () => void;
  onNavigateDevToolsPassword: () => void;
  enableReminders: boolean;
  onEnableRemindersChange: (value: boolean) => void;
  enableLists: boolean;
  onEnableListsChange: (value: boolean) => void;
  enableNlc: boolean;
  onEnableNlcChange: (value: boolean) => void;
  enableOnboarding: boolean;
  onEnableOnboardingChange: (value: boolean) => void;
  enableSiri: boolean;
  onEnableSiriChange: (value: boolean) => void;
}) {
  const [pendingToggle, setPendingToggle] = useState<{ feature: string; target: boolean } | null>(null);
  const [showLastModuleNotice, setShowLastModuleNotice] = useState(false);

  const handleConfirm = () => {
    if (!pendingToggle) return;
    const handlers: Record<string, (value: boolean) => void> = {
      reminders: onEnableRemindersChange,
      lists: onEnableListsChange,
      nlc: onEnableNlcChange,
      onboarding: onEnableOnboardingChange,
    };
    handlers[pendingToggle.feature](pendingToggle.target);
    setPendingToggle(null);
  };

  const copy = pendingToggle ? homeOverlayCopy[pendingToggle.feature] : null;

  return (
    <>
    <div className="flex flex-col size-full" data-name="dev-tools">
      {/* Feature rows with a toggle come first, click-through rows after */}
      <DevPage title="Dev tools" onClose={onClose}>
        <DevCard title="Feature flags">
          {/* Reminders and Lists cannot both be off: the last one on shows a notice */}
          <DevNavToggleRow label="Reminders" isOn={enableReminders} onToggle={() => { if (enableReminders && !enableLists) { setShowLastModuleNotice(true); return; } setPendingToggle({ feature: 'reminders', target: !enableReminders }); }} onClick={onNavigateReminders} />
          <DevNavToggleRow label="Lists" isOn={enableLists} onToggle={() => { if (enableLists && !enableReminders) { setShowLastModuleNotice(true); return; } setPendingToggle({ feature: 'lists', target: !enableLists }); }} onClick={onNavigateLists} />
          <DevNavToggleRow label="Natural Language Capture" isOn={enableNlc} onToggle={() => setPendingToggle({ feature: 'nlc', target: !enableNlc })} onClick={onNavigateNlc} />
          <DevNavToggleRow label="Onboarding" isOn={enableOnboarding} onToggle={() => setPendingToggle({ feature: 'onboarding', target: !enableOnboarding })} onClick={onNavigateOnboarding} />
          <DevNavToggleRow label="Siri shortcuts" isOn={enableSiri} onToggle={() => onEnableSiriChange(!enableSiri)} onClick={onNavigateSiri} />
          <DevMenuRow label="System" onClick={onNavigateSystem} />
        </DevCard>
        <DevCard title="Config">
          <DevMenuRow label="Config tools" onClick={onNavigateConfig} />
        </DevCard>
        <DevCard title="Testing">
          <DevMenuRow label="Testing tools" onClick={onNavigateTesting} />
        </DevCard>
        <DevCard title="Access and diagnostics">
          <DevMenuRow label="Dev tools password" onClick={onNavigateDevToolsPassword} />
        </DevCard>
      </DevPage>
    </div>
      {showLastModuleNotice && <LastModuleNotice onClose={() => setShowLastModuleNotice(false)} />}
      {pendingToggle && copy && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setPendingToggle(null)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
            <div
              className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
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
