import { OverlayHeader } from "../app/components/OverlayHeader";

// Linked lists controls for the list overlays (docs/features/linked-lists.md). Row, button and dialog follow the
// existing smart reminder row, the Delete list button and the notification ask dialog.

export type LinkedControls = {
  linkable: boolean;
  statusText: string;
  onLinkableChange: (value: boolean) => void;
  unlinkLabel: string | null;
  onUnlink: () => void;
};

export function LinkIcon({ size = 15, color = "#BABABA" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.66 0l3.5-3.5a4 4 0 0 0-5.66-5.66l-1.2 1.2" />
      <path d="M14 10a4 4 0 0 0-5.66 0l-3.5 3.5a4 4 0 0 0 5.66 5.66l1.2-1.2" />
    </svg>
  );
}

export function LinkableRow({ controls }: { controls: LinkedControls }) {
  const { linkable, statusText, onLinkableChange } = controls;
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full cursor-pointer" data-name="linkable-row" onClick={() => onLinkableChange(!linkable)}>
      <div className="relative self-start shrink-0 top-[1px] flex items-center justify-center w-[19.5px] h-[21.5px]">
        <LinkIcon size={20} color="#1C2C42" />
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] gap-[9px] items-start justify-start leading-[0] min-h-px min-w-px not-italic relative">
        <div className="flex flex-col justify-start overflow-hidden relative shrink-0 text-[17px] text-ellipsis w-full whitespace-nowrap text-[#1C2C42]">
          <p className="leading-[17px] overflow-hidden text-ellipsis" style={{ fontWeight: 700 }}>Make list linkable</p>
        </div>
        <div className="flex flex-col justify-start relative shrink-0 text-[14px] w-full text-[#bababa] overflow-hidden whitespace-nowrap">
          <p className="leading-[14px] overflow-hidden text-ellipsis" style={{ fontWeight: 700 }}>{statusText}</p>
        </div>
      </div>
      <button
        className={`${linkable ? 'bg-[#4784F8] justify-end' : 'bg-[#BABABA]'} content-stretch cursor-pointer flex h-[30px] items-center self-start p-[3.75px] relative rounded-[37.5px] shrink-0 w-[56px] border-none`}
        role="switch"
        aria-checked={linkable}
        onClick={(event) => { event.stopPropagation(); onLinkableChange(!linkable); }}
      >
        <div className="relative shrink-0 size-[22.5px]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
            <circle cx="11.25" cy="11.25" fill="var(--fill-0, white)" r="11.25" />
          </svg>
        </div>
      </button>
    </div>
  );
}

export function UnlinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="bg-[#4784F8] h-[50px] relative rounded-[100px] shrink-0 w-full border-none p-0 cursor-pointer" data-name="unlink-btn" onClick={onClick}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
            <p className="leading-[normal]">{label}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

// Centred two-button confirmation, as NotificationAskDialog
export function LinkedConfirmDialog({ header, title, confirmLabel, onConfirm, onCancel }: { header: string; title: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70]" onClick={onCancel} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none px-[20px] centred-overlay-wrapper">
        <div
          className="bg-white relative flex flex-col gap-[40px] items-center py-[40px] px-[30px] rounded-[32px] pointer-events-auto centred-overlay-card"
          style={{ width: 340 }}
          onClick={(e) => e.stopPropagation()}
        >
          <OverlayHeader header={header} title={title} />
          <div className="flex gap-[30px] w-full justify-between">
            <button onClick={onCancel} className="h-[50px] flex-1 rounded-[100px] cursor-pointer px-[18px]" style={{ backgroundColor: '#BABABA' }}>
              <div className="flex items-center justify-center size-full">
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                  <p className="leading-[normal]">Cancel</p>
                </div>
              </div>
            </button>
            <button onClick={onConfirm} className="h-[50px] flex-1 rounded-[100px] cursor-pointer px-[18px]" style={{ backgroundColor: '#4784F8' }}>
              <div className="flex items-center justify-center size-full">
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                  <p className="leading-[normal]">{confirmLabel}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
