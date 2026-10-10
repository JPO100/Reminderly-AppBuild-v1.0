interface DeletedInfoOverlayProps {
  title: string;
  buttonColor: string;
  buttonLabel: string;
  onClose: () => void;
  onMarkAsNotDone: () => void;
}

export default function DeletedInfoOverlay({
  title,
  buttonColor,
  buttonLabel,
  onClose,
  onMarkAsNotDone,
}: DeletedInfoOverlayProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-[20px]">
        <div
          className="bg-white relative flex flex-col gap-[40px] items-center pt-[40px] pb-[40px] px-[30px] rounded-[32px] pointer-events-auto outline-none"
          style={{ width: 340 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#1C2C42] text-[20px] text-center">
            <p className="leading-[normal] whitespace-pre-wrap" style={{ fontWeight: 700 }}>
              {title}
            </p>
          </div>

          <div className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full">
            <button
              className="cursor-pointer h-[50px] relative rounded-[100px] shrink-0 w-full border-none"
              style={{ backgroundColor: buttonColor }}
              onClick={onMarkAsNotDone}
            >
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                  <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                    <p className="leading-[normal]">{buttonLabel}</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
