import type { ReactNode } from "react";
import { useRef, useState } from "react";

function AddTickButton({
    active,
    buttonRef,
}: {
    active: boolean;
    buttonRef?: (element: HTMLButtonElement | null) => void;
}) {
    return (
        <button
            ref={buttonRef}
            className={`relative block size-[35px] shrink-0 border-none bg-transparent p-0 ${active ? "cursor-pointer" : "cursor-default"}`}
            data-name="add-tick-btn"
            disabled={!active}
        >
            <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35 35">
                <g id="add-tick-btn">
                    <rect fill={active ? "#4784F8" : "#D9D9D9"} height="35" rx="17.5" width="35" />
                    <path d="M17.5 25.5L17.5 9.5M9.5 17.5H25.5" id="Vector" stroke="white" strokeLinecap="round" strokeWidth="2" />
                </g>
            </svg>
        </button>
    );
}

type AddListItemInputProps = {
    onAdd?: (text: string) => void;
    isEmpty?: boolean;
    accentColor?: string;
    idleCircleColor?: string;
    focusedCircleColor?: string;
    leadingIcon?: ReactNode;
    activeLeadingIcon?: ReactNode;
    focusedLeadingIcon?: ReactNode;
    demoValue?: string;
    demoFocused?: boolean;
    onAddButtonElementChange?: (element: HTMLButtonElement | null) => void;
    emptyPlaceholder?: string;
    nextPlaceholder?: string;
};

export default function AddListItemInput({
    onAdd,
    isEmpty,
    accentColor = "#D9D9D9",
    idleCircleColor,
    focusedCircleColor = "#BABABA",
    leadingIcon,
    activeLeadingIcon,
    focusedLeadingIcon,
    demoValue,
    demoFocused,
    onAddButtonElementChange,
    emptyPlaceholder = "Add your first item...",
    nextPlaceholder = "Add your next item...",
}: AddListItemInputProps) {
    const [itemText, setItemText] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const displayedItemText = demoValue ?? itemText;
    const displayedFocused = demoFocused ?? isFocused;
    const hasTypedText = displayedItemText.trim().length > 0;

    const handleAdd = () => {
        const trimmed = displayedItemText.trim();
        if (!trimmed) return;
        onAdd?.(trimmed);
        if (demoValue == null) {
            setItemText("");
        }
    };

    const focusInputWithoutScroll = () => {
        inputRef.current?.focus({ preventScroll: true });
        const valueLength = inputRef.current?.value.length ?? 0;
        inputRef.current?.setSelectionRange(valueLength, valueLength);
    };

    return (
        <div className="content-stretch relative flex w-full flex-col items-start pr-px" data-name="list-item">
            <div className="content-stretch relative flex h-[33px] w-full shrink-0 items-center gap-[16px]">
                <div className="relative size-[25px] shrink-0" data-name="Tick box">
                    {leadingIcon ? ((hasTypedText ? activeLeadingIcon : (displayedFocused ? (focusedLeadingIcon ?? leadingIcon) : leadingIcon)) ?? leadingIcon) : (
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                            <circle cx="12.5" cy="12.5" fill="white" r="11.5" stroke={hasTypedText ? accentColor : (displayedFocused ? focusedCircleColor : (idleCircleColor ?? accentColor))} strokeWidth="2" />
                        </svg>
                    )}
                </div>
                <div className="content-stretch relative flex min-h-px min-w-px flex-[1_0_0] flex-col items-start justify-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={displayedItemText}
                        autoCorrect="on"
                        spellCheck={true}
                        onChange={(event) => setItemText(event.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onPointerDownCapture={(event) => {
                            event.preventDefault();
                            focusInputWithoutScroll();
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") handleAdd();
                        }}
                        placeholder={isEmpty ? emptyPlaceholder : nextPlaceholder}
                        className="font-['Lato:Bold',sans-serif] w-full border-none bg-transparent text-[17px] not-italic text-[#1C2C42] caret-[#1C2C42] outline-none placeholder-[#D9D9D9]"
                    />
                </div>
                {/* 4px inset (plus the row's 1px) centres the 35px + under the 45px header tick button */}
                <div className="flex items-center mr-[4px]" onClick={handleAdd}>
                    <AddTickButton active={hasTypedText} buttonRef={onAddButtonElementChange} />
                </div>
            </div>
        </div>
    );
}
