import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { canMoveToTomorrow } from '../reminder-utils';
import type { Reminder } from '../reminder-utils';
import { getBlankedLists, clearListSmartReminder } from '../utils/list-utils';
import type { CreatedList } from '../utils/list-utils';

function makeReminder(schedule: Reminder['schedule']): Reminder {
  return { id: 'r1', originalText: 'Test', displayText: 'Test', createdAt: 0, schedule };
}

function makeList(overrides: Partial<CreatedList> = {}): CreatedList {
  return {
    id: 'l1',
    title: 'Reminderly todos',
    items: [{ id: 'i1', text: 'One', completed: false }, { id: 'i2', text: 'Two', completed: false }],
    smartReminders: true,
    smartReminderDueDate: '2026-10-20',
    smartReminderTime: '09:00',
    ...overrides,
  };
}

// Wednesday 14 October 2026, 13:00 local time
const now = new Date(2026, 9, 14, 13, 0, 0, 0);

describe('Move to tomorrow availability', () => {
  it('is offered for a reminder due today without a time', () => {
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-10-14' }), now)).toBe(true);
  });
  it('is offered for a reminder due later today', () => {
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-10-14', time: '18:00' }), now)).toBe(true);
  });
  it('is offered for a reminder due earlier today (overdue)', () => {
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-10-14', time: '09:00' }), now)).toBe(true);
  });
  it('is offered for a reminder from a previous day (overdue)', () => {
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-10-05' }), now)).toBe(true);
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-09-01', time: '10:00' }), now)).toBe(true);
  });
  it('is not offered for future reminders', () => {
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-10-15' }), now)).toBe(false);
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-10-18', time: '08:00' }), now)).toBe(false);
    expect(canMoveToTomorrow(makeReminder({ kind: 'scheduled', date: '2026-12-01' }), now)).toBe(false);
  });
  it('is not offered for sometime reminders', () => {
    expect(canMoveToTomorrow(makeReminder({ kind: 'sometime' }), now)).toBe(false);
  });
});

describe('List data loss fix (c9baa91)', () => {
  const appSource = fs.readFileSync(path.resolve(__dirname, '..', 'App.tsx'), 'utf8');
  const start = appSource.indexOf('const openListEditor = ');
  const body = appSource.slice(start, appSource.indexOf('\n  };', start));

  it('openListEditor loads the list values directly, without blanking them first', () => {
    expect(start).toBeGreaterThan(-1);
    expect(body).toContain('setListTitle(list.title)');
    expect(body).toContain('setListItems(list.items');
    expect(body).not.toContain('setListTitle("")');
    expect(body).not.toContain('setListItems([])');
    expect(body).not.toContain('setTimeout');
  });

  it('detects a populated list that became blank', () => {
    const before = makeList();
    const after = makeList({ title: '', items: [] });
    expect(getBlankedLists([before], [after])).toEqual([{ before, after }]);
  });

  it('ignores lists that were already blank, are new, or still have content', () => {
    const blank = makeList({ id: 'blank', title: '', items: [] });
    const renamed = makeList({ id: 'renamed' });
    expect(getBlankedLists([blank, renamed], [blank, { ...renamed, title: 'New name' }, makeList({ id: 'new', title: '', items: [] })])).toEqual([]);
  });
});

describe('Smart reminder deletion fix (a3a56c3)', () => {
  it('clears the smart reminder flag, due date and time, and keeps the list content', () => {
    const list = makeList();
    const cleared = clearListSmartReminder(list);
    expect(cleared.smartReminders).toBe(false);
    expect(cleared.smartReminderDueDate).toBeNull();
    expect(cleared.smartReminderTime).toBeNull();
    expect(cleared.title).toBe(list.title);
    expect(cleared.items).toEqual(list.items);
    expect(list.smartReminders).toBe(true);
  });
});
