import svgPaths from "./svg-z3vqooufv8";
import { useEffect, useRef, useState } from "react";

// 45 x 45 header buttons (standard Settings / tick style). Inactive: #D9D9D9 circle with white icon
function AddTickBtn({ active, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <button
      className={`relative shrink-0 size-[45px] p-0 m-0 border-none bg-transparent flex items-center justify-center ${active ? 'cursor-pointer' : 'cursor-default'}`}
      data-name="add-tick-btn"
      disabled={!active}
      onClick={active ? onClick : undefined}
      type="button"
      aria-label="Save list"
    >
      {/* viewBox crops the original 50px artwork so the tick icon keeps its size and stays centred */}
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="2.5 2.5 45 45" aria-hidden="true">
        <rect fill={active ? "#4784F8" : "#D9D9D9"} x="2.5" y="2.5" height="45" rx="22.5" width="45" />
        <path d={svgPaths.p1635b2f0} fill="white" />
      </svg>
    </button>
  );
}

function MenuDotsBtn({ active, onClick }: { active: boolean; onClick?: () => void }) {
  return (
    <button
      className={`relative shrink-0 size-[45px] p-0 m-0 border-none bg-transparent flex items-center justify-center ${active ? "cursor-pointer" : "cursor-default"}`}
      data-name="menu-dots-btn"
      disabled={!active}
      onClick={active ? onClick : undefined}
      type="button"
      aria-label="List settings"
    >
      <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="45" height="45" rx="22.5" fill={active ? "#4784F8" : "#D9D9D9"} />
        <circle cx="16" cy="22.5" r="1.75" fill="white" />
        <circle cx="22.5" cy="22.5" r="1.75" fill="white" />
        <circle cx="29" cy="22.5" r="1.75" fill="white" />
      </svg>
    </button>
  );
}

