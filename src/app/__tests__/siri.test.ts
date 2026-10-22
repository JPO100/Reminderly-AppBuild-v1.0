import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildSiriReminder } from '../utils/siri';

// Thursday 22 October 2026, 3:00pm local
const now = new Date(2026, 9, 22, 15, 0);

function build(text: string, at: Date = now, repeats = true) {
  vi.setSystemTime(at);
  return buildSiriReminder(text, at, repeats);
}

describe('Siri reminder parsing', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('time with no date', () => {
    it('a time still to come today stays today', () => {
      expect(build('Call Sam at 5pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '17:00' });
    });

    it('a time already passed today moves to tomorrow', () => {
      expect(build('Call Sam at 9am').schedule).toEqual({ kind: 'scheduled', date: '2026-10-23', time: '09:00' });
    });

    it('the current minute moves to tomorrow', () => {
      expect(build('Call Sam at 3pm').schedule).toEqual({ kind: 'scheduled', date: '2026-10-23', time: '15:00' });
    });

    it('a passed time late on 31 December moves into the new year', () => {
      expect(build('Call Sam at 9am', new Date(2026, 11, 31, 22, 0)).schedule)
        .toEqual({ kind: 'scheduled', date: '2027-01-01', time: '09:00' });
    });

    it('a time naming today keeps today even when passed', () => {
      const result = build('Gym this morning', new Date(2026, 9, 22, 13, 0));
      expect(result.schedule.kind).toBe('scheduled');
      expect(result.schedule.kind === 'scheduled' && result.schedule.date).toBe('2026-10-22');
    });
  });

  describe('explicit dates', () => {
    it('tomorrow with a time is unchanged', () => {
      expect(build('Call Sam tomorrow at 9am').schedule).toEqual({ kind: 'scheduled', date: '2026-10-23', time: '09:00' });
    });

    it('today with a passed time stays today', () => {
      expect(build('Call Sam today at 9am').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22', time: '09:00' });
    });
  });

  describe('month-name dates', () => {
    it('a date later this year stays this year', () => {
      expect(build('Dentist December 5').schedule).toEqual({ kind: 'scheduled', date: '2026-12-05' });
    });

    it('a date already passed this year moves to next year', () => {
      expect(build('Dentist March 5').schedule).toEqual({ kind: 'scheduled', date: '2027-03-05' });
    });

    it('the day-first form moves to next year too', () => {
      expect(build('Dentist 5th of March').schedule).toEqual({ kind: 'scheduled', date: '2027-03-05' });
    });

    it('today stays today', () => {
      expect(build('Dentist October 22').schedule).toEqual({ kind: 'scheduled', date: '2026-10-22' });
    });

    it('an explicit year is kept even when past', () => {
      expect(build('Dentist March 5 2026').schedule).toEqual({ kind: 'scheduled', date: '2026-03-05' });
    });

    it('2 January said on 31 December is next year', () => {
      expect(build('Dentist January 2', new Date(2026, 11, 31, 10, 0)).schedule).toEqual({ kind: 'scheduled', date: '2027-01-02' });
    });
  });

  describe('other behaviour', () => {
    it('no date or time is Sometime', () => {
      expect(build('Buy milk').schedule).toEqual({ kind: 'sometime' });
    });

    it('text with "&" is kept in full', () => {
      const result = build('Buy milk & eggs');
      expect(result.originalText).toBe('Buy milk & eggs');
      expect(result.displayText).toBe('Buy milk & eggs');
    });

    it('repeat reminders on creates a rule, off creates none', () => {
      expect(build('Take pills every day', now, true).repeatRule).not.toBeNull();
      expect(build('Take pills every day', now, false).repeatRule).toBeNull();
    });
  });
});

// Settings lists the phrases registered with iOS, so the two lists must match
describe('Siri phrases', () => {
  const read = (file: string) => fs.readFileSync(path.resolve(__dirname, file), 'utf8');

  it('settings lists exactly the phrases registered in AppShortcuts.swift', () => {
    const swift = [...read('../../../ios/App/App/AppShortcuts.swift').matchAll(/"([^"]*)\\\(\.applicationName\)([^"]*)"/g)]
      .map((m) => `${m[1]}Reminderly${m[2]}`);
    const listBlock = read('../components/SettingsPanelContent.tsx').match(/SIRI_PHRASES = \[([\s\S]*?)\];/)![1];
    const listed = [...listBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(swift).toHaveLength(4);
    expect(listed).toEqual(swift);
  });
});
