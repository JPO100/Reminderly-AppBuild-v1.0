// In-app notification ask (docs/plans/notifications-phase-4.md, section 6.4), using the centred
// two-button confirmation pattern. Allow is followed by the iOS prompt; tapping outside counts as Not now.

export default function NotificationAskDialog({ onAllow, onNotNow }: { onAllow: () => void; onNotNow: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70]" onClick={onNotNow} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
        <div
          className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
          style={{ width: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
            <p className="leading-[normal] whitespace-pre-wrap">Get reminder alerts?</p>
          </div>
          <div className="flex flex-col font-['Lato:SemiBold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#939393] text-[17px] text-center">
            <p className="leading-[normal] whitespace-pre-wrap">Reminderly can alert you when a reminder is due and show a count on the app icon.</p>
          </div>
          <div className="flex gap-[30px] w-full justify-between">
            <button onClick={onNotNow} className="h-[50px] flex-1 rounded-[100px] cursor-pointer px-[16px]" style={{ backgroundColor: '#BABABA' }}>
              <div className="flex items-center justify-center size-full">
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                  <p className="leading-[normal]">Not now</p>
                </div>
              </div>
            </button>
            <button onClick={onAllow} className="h-[50px] flex-1 rounded-[100px] cursor-pointer px-[16px]" style={{ backgroundColor: '#4784F8' }}>
              <div className="flex items-center justify-center size-full">
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                  <p className="leading-[normal]">Allow</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