function SmartRemindersIndicator() {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M5.01045 5.36829C5.34496 5.20257 5.73795 5.20253 6.07245 5.36829C6.21799 5.44044 6.34594 5.55543 6.46998 5.67748L12.3491 11.5566C12.4712 11.6807 12.5862 11.8086 12.6583 11.9541C12.8241 12.2886 12.824 12.6816 12.6583 13.0161C12.5621 13.2102 12.3901 13.3733 12.2262 13.5372C12.0623 13.7011 11.8992 13.8732 11.7051 13.9693C11.3706 14.135 10.9776 14.1351 10.6431 13.9693C10.4976 13.8972 10.3696 13.7822 10.2456 13.6601L4.36646 7.78101C4.2444 7.65696 4.12941 7.52901 4.05726 7.38348C3.8915 7.04897 3.89154 6.65599 4.05726 6.32147C4.15343 6.12741 4.32547 5.96428 4.48936 5.80039C4.65326 5.6365 4.81639 5.46445 5.01045 5.36829ZM6.94049 8.96464L10.8179 12.842C10.9177 12.9418 10.9784 13.002 11.0266 13.045C11.0602 13.075 11.0756 13.0853 11.0797 13.0878C11.1391 13.1173 11.2091 13.1173 11.2685 13.0878C11.2722 13.0856 11.2881 13.0755 11.3223 13.045C11.3704 13.002 11.4312 12.9418 11.531 12.842C11.6308 12.7423 11.691 12.6815 11.7339 12.6333C11.7645 12.5991 11.7746 12.5833 11.7768 12.5796C11.8063 12.5201 11.8063 12.4502 11.7768 12.3907C11.7743 12.3867 11.7639 12.3712 11.7339 12.3376C11.691 12.2895 11.6308 12.2287 11.531 12.1289L7.65362 8.25152L6.94049 8.96464ZM5.63587 6.24977C5.57642 6.22031 5.50648 6.22031 5.44703 6.24977C5.44334 6.25202 5.42751 6.26208 5.39325 6.29266C5.34514 6.33564 5.28434 6.39582 5.18457 6.49559C5.08479 6.59536 5.02461 6.65617 4.98164 6.70428C4.95105 6.73854 4.941 6.75437 4.93875 6.75805C4.90929 6.8175 4.90929 6.88745 4.93875 6.9469C4.94125 6.95095 4.95163 6.96642 4.98164 7.00003C5.0246 7.04814 5.08476 7.10891 5.18457 7.20872L6.24529 8.26944L6.95842 7.55632L5.89769 6.49559C5.79789 6.39579 5.73712 6.33563 5.689 6.29266C5.6554 6.26266 5.63993 6.25228 5.63587 6.24977Z" fill="#BABABA"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M2.45817 1.31102C2.66378 1.31102 2.8476 1.43899 2.91908 1.63174L3.06439 2.02351C3.27003 2.57924 3.32945 2.71106 3.42288 2.80449C3.5163 2.89792 3.64813 2.95734 4.20386 3.16298L4.59563 3.30829C4.78838 3.37977 4.91634 3.56359 4.91634 3.7692C4.91634 3.9748 4.78838 4.15863 4.59563 4.2301L4.20386 4.37542C3.64813 4.58106 3.5163 4.64047 3.42288 4.7339C3.32945 4.82733 3.27003 4.95916 3.06439 5.51488L2.91908 5.90665C2.8476 6.09941 2.66378 6.22737 2.45817 6.22737C2.25257 6.22737 2.06874 6.09941 1.99726 5.90665L1.85195 5.51488C1.64631 4.95916 1.58689 4.82733 1.49347 4.7339C1.40004 4.64047 1.26821 4.58106 0.712486 4.37542L0.320715 4.2301C0.127961 4.15863 0 3.9748 0 3.7692C0 3.56359 0.127961 3.37977 0.320715 3.30829L0.712486 3.16298C1.26821 2.95734 1.40004 2.89792 1.49347 2.80449C1.58689 2.71106 1.64631 2.57924 1.85195 2.02351L1.99726 1.63174L2.02927 1.5626C2.11517 1.40902 2.27829 1.31102 2.45817 1.31102ZM2.45817 3.12841C2.38328 3.26674 2.29746 3.3909 2.18867 3.49969C2.07987 3.60849 1.95571 3.6943 1.81738 3.7692C1.95571 3.84409 2.07987 3.9299 2.18867 4.0387C2.29733 4.14736 2.38334 4.27122 2.45817 4.40935C2.533 4.27122 2.61901 4.14736 2.72767 4.0387C2.83634 3.93003 2.96019 3.84403 3.09832 3.7692C2.96019 3.69437 2.83634 3.60836 2.72767 3.49969C2.61888 3.3909 2.53306 3.26674 2.45817 3.12841Z" fill="#BABABA"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M9.66881 0C9.87441 0 10.0582 0.127961 10.1297 0.320715L10.323 0.843076C10.592 1.56998 10.6838 1.78699 10.8396 1.94285C10.9955 2.09872 11.2125 2.19047 11.9394 2.45945L12.4618 2.65278C12.6545 2.72426 12.7825 2.90808 12.7825 3.11368C12.7825 3.31929 12.6545 3.50311 12.4618 3.57459L11.9394 3.76792C11.2125 4.0369 10.9955 4.12865 10.8396 4.28452C10.6838 4.44038 10.592 4.65738 10.323 5.38429L10.1297 5.90665C10.0582 6.09941 9.87441 6.22737 9.66881 6.22737C9.4632 6.22737 9.27938 6.09941 9.2079 5.90665L9.01458 5.38429C8.7456 4.65738 8.65384 4.44038 8.49798 4.28452C8.34211 4.12865 8.12511 4.0369 7.3982 3.76792L6.87584 3.57459C6.68309 3.50311 6.55512 3.31929 6.55512 3.11368C6.55512 2.90808 6.68309 2.72426 6.87584 2.65278L7.3982 2.45945C8.12511 2.19047 8.34211 2.09872 8.49798 1.94285C8.65384 1.78699 8.7456 1.56998 9.01458 0.843076L9.2079 0.320715L9.23991 0.251579C9.32581 0.0979978 9.48893 0 9.66881 0ZM9.66881 1.87756C9.53824 2.18256 9.39863 2.4326 9.19318 2.63805C8.98772 2.84351 8.73769 2.98312 8.43268 3.11368C8.73769 3.24425 8.98772 3.38386 9.19318 3.58931C9.39851 3.79465 9.53831 4.04441 9.66881 4.34917C9.79931 4.04441 9.9391 3.79465 10.1444 3.58931C10.3498 3.38398 10.5995 3.24419 10.9043 3.11368C10.5995 2.98318 10.3498 2.84339 10.1444 2.63805C9.93898 2.4326 9.79938 2.18256 9.66881 1.87756Z" fill="#BABABA"/>
    </svg>
  );
}

