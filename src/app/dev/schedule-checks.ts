/**
 * Schedule Utility Checks (Phase 1)
 * 
 * Deterministic checks for schedule.ts pure functions.
 * No Date.now, no network, no localStorage writes.
 * 
 * STATELESS: Returns fresh check array on each call - no side effects.
 */

import type { Check } from './check-system';
import { scheduleEquality, detectScheduleDeltas, scheduleDerived } from '../utils/schedule';
import type { Schedule } from '../types/reminder';
import { getDatePresetValue } from '../utils/date-presets';
import type { DatePreset } from '../utils/date-presets';

/**
 * Simple assertion helper for checks
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Deep equality helper for objects
 */
function assertPreset(preset: DatePreset, now: Date, y: number, m: number, d: number, hour: number): void {
  const { date, time } = getDatePresetValue(preset, now);
  const got = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()} at ${time.hour}:${time.minute}`;
  const expected = `${y}-${m}-${d} 0:0 at ${hour}:0`;
  assert(got === expected, `${preset} from ${now.toString()}: expected ${expected}, got ${got}`);
}

function deepEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Helper to create minimal schedules
 */
function makeSchedule(partial: Partial<Schedule>): Schedule {
  return {
    date: null,
    time: null,
    repeatRule: null,
    scheduleSources: {
      date: 'none',
      time: 'none',
      repeat: 'none',
    },
    ...partial,
  };
}

/**
 * Returns all schedule utility checks
 * PURE FUNCTION - builds fresh array on each call
 */
export function getScheduleChecks(): Check[] {
  return [
    // ============================================================================
    // A. Date Equality Semantics
    // ============================================================================
    
    {
      id: 'date-eq-null-null',
      name: 'Date equality: null equals null',
      run: () => {
        const result = scheduleEquality.areDatesEqual(null, null);
        assert(result === true, 'Expected null to equal null');
      },
    },
    
    {
      id: 'date-eq-null-value',
      name: 'Date equality: null does not equal value',
      run: () => {
        const result = scheduleEquality.areDatesEqual(null, '2026-02-25');
        assert(result === false, 'Expected null to not equal a date value');
      },
    },
    
    {
      id: 'date-eq-value-null',
      name: 'Date equality: value does not equal null',
      run: () => {
        const result = scheduleEquality.areDatesEqual('2026-02-25', null);
        assert(result === false, 'Expected date value to not equal null');
      },
    },
    
    {
      id: 'date-eq-same-value',
      name: 'Date equality: same date string equals same',
      run: () => {
        const result = scheduleEquality.areDatesEqual('2026-02-25', '2026-02-25');
        assert(result === true, 'Expected same date strings to be equal');
      },
    },
    
    {
      id: 'date-eq-diff-value',
      name: 'Date equality: different date strings not equal',
      run: () => {
        const result = scheduleEquality.areDatesEqual('2026-02-25', '2026-02-26');
        assert(result === false, 'Expected different date strings to not be equal');
      },
    },
    
    // ============================================================================
    // B. Time Equality Semantics
    // ============================================================================
    
    {
      id: 'time-eq-null-null',
      name: 'Time equality: null equals null',
      run: () => {
        const result = scheduleEquality.areTimesEqual(null, null);
        assert(result === true, 'Expected null to equal null');
      },
    },
    
    {
      id: 'time-eq-null-value',
      name: 'Time equality: null does not equal value',
      run: () => {
        const result = scheduleEquality.areTimesEqual(null, { hour: 14, minute: 30 });
        assert(result === false, 'Expected null to not equal a time value');
      },
    },
    
    {
      id: 'time-eq-value-null',
      name: 'Time equality: value does not equal null',
      run: () => {
        const result = scheduleEquality.areTimesEqual({ hour: 14, minute: 30 }, null);
        assert(result === false, 'Expected time value to not equal null');
      },
    },
    
    {
      id: 'time-eq-same-value',
      name: 'Time equality: same hour/minute equals',
      run: () => {
        const result = scheduleEquality.areTimesEqual(
          { hour: 14, minute: 30 },
          { hour: 14, minute: 30 }
        );
        assert(result === true, 'Expected same time values to be equal');
      },
    },
    
    {
      id: 'time-eq-diff-hour',
      name: 'Time equality: different hour not equal',
      run: () => {
        const result = scheduleEquality.areTimesEqual(
          { hour: 14, minute: 30 },
          { hour: 15, minute: 30 }
        );
        assert(result === false, 'Expected different hours to not be equal');
      },
    },
    
    {
      id: 'time-eq-diff-minute',
      name: 'Time equality: different minute not equal',
      run: () => {
        const result = scheduleEquality.areTimesEqual(
          { hour: 14, minute: 30 },
          { hour: 14, minute: 45 }
        );
        assert(result === false, 'Expected different minutes to not be equal');
      },
    },
    
    // ============================================================================
    // C. RepeatRule Equality Semantics
    // ============================================================================
    
    {
      id: 'repeat-eq-null-null',
      name: 'RepeatRule equality: null equals null',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(null, null);
        assert(result === true, 'Expected null to equal null');
      },
    },
    
    {
      id: 'repeat-eq-null-value',
      name: 'RepeatRule equality: null does not equal value',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(null, {
          frequency: 'daily',
          interval: 1,
          byDay: null,
        });
        assert(result === false, 'Expected null to not equal a repeat value');
      },
    },
    
    {
      id: 'repeat-eq-same-value',
      name: 'RepeatRule equality: same frequency + interval equals',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(
          { frequency: 'daily', interval: 2, byDay: null },
          { frequency: 'daily', interval: 2, byDay: null }
        );
        assert(result === true, 'Expected same repeat rules to be equal');
      },
    },
    
    {
      id: 'repeat-eq-diff-frequency',
      name: 'RepeatRule equality: different frequency not equal',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(
          { frequency: 'daily', interval: 1, byDay: null },
          { frequency: 'weekly', interval: 1, byDay: null }
        );
        assert(result === false, 'Expected different frequencies to not be equal');
      },
    },
    
    {
      id: 'repeat-eq-diff-interval',
      name: 'RepeatRule equality: different interval not equal',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(
          { frequency: 'daily', interval: 1, byDay: null },
          { frequency: 'daily', interval: 2, byDay: null }
        );
        assert(result === false, 'Expected different intervals to not be equal');
      },
    },
    
    {
      id: 'repeat-eq-byday-order-insensitive',
      name: 'RepeatRule equality: byDay is order-insensitive',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(
          { frequency: 'weekly', interval: 1, byDay: ['mo', 'we'] },
          { frequency: 'weekly', interval: 1, byDay: ['we', 'mo'] }
        );
        assert(result === true, 'Expected byDay arrays with same values in different order to be equal');
      },
    },
    
    {
      id: 'repeat-eq-byday-null-null',
      name: 'RepeatRule equality: byDay null equals null',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(
          { frequency: 'daily', interval: 1, byDay: null },
          { frequency: 'daily', interval: 1, byDay: null }
        );
        assert(result === true, 'Expected byDay null to equal null');
      },
    },
    
    {
      id: 'repeat-eq-byday-null-value',
      name: 'RepeatRule equality: byDay null does not equal value',
      run: () => {
        const result = scheduleEquality.areRepeatsEqual(
          { frequency: 'weekly', interval: 1, byDay: null },
          { frequency: 'weekly', interval: 1, byDay: ['mo'] }
        );
        assert(result === false, 'Expected byDay null to not equal a value');
      },
    },
    
    // ============================================================================
    // D. Delta Detection
    // ============================================================================
    
    {
      id: 'delta-date-add',
      name: 'Delta detection: date add (null → value)',
      run: () => {
        const applied = makeSchedule({ date: null });
        const suggested = makeSchedule({ date: '2026-02-25' });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'date', 'Expected date field');
        assert(deltas[0].type === 'add', 'Expected add type');
        assert(deltas[0].from === null, 'Expected from to be null');
        assert(deltas[0].to === '2026-02-25', 'Expected to to be the new date');
      },
    },
    
    {
      id: 'delta-date-remove',
      name: 'Delta detection: date remove (value → null)',
      run: () => {
        const applied = makeSchedule({ date: '2026-02-25' });
        const suggested = makeSchedule({ date: null });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'date', 'Expected date field');
        assert(deltas[0].type === 'remove', 'Expected remove type');
        assert(deltas[0].from === '2026-02-25', 'Expected from to be the old date');
        assert(deltas[0].to === null, 'Expected to to be null');
      },
    },
    
    {
      id: 'delta-date-change',
      name: 'Delta detection: date change (value A → value B)',
      run: () => {
        const applied = makeSchedule({ date: '2026-02-25' });
        const suggested = makeSchedule({ date: '2026-02-26' });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'date', 'Expected date field');
        assert(deltas[0].type === 'change', 'Expected change type');
        assert(deltas[0].from === '2026-02-25', 'Expected from to be the old date');
        assert(deltas[0].to === '2026-02-26', 'Expected to to be the new date');
      },
    },
    
    {
      id: 'delta-date-no-change',
      name: 'Delta detection: date no change (value A → value A)',
      run: () => {
        const applied = makeSchedule({ date: '2026-02-25' });
        const suggested = makeSchedule({ date: '2026-02-25' });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        // Filter to only date deltas
        const dateDeltas = deltas.filter(d => d.field === 'date');
        assert(dateDeltas.length === 0, 'Expected no date delta for unchanged date');
      },
    },
    
    {
      id: 'delta-time-add',
      name: 'Delta detection: time add (null → value)',
      run: () => {
        const applied = makeSchedule({ time: null });
        const suggested = makeSchedule({ time: { hour: 14, minute: 30 } });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'time', 'Expected time field');
        assert(deltas[0].type === 'add', 'Expected add type');
        assert(deltas[0].from === null, 'Expected from to be null');
        assert(deepEqual(deltas[0].to, { hour: 14, minute: 30 }), 'Expected to to be the new time');
      },
    },
    
    {
      id: 'delta-time-remove',
      name: 'Delta detection: time remove (value → null)',
      run: () => {
        const applied = makeSchedule({ time: { hour: 14, minute: 30 } });
        const suggested = makeSchedule({ time: null });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'time', 'Expected time field');
        assert(deltas[0].type === 'remove', 'Expected remove type');
        assert(deepEqual(deltas[0].from, { hour: 14, minute: 30 }), 'Expected from to be the old time');
        assert(deltas[0].to === null, 'Expected to to be null');
      },
    },
    
    {
      id: 'delta-time-change',
      name: 'Delta detection: time change (value A → value B)',
      run: () => {
        const applied = makeSchedule({ time: { hour: 14, minute: 30 } });
        const suggested = makeSchedule({ time: { hour: 15, minute: 45 } });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'time', 'Expected time field');
        assert(deltas[0].type === 'change', 'Expected change type');
        assert(deepEqual(deltas[0].from, { hour: 14, minute: 30 }), 'Expected from to be the old time');
        assert(deepEqual(deltas[0].to, { hour: 15, minute: 45 }), 'Expected to to be the new time');
      },
    },
    
    {
      id: 'delta-time-no-change',
      name: 'Delta detection: time no change (value A → value A)',
      run: () => {
        const applied = makeSchedule({ time: { hour: 14, minute: 30 } });
        const suggested = makeSchedule({ time: { hour: 14, minute: 30 } });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        const timeDeltas = deltas.filter(d => d.field === 'time');
        assert(timeDeltas.length === 0, 'Expected no time delta for unchanged time');
      },
    },
    
    {
      id: 'delta-repeat-add',
      name: 'Delta detection: repeat add (null → value)',
      run: () => {
        const applied = makeSchedule({ repeatRule: null });
        const suggested = makeSchedule({ 
          repeatRule: { frequency: 'daily', interval: 1, byDay: null } 
        });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'repeat', 'Expected repeat field');
        assert(deltas[0].type === 'add', 'Expected add type');
        assert(deltas[0].from === null, 'Expected from to be null');
        assert(deepEqual(deltas[0].to, { frequency: 'daily', interval: 1, byDay: null }), 'Expected to to be the new repeat');
      },
    },
    
    {
      id: 'delta-repeat-remove',
      name: 'Delta detection: repeat remove (value → null)',
      run: () => {
        const applied = makeSchedule({ 
          repeatRule: { frequency: 'daily', interval: 1, byDay: null } 
        });
        const suggested = makeSchedule({ repeatRule: null });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'repeat', 'Expected repeat field');
        assert(deltas[0].type === 'remove', 'Expected remove type');
        assert(deepEqual(deltas[0].from, { frequency: 'daily', interval: 1, byDay: null }), 'Expected from to be the old repeat');
        assert(deltas[0].to === null, 'Expected to to be null');
      },
    },
    
    {
      id: 'delta-repeat-change',
      name: 'Delta detection: repeat change (value A → value B)',
      run: () => {
        const applied = makeSchedule({ 
          repeatRule: { frequency: 'daily', interval: 1, byDay: null } 
        });
        const suggested = makeSchedule({ 
          repeatRule: { frequency: 'weekly', interval: 2, byDay: ['mo'] } 
        });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 1, 'Expected exactly 1 delta');
        assert(deltas[0].field === 'repeat', 'Expected repeat field');
        assert(deltas[0].type === 'change', 'Expected change type');
        assert(deepEqual(deltas[0].from, { frequency: 'daily', interval: 1, byDay: null }), 'Expected from to be the old repeat');
        assert(deepEqual(deltas[0].to, { frequency: 'weekly', interval: 2, byDay: ['mo'] }), 'Expected to to be the new repeat');
      },
    },
    
    {
      id: 'delta-repeat-no-change',
      name: 'Delta detection: repeat no change (value A → value A)',
      run: () => {
        const applied = makeSchedule({ 
          repeatRule: { frequency: 'daily', interval: 1, byDay: null } 
        });
        const suggested = makeSchedule({ 
          repeatRule: { frequency: 'daily', interval: 1, byDay: null } 
        });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        const repeatDeltas = deltas.filter(d => d.field === 'repeat');
        assert(repeatDeltas.length === 0, 'Expected no repeat delta for unchanged repeat');
      },
    },
    
    {
      id: 'delta-combined-date-change-time-remove',
      name: 'Delta detection: date changed, time removed',
      run: () => {
        const applied = makeSchedule({ 
          date: '2026-02-25',
          time: { hour: 14, minute: 30 }
        });
        const suggested = makeSchedule({ 
          date: '2026-02-26',
          time: null
        });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 2, 'Expected exactly 2 deltas');
        
        const dateDelta = deltas.find(d => d.field === 'date');
        assert(dateDelta !== undefined, 'Expected date delta');
        assert(dateDelta!.type === 'change', 'Expected date change');
        
        const timeDelta = deltas.find(d => d.field === 'time');
        assert(timeDelta !== undefined, 'Expected time delta');
        assert(timeDelta!.type === 'remove', 'Expected time remove');
      },
    },
    
    {
      id: 'delta-no-changes',
      name: 'Delta detection: no changes across all fields',
      run: () => {
        const applied = makeSchedule({ 
          date: '2026-02-25',
          time: { hour: 14, minute: 30 },
          repeatRule: { frequency: 'daily', interval: 1, byDay: null }
        });
        const suggested = makeSchedule({ 
          date: '2026-02-25',
          time: { hour: 14, minute: 30 },
          repeatRule: { frequency: 'daily', interval: 1, byDay: null }
        });
        const deltas = detectScheduleDeltas(applied, suggested);
        
        assert(deltas.length === 0, 'Expected no deltas when all fields unchanged');
      },
    },
    
    // ============================================================================
    // E. Derived Properties
    // ============================================================================
    
    {
      id: 'derived-hastime-true',
      name: 'Derived: hasTime is true when time is non-null',
      run: () => {
        const schedule = makeSchedule({ time: { hour: 14, minute: 30 } });
        const result = scheduleDerived.hasTime(schedule);
        assert(result === true, 'Expected hasTime to be true when time is set');
      },
    },
    
    {
      id: 'derived-hastime-false',
      name: 'Derived: hasTime is false when time is null',
      run: () => {
        const schedule = makeSchedule({ time: null });
        const result = scheduleDerived.hasTime(schedule);
        assert(result === false, 'Expected hasTime to be false when time is null');
      },
    },
    
    {
      id: 'derived-isrecurring-true',
      name: 'Derived: isRecurring is true when repeatRule is non-null',
      run: () => {
        const schedule = makeSchedule({ 
          repeatRule: { frequency: 'daily', interval: 1, byDay: null } 
        });
        const result = scheduleDerived.isRecurring(schedule);
        assert(result === true, 'Expected isRecurring to be true when repeatRule is set');
      },
    },
    
    {
      id: 'derived-isrecurring-false',
      name: 'Derived: isRecurring is false when repeatRule is null',
      run: () => {
        const schedule = makeSchedule({ repeatRule: null });
        const result = scheduleDerived.isRecurring(schedule);
        assert(result === false, 'Expected isRecurring to be false when repeatRule is null');
      },
    },

    // ========================================================================
    // Date presets (docs/plans/date-presets.md). Months below are 1-based.
    // ========================================================================

    {
      id: 'date-preset-normal-day',
      name: 'Date presets: Wednesday afternoon gives tomorrow 8am, today 6pm and Monday 8am',
      run: () => {
        const now = new Date(2026, 9, 14, 14, 30); // Wednesday 14 October 2026
        assertPreset('tomorrowMorning', now, 2026, 10, 15, 8);
        assertPreset('tonight', now, 2026, 10, 14, 18);
        assertPreset('nextWeek', now, 2026, 10, 19, 8);
      },
    },

    {
      id: 'date-preset-tonight-after-6pm',
      name: 'Date presets: Tonight after 6pm is still today at 6pm',
      run: () => {
        assertPreset('tonight', new Date(2026, 9, 14, 21, 45), 2026, 10, 14, 18);
        assertPreset('tonight', new Date(2026, 9, 14, 23, 59), 2026, 10, 14, 18);
      },
    },

    {
      id: 'date-preset-next-week-every-day',
      name: 'Date presets: Next week is the next Monday after today from every day of the week',
      run: () => {
        // Sunday 11 October 2026 to Saturday 17 October 2026
        const expected: [number, number, number][] = [
          [2026, 10, 12], // Sunday -> next day
          [2026, 10, 19], // Monday -> 7 days later
          [2026, 10, 19], [2026, 10, 19], [2026, 10, 19], [2026, 10, 19], [2026, 10, 19],
        ];
        expected.forEach(([y, m, d], i) => assertPreset('nextWeek', new Date(2026, 9, 11 + i, 10, 0), y, m, d, 8));
      },
    },

    {
      id: 'date-preset-month-and-year-end',
      name: 'Date presets: month end and 31 December roll over correctly',
      run: () => {
        assertPreset('tomorrowMorning', new Date(2026, 1, 28, 9, 0), 2026, 3, 1, 8); // 28 Feb 2026
        assertPreset('tomorrowMorning', new Date(2026, 11, 31, 22, 0), 2027, 1, 1, 8);
        assertPreset('nextWeek', new Date(2026, 11, 31, 22, 0), 2027, 1, 4, 8); // Thursday -> Monday 4 Jan
        assertPreset('tonight', new Date(2026, 11, 31, 22, 0), 2026, 12, 31, 18);
      },
    },

    {
      id: 'date-preset-daylight-saving',
      name: 'Date presets: daylight saving start and end weeks keep the calendar date and hour',
      run: () => {
        // UK clocks go forward on Sunday 29 March 2026 and back on Sunday 25 October 2026
        assertPreset('tomorrowMorning', new Date(2026, 2, 28, 23, 30), 2026, 3, 29, 8);
        assertPreset('nextWeek', new Date(2026, 2, 28, 23, 30), 2026, 3, 30, 8);
        assertPreset('nextWeek', new Date(2026, 2, 29, 12, 0), 2026, 3, 30, 8);
        assertPreset('tomorrowMorning', new Date(2026, 9, 24, 23, 30), 2026, 10, 25, 8);
        assertPreset('nextWeek', new Date(2026, 9, 25, 12, 0), 2026, 10, 26, 8);
        assertPreset('tonight', new Date(2026, 9, 25, 12, 0), 2026, 10, 25, 18);
      },
    },
  ];
}