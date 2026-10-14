import doneSvgPaths from "./svg-a4qyyq2khw";
import repeatIconPaths from "./svg-cep8nozhxy";
import { useState, useEffect, useRef } from "react";
import { InfoIconWithOverlay, DevHeader } from "../app/components/DevToolsOverlay";
import type { Reminder } from "../app/reminder-utils";
import { generateDummyReminders } from "../app/utils/dummy-generator";


function ReminderRow({ label, color, defaultCount, value, onChange, textColor, isDone, strikethrough, repeatActive, onToggleRepeat }: { label: string; color: string; defaultCount: string; value: string; onChange: (val: string) => void; textColor?: string; isDone?: boolean; strikethrough?: boolean; repeatActive?: boolean; onToggleRepeat?: () => void }) {
  return (
    <div className="h-[51px] relative rounded-[100px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-px py-[13px] relative size-full">
          <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="Reminder details">
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex gap-[16px] items-center pr-[16px] relative w-full">
                <div className="relative shrink-0 size-[25px]" data-name="Tick box">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
                    {isDone ? (
                      <g>
                        <rect fill="#1C2C42" height="23" rx="11.5" width="23" x="1" y="1" />
                        <rect height="23" rx="11.5" stroke="#1C2C42" strokeWidth="2" width="23" x="1" y="1" />
                        <path d={doneSvgPaths.p1bc11a00} fill="white" />
                      </g>
                    ) : (
                      <circle cx="12.5" cy="12.5" fill="var(--fill-0, white)" r="11.5" stroke={color} strokeWidth="2" />
                    )}
                  </svg>
                </div>
                <div className={`flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[17px] text-ellipsis whitespace-nowrap${isDone || strikethrough ? ' line-through' : ''}`} style={{ color: textColor || '#1C2C42' }}>
                  <p className="leading-[normal] overflow-hidden">{label}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[20px] shrink-0 w-[105px]">
            <div className="bg-white content-stretch flex h-[36px] items-center justify-center p-[13px] relative rounded-[4px] shrink-0 w-[60px]" data-name="text-box">
              <div aria-hidden="true" className="absolute border border-[#eaeaea] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-center font-['Lato:SemiBold',sans-serif] leading-[26px] not-italic text-[#1C2C42] text-[17px] p-0 m-0"
                placeholder={defaultCount}
              />
            </div>
            {onToggleRepeat && (
            <button className="relative shrink-0 size-[25px] cursor-pointer bg-transparent border-none p-0 flex items-center justify-center" data-name="icon-repeats" onClick={onToggleRepeat} aria-label="Toggle repeat">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25.0003 25.0708">
                <g>
                  <path d={repeatIconPaths.p19a7b000} fill={repeatActive ? "#1C2C42" : "#BABABA"} />
                  <path d={repeatIconPaths.p9f3c880} fill={repeatActive ? "#1C2C42" : "#BABABA"} />
                  <path d={repeatIconPaths.pf2d2300} fill={repeatActive ? "#1C2C42" : "#BABABA"} />
                </g>
              </svg>
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DummyReminders({ onBack, onClose, addReminders, hideOverdue, onHideOverdueChange, onClearReminders }: { onBack: () => void; onClose: () => void; addReminders: (reminders: Reminder[]) => void; hideOverdue: boolean; onHideOverdueChange: (value: boolean) => void; onClearReminders: () => void }) {
  const [counts, setCounts] = useState({ overdue: "01", today: "03", thisWeek: "02", later: "04", sometime: "02", done: "05", deleted: "03" });
  const [showDone, setShowDone] = useState(false);
  const [repeats, setRepeats] = useState({ overdue: true, today: true, thisWeek: true, later: true, done: true, deleted: true });
  const [clearState, setClearState] = useState<'idle' | 'confirming' | 'cleared'>('idle');
  const clearBtnRef = useRef<HTMLButtonElement>(null);

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
      onClearReminders();
      setClearState('cleared');
      setTimeout(() => setClearState('idle'), 2000);
    }
  };

  const clearLabel =
    clearState === 'idle' ? 'Clear list' :
    clearState === 'confirming' ? 'Are you sure?' :
    'Cleared!';

  const clearBgColor =
    clearState === 'cleared' ? '#2A4466' :
    clearState === 'confirming' ? '#35506E' : '#4784F8';

  const toggleRepeat = (key: keyof typeof repeats) => () => {
    setRepeats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateCount = (key: keyof typeof counts) => (val: string) => {
    setCounts(prev => ({ ...prev, [key]: val }));
  };

  const parseCount = (val: string): number => {
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const handleGenerate = () => {
    if (showDone) return;
    const reminders = generateDummyReminders({
      overdue: parseCount(counts.overdue),
      today: parseCount(counts.today),
      thisWeek: parseCount(counts.thisWeek),
      later: parseCount(counts.later),
      sometime: parseCount(counts.sometime),
      done: parseCount(counts.done),
      deleted: parseCount(counts.deleted),
    }, repeats);
    addReminders(reminders);
    setShowDone(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start pb-[24px] pt-[24px] px-[20px] relative size-full" data-name="dummy reminders">
      <DevHeader title="Dummy reminders" onBack={onBack} onClose={onClose} />
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[32px] items-center min-h-px min-w-px relative w-full">
        <div className="content-stretch flex flex-col items-start relative w-full" data-name="Scrollable List Area" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div className="bg-white rounded-[6px] p-[20px] flex flex-col gap-[10px] items-start w-full shrink-0">
          {/* Hide overdue toggle */}
          <div className="content-stretch flex h-[40px] items-center justify-between relative shrink-0 w-full">
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
              <p className="font-['Lato:Bold',sans-serif] leading-[23px] not-italic text-[17px]" style={{ color: hideOverdue ? '#1C2C42' : '#C9C9C9' }}>Hide overdue reminders</p>
              <InfoIconWithOverlay color={hideOverdue ? '#939393' : '#D9D9D9'} header="Hide overdue reminders" title="When enabled, reminders in the 'Overdue' category are hidden from the generated dummy set. Use this to test the active list layout without overdue reminders appearing. Does not affect other reminder categories." />
            </div>
            <button
              onClick={() => onHideOverdueChange(!hideOverdue)}
              className={`content-stretch flex h-[30px] items-center p-[3.75px] relative rounded-[37.5px] shrink-0 w-[56px] transition-colors cursor-pointer ${hideOverdue ? 'bg-[#4784f8] justify-end' : 'bg-[#C9C9C9] justify-start'}`}
            >
              <div className="relative shrink-0 size-[22.5px]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
                  <circle cx="11.25" cy="11.25" fill="white" r="11.25" />
                </svg>
              </div>
            </button>
          </div>
          <ReminderRow label="'Overdue' reminders" color="#FF0000" defaultCount="01" value={counts.overdue} onChange={updateCount('overdue')} textColor="#FF0000" repeatActive={repeats.overdue} onToggleRepeat={toggleRepeat('overdue')} />
          <ReminderRow label="'Today' reminders" color="#00AFEE" defaultCount="03" value={counts.today} onChange={updateCount('today')} repeatActive={repeats.today} onToggleRepeat={toggleRepeat('today')} />
          <ReminderRow label="'This week' reminders" color="#DF4DFC" defaultCount="02" value={counts.thisWeek} onChange={updateCount('thisWeek')} repeatActive={repeats.thisWeek} onToggleRepeat={toggleRepeat('thisWeek')} />
          <ReminderRow label="'Later' reminders" color="#FAA429" defaultCount="04" value={counts.later} onChange={updateCount('later')} repeatActive={repeats.later} onToggleRepeat={toggleRepeat('later')} />
          <ReminderRow label="'Sometime' reminders" color="#939393" defaultCount="02" value={counts.sometime} onChange={updateCount('sometime')} />
          <ReminderRow label="'Done' reminders" color="#4784F8" defaultCount="05" value={counts.done} onChange={updateCount('done')} isDone repeatActive={repeats.done} onToggleRepeat={toggleRepeat('done')} />
          <ReminderRow label="'Deleted' reminders" color="#939393" defaultCount="03" value={counts.deleted} onChange={updateCount('deleted')} strikethrough textColor="#939393" repeatActive={repeats.deleted} onToggleRepeat={toggleRepeat('deleted')} />
          </div>
        </div>
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
          <button onClick={handleGenerate} className={`${showDone ? 'bg-[#6AB016]' : 'bg-[#7EC91C]'} relative rounded-[100px] flex-1 cursor-pointer`} data-name="generate-btn" style={{ height: 'clamp(40px, calc(20vh - 73.6px), 60px)' }}>
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center px-[18px] py-[15px] relative size-full">
                <div className="flex flex-col font-['Lato:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[17px] text-white whitespace-nowrap">
                  <p className="leading-[normal]">{showDone ? 'Done' : 'Generate list'}</p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}