function SavedListSubtitleIndicator() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
      <path d="M10.9483 13.7931C11.2816 13.7931 11.5517 14.0633 11.5517 14.3966C11.5517 14.7298 11.2816 15 10.9483 15H8.87931C8.54604 15 8.27586 14.7298 8.27586 14.3966C8.27586 14.0633 8.54604 13.7931 8.87931 13.7931H10.9483Z" fill="#BABABA"/>
      <path d="M5.3125 12.4259C5.63917 12.3604 5.95675 12.572 6.02236 12.8987C6.08603 13.2155 6.18583 13.3756 6.33553 13.4988C6.50106 13.6349 6.74492 13.738 7.20636 13.7985C7.53667 13.8418 7.76942 14.1444 7.72629 14.4747C7.68296 14.8051 7.37988 15.0379 7.04944 14.9946C6.47923 14.9198 5.98121 14.7692 5.5691 14.4302C5.15026 14.0856 4.94238 13.647 4.83971 13.1358C4.77422 12.8091 4.98583 12.4915 5.3125 12.4259Z" fill="#BABABA"/>
      <path d="M13.8052 12.8987C13.8708 12.572 14.1884 12.3604 14.5151 12.4259C14.8418 12.4915 15.0534 12.8091 14.9879 13.1358C14.8852 13.647 14.6773 14.0856 14.2585 14.4302C13.8464 14.7692 13.3484 14.9198 12.7782 14.9946C12.4477 15.0379 12.1446 14.8051 12.1013 14.4747C12.0582 14.1444 12.2909 13.8418 12.6212 13.7985C13.0827 13.738 13.3265 13.6349 13.4921 13.4988C13.6418 13.3756 13.7416 13.2155 13.8052 12.8987Z" fill="#BABABA"/>
      <path d="M5.77586 1.10109e-06C6.89469 1.1833e-06 7.7869 -0.00126322 8.49273 0.082167C9.21188 0.167173 9.81577 0.34712 10.3226 0.763067C10.4928 0.902775 10.649 1.05889 10.7887 1.22912C11.1828 1.70939 11.3651 2.2768 11.4554 2.9472C11.5439 3.60419 11.5509 4.42103 11.5517 5.43036C11.5517 5.60782 11.4743 5.76714 11.3524 5.87756C11.3362 5.89224 11.3196 5.90645 11.3019 5.91932C11.2338 5.96867 11.1555 6.00487 11.0702 6.02236C11.031 6.0304 10.9905 6.03443 10.9489 6.03448L10.9483 6.03381L8.87931 6.03448C8.54604 6.03448 8.27586 5.76431 8.27586 5.43104C8.27586 5.09776 8.54604 4.82759 8.87931 4.82759H10.3421C10.3368 4.10548 10.3193 3.55394 10.2593 3.10884C10.1854 2.56058 10.0552 2.23785 9.85587 1.99488C9.76632 1.88576 9.66597 1.78541 9.55684 1.69585C9.30073 1.48572 8.95623 1.35251 8.35129 1.28098C7.73276 1.20787 6.92426 1.2069 5.77586 1.2069C4.62747 1.2069 3.81896 1.20787 3.20043 1.28098C2.59549 1.35251 2.251 1.48572 1.99488 1.69585C1.88576 1.78541 1.78541 1.88576 1.69585 1.99488C1.48572 2.251 1.35251 2.59549 1.28098 3.20043C1.20787 3.81896 1.2069 4.62747 1.2069 5.77586C1.2069 6.92426 1.20787 7.73276 1.28098 8.35129C1.35251 8.95623 1.48572 9.30073 1.69585 9.55684C1.78541 9.66597 1.88576 9.76632 1.99488 9.85587C2.23785 10.0552 2.56058 10.1854 3.10884 10.2593C3.55394 10.3193 4.10549 10.3361 4.82759 10.3415V8.87931C4.82759 8.54604 5.09776 8.27586 5.43104 8.27586C5.76431 8.27586 6.03448 8.54604 6.03448 8.87931V10.9483C6.03448 11.0524 6.00817 11.1504 5.96175 11.2359C5.93869 11.2783 5.90973 11.3168 5.87756 11.3524C5.85919 11.3727 5.83992 11.392 5.81897 11.4096C5.8137 11.414 5.80822 11.4182 5.8028 11.4224C5.70024 11.5029 5.57155 11.5517 5.43104 11.5517L5.43036 11.5511C4.42103 11.5503 3.60419 11.5439 2.9472 11.4554C2.2768 11.3651 1.70939 11.1828 1.22912 10.7887C1.05889 10.649 0.902775 10.4928 0.763067 10.3226C0.34712 9.81577 0.167173 9.21188 0.082167 8.49273C-0.00126321 7.7869 1.01834e-06 6.89469 1.10094e-06 5.77586C1.18216e-06 4.65704 -0.00126324 3.76483 0.082167 3.059C0.167174 2.33985 0.347119 1.73596 0.763067 1.22912C0.902775 1.05889 1.05889 0.902775 1.22912 0.763067C1.73596 0.34712 2.33985 0.167173 3.059 0.082167C3.76483 -0.00126327 4.65704 1.01849e-06 5.77586 1.10109e-06Z" fill="#BABABA"/>
      <path d="M14.3966 8.27586C14.7298 8.27586 15 8.54604 15 8.87931V10.9483C15 11.2816 14.7298 11.5517 14.3966 11.5517C14.0633 11.5517 13.7931 11.2816 13.7931 10.9483V8.87931C13.7931 8.54604 14.0633 8.27586 14.3966 8.27586Z" fill="#BABABA"/>
      <path d="M7.04944 4.83297C7.37988 4.78964 7.68296 5.02246 7.72629 5.35291C7.76942 5.68321 7.53667 5.98576 7.20636 6.0291C6.74492 6.08961 6.50106 6.19266 6.33553 6.3288C6.18583 6.45195 6.08603 6.61207 6.02236 6.92888C5.95675 7.25555 5.63917 7.46716 5.3125 7.40167C4.98583 7.33606 4.77422 7.01848 4.83971 6.69181C4.94238 6.18063 5.15026 5.74194 5.5691 5.39736C5.98121 5.05834 6.47923 4.90775 7.04944 4.83297Z" fill="#BABABA"/>
      <path d="M12.7782 4.83297C13.3484 4.90775 13.8464 5.05834 14.2585 5.39736C14.6773 5.74194 14.8852 6.18063 14.9879 6.69181C15.0534 7.01848 14.8418 7.33606 14.5151 7.40167C14.1884 7.46716 13.8708 7.25555 13.8052 6.92888C13.7416 6.61207 13.6418 6.45195 13.4921 6.3288C13.3265 6.19266 13.0827 6.0896 12.6212 6.0291C12.2909 5.98576 12.0582 5.68321 12.1013 5.35291C12.1446 5.02246 12.4477 4.78964 12.7782 4.83297Z" fill="#BABABA"/>
    </svg>
  );
}

