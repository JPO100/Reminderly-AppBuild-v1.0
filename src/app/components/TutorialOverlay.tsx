import TutorialOnboardingContent from "@/app/components/TutorialOnboardingContent";

export default function TutorialOverlay({
  onClose,
  isEnabled,
  variant,
  isListsEnabled,
  settingsMenuEnabled,
  smartRemindersEnabled,
  savedListsEnabled,
}: {
  onClose: () => void;
  isEnabled: boolean;
  variant: 'reminders' | 'lists';
  isListsEnabled: boolean;
  settingsMenuEnabled: boolean;
  smartRemindersEnabled: boolean;
  savedListsEnabled: boolean;
}) {
  if (!isEnabled) return null;

  return (
    <div className="absolute inset-0 bg-white content-stretch flex flex-col items-center rounded-tl-[20px] rounded-tr-[20px] overflow-hidden" data-name="tutorial-overlay">
      <div className="flex flex-col h-full relative w-full max-w-[768px]" data-name="tutorial-content">
          <div className="flex flex-col gap-[40px] w-full flex-1 min-h-0">
            {/* Tutorial body - empty scroll container */}
            <div className="flex-1 min-h-0 overflow-y-auto w-full">
              <TutorialOnboardingContent onComplete={onClose} variant={variant} isListsEnabled={isListsEnabled} settingsMenuEnabled={settingsMenuEnabled} smartRemindersEnabled={smartRemindersEnabled} savedListsEnabled={savedListsEnabled} />
            </div>
          </div>
      </div>
    </div>
  );
}
