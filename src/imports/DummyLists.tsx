import { useState, useEffect, useRef } from "react";
import { InfoIconWithOverlay, DevHeader } from "../app/components/DevToolsOverlay";
import { isListsEnabled } from "../app/utils/featureFlags";
import { generateDummyLists } from "../app/utils/dummy-list-generator";
import type { GeneratedDummyListsPayload } from "../app/utils/dummy-list-generator";


export default function DummyLists({ onBack, onClose, onClearLists, onGenerateLists }: { onBack: () => void; onClose: () => void; onClearLists: () => void; onGenerateLists: (payload: GeneratedDummyListsPayload) => void }) {
  const [numberOfLists, setNumberOfLists] = useState("11");
  const [maxListItems, setMaxListItems] = useState("15");
  const [includeDone, setIncludeDone] = useState(true);
  const [includeSmartReminderLists, setIncludeSmartReminderLists] = useState(true);
  const [includeSavedLists, setIncludeSavedLists] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [clearState, setClearState] = useState<'idle' | 'confirming' | 'cleared'>('idle');
  const clearBtnRef = useRef<HTMLButtonElement>(null);

  const listsEnabled = isListsEnabled();

  useEffect(() => {
    if (clearState !== 'confirming') return;
    const handleClickOutside = (e: MouseEvent) => {
      if (clearBtnRef.current && !clearBtnRef.current.contains(e.target as Node)) {
        setClearState('idle');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearState]);

  const handleClear = () => {
    if (clearState === 'idle') {
      setClearState('confirming');
    } else if (clearState === 'confirming') {
      onClearLists();
      setClearState('cleared');
      setTimeout(() => setClearState('idle'), 2000);
    }
  };

  const clearLabel =
    clearState === 'idle' ? 'Clear lists' :
    clearState === 'confirming' ? 'Are you sure?' :
    'Cleared!';

  const clearBgColor =
    clearState === 'cleared' ? '#2A4466' :
    clearState === 'confirming' ? '#35506E' : '#4784F8';

  const parseCount = (val: string): number => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const handleGenerate = () => {
    if (showDone) return;
    const lists = generateDummyLists(
      parseCount(numberOfLists),
      parseCount(maxListItems),
      includeDone,
      includeSmartReminderLists,
      includeSavedLists,
    );
    onGenerateLists(lists);
    setShowDone(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start pb-[24px] pt-[24px] px-[20px] relative size-full" data-name="dummy lists">
      <DevHeader title="Dummy lists" onBack={onBack} onClose={onClose} />
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-center min-h-px min-w-px relative w-full" style={!listsEnabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
        <div className="content-stretch flex flex-col items-start relative w-full" data-name="Scrollable List Area" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div className="bg-white rounded-[6px] p-[20px] flex flex-col gap-[30px] items-start w-full shrink-0">
          <div className="content-stretch flex flex-col gap-[10px] items-start relative w-full">
            {/* Number of lists */}
            <div className="h-[51px] relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center justify-between px-px py-[13px] relative size-full">
                  <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative min-w-0 text-[#1C2C42] text-[17px] whitespace-nowrap">
                    <p className="leading-[normal]">Number of lists</p>
                  </div>
                  <div className="bg-white content-stretch flex h-[36px] items-center justify-center p-[13px] relative rounded-[4px] shrink-0 w-[60px]" data-name="text-box">
                    <div aria-hidden="true" className="absolute border border-[#eaeaea] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={numberOfLists}
                      onChange={(e) => setNumberOfLists(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-center font-['Lato:SemiBold',sans-serif] leading-[26px] not-italic text-[#1C2C42] text-[17px] p-0 m-0"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Max number of list items */}
            <div className="h-[51px] relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center justify-between px-px py-[13px] relative size-full">
                  <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative min-w-0 text-[#1C2C42] text-[17px] whitespace-nowrap">
                    <p className="leading-[normal]">Max number of list items</p>
                  </div>
                  <div className="bg-white content-stretch flex h-[36px] items-center justify-center p-[13px] relative rounded-[4px] shrink-0 w-[60px]" data-name="text-box">
                    <div aria-hidden="true" className="absolute border border-[#eaeaea] border-solid inset-0 pointer-events-none rounded-[4px]" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxListItems}
                      onChange={(e) => setMaxListItems(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-center font-['Lato:SemiBold',sans-serif] leading-[26px] not-italic text-[#1C2C42] text-[17px] p-0 m-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-[30px] items-center justify-between w-full">
            <div className="flex items-center gap-[16px]">
              <p
                className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic text-[17px] whitespace-nowrap"
                style={{ color: '#1C2C42' }}
              >
                Include done list items
              </p>
              <InfoIconWithOverlay color="#939393" header="Include done list items" title="When enabled, generated dummy lists will include items marked as done alongside active items. Use this to test how completed items appear within lists and how they affect smart reminder progress counts." />
            </div>
            <button
              onClick={() => setIncludeDone(!includeDone)}
              className={`flex h-[30px] items-center p-[3.75px] rounded-[37.5px] shrink-0 w-[56px] transition-colors cursor-pointer ${includeDone ? 'bg-[#4784f8] justify-end' : 'bg-[#BABABA] justify-start'}`}
            >
              <div className="relative shrink-0 size-[22.5px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
                  <circle cx="11.25" cy="11.25" fill="white" r="11.25" />
                </svg>
              </div>
            </button>
          </div>
          <div className="flex h-[30px] items-center justify-between w-full">
            <div className="flex items-center gap-[16px]">
              <p
                className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic text-[17px] whitespace-nowrap"
                style={{ color: '#1C2C42' }}
              >
                Include smart reminder lists
              </p>
              <InfoIconWithOverlay color="#939393" header="Include smart reminder lists" title="When enabled, generated dummy lists will include lists that are linked to a smart reminder. This lets you test the smart reminder progress display and list-to-reminder navigation. Requires Smart reminders to be enabled in the Lists page." />
            </div>
            <button
              onClick={() => setIncludeSmartReminderLists(!includeSmartReminderLists)}
              className={`flex h-[30px] items-center p-[3.75px] rounded-[37.5px] shrink-0 w-[56px] transition-colors cursor-pointer ${includeSmartReminderLists ? 'bg-[#4784f8] justify-end' : 'bg-[#BABABA] justify-start'}`}
            >
              <div className="relative shrink-0 size-[22.5px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
                  <circle cx="11.25" cy="11.25" fill="white" r="11.25" />
                </svg>
              </div>
            </button>
          </div>
          <div className="flex h-[30px] items-center justify-between w-full">
            <div className="flex items-center gap-[16px]">
              <p
                className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic text-[17px] whitespace-nowrap"
                style={{ color: '#1C2C42' }}
              >
                Include List templates
              </p>
              <InfoIconWithOverlay color="#939393" header="Include List templates" title="When enabled, generated dummy lists will include saved list templates. Use this to test template display and selection in the list creation flow. Requires List templates to be enabled in the Lists page." />
            </div>
            <button
              onClick={() => setIncludeSavedLists(!includeSavedLists)}
              className={`flex h-[30px] items-center p-[3.75px] rounded-[37.5px] shrink-0 w-[56px] transition-colors cursor-pointer ${includeSavedLists ? 'bg-[#4784f8] justify-end' : 'bg-[#BABABA] justify-start'}`}
            >
              <div className="relative shrink-0 size-[22.5px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
                  <circle cx="11.25" cy="11.25" fill="white" r="11.25" />
                </svg>
              </div>
            </button>
          </div>
          </div>
        </div>
        {/* Clear lists and Generate lists buttons */}
        <div className="flex gap-[30px] items-center relative shrink-0 w-full">
          <button
            ref={clearBtnRef}
            onClick={handleClear}
            className="relative rounded-[100px] flex-1 cursor-pointer"
            data-name="clear-btn"
            style={{ height: 'clamp(40px, calc(20vh - 73.6px), 60px)', backgroundColor: clearBgColor }}
          >
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                  <p className="leading-[normal]">{clearLabel}</p>
                </div>
              </div>
            </div>
          </button>
          <button
            onClick={handleGenerate}
            className={`${showDone ? 'bg-[#6AB016]' : 'bg-[#7EC91C]'} relative rounded-[100px] flex-1 cursor-pointer`}
            data-name="generate-btn"
            style={{ height: 'clamp(40px, calc(20vh - 73.6px), 60px)' }}
          >
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                  <p className="leading-[normal]">{showDone ? 'Done' : 'Generate lists'}</p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