export default function Header({ value, onChange, active, onSubmit, isEditMode, onGearClick, onClose, subtitleText, subtitleHighlightColor, showSmartRemindersSubtitle, reserveSmartRemindersSubtitleSpace, showMenuButton = true, showSavedListSubtitleIcon = false }: { value: string; onChange: (v: string) => void; active: boolean; onSubmit: () => void; isEditMode?: boolean; onGearClick?: () => void; onClose?: () => void; subtitleText?: string; subtitleHighlightColor?: string | null; showSmartRemindersSubtitle?: boolean; reserveSmartRemindersSubtitleSpace?: boolean; showMenuButton?: boolean; showSavedListSubtitleIcon?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasTypedSinceFocus, setHasTypedSinceFocus] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const lastCommittedValueRef = useRef(value);

  const showGrey = isEditMode && isFocused && !hasTypedSinceFocus;
  const textColor = showGrey ? '#B7B7B7' : '#1C2C42';

  useEffect(() => {
    if (isFocused) return;
    setDraftValue(value);
    lastCommittedValueRef.current = value;
  }, [value, isFocused]);

  const commitDraft = () => {
    const normalizedValue = draftValue.trim();
    if (normalizedValue.length === 0) {
      setDraftValue(lastCommittedValueRef.current);
      onChange(lastCommittedValueRef.current);
      return;
    }
    if (draftValue === lastCommittedValueRef.current) return;
    lastCommittedValueRef.current = draftValue;
    onChange(draftValue);
  };

  // Subtitle pulled up 4.25px so the title-baseline to subtitle-cap gap (14.27px) matches the Lists list rows.
  // It overlaps the bottom of the 45px title row (no glyph overlap), so it ignores taps to keep the buttons fully tappable.
  return (
    <div className="flex flex-col relative w-full" data-name="header">
      <div className="flex items-center justify-between relative w-full h-[45px] gap-[12px]">
        <div className="flex flex-1 min-w-0 h-[45px] items-center">
          <input
            ref={inputRef}
            type="text"
            value={draftValue}
            autoCorrect="on"
            spellCheck={true}
            onFocus={() => { setIsFocused(true); setHasTypedSinceFocus(false); }}
            onBlur={() => { commitDraft(); setIsFocused(false); setHasTypedSinceFocus(false); }}
            onChange={(e) => { if (!hasTypedSinceFocus) setHasTypedSinceFocus(true); setDraftValue(e.target.value); onChange(e.target.value); }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              commitDraft();
              event.currentTarget.blur();
            }}
            placeholder=""
            className="font-['Lato',sans-serif] not-italic text-[20px] leading-[23px] whitespace-nowrap bg-transparent border-none outline-none w-full min-w-0 p-0 m-0 placeholder-[#bababa] caret-[#1C2C42]"
            style={{ color: textColor, transition: "color 300ms", fontWeight: 700 }}
          />
        </div>
        <div className="flex items-center gap-[10px] shrink-0">
          {showMenuButton ? <MenuDotsBtn active={active} onClick={onGearClick} /> : null}
          <AddTickBtn active={active} onClick={onClose} />
        </div>
      </div>
      {subtitleText || reserveSmartRemindersSubtitleSpace ? (
        <div
          className="flex items-center gap-[8px] min-w-0 pr-[36px] pointer-events-none"
          style={subtitleText ? { marginTop: "-4.25px" } : { marginTop: "-4.25px", visibility: "hidden" }}
        >
          <p className="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: '15px', fontWeight: 700, fontFamily: "'Lato', sans-serif", color: '#BABABA' }}>
            {subtitleText?.includes('. Due by ') ? (
              <>
                {subtitleText.split('. Due by ')[0]}
                {'. '}
                <span style={{ color: subtitleHighlightColor ?? '#BABABA' }}>
                  {`Due by ${subtitleText.split('. Due by ')[1]}`}
                </span>
              </>
            ) : (
              subtitleText ?? "Complete this list by..."
            )}
          </p>
          {showSmartRemindersSubtitle ? <SmartRemindersIndicator /> : null}
          {showSavedListSubtitleIcon ? <SavedListSubtitleIndicator /> : null}
        </div>
      ) : null}
    </div>
  );
}
