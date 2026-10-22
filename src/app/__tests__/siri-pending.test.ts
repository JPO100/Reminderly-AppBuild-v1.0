import { describe, expect, it } from 'vitest';
import type { Reminder } from '../reminder-utils';
import { buildSiriContext, isSiriReminder, planSiriImport } from '../utils/siri-pending';
import { buildBadgeTimeline } from '../utils/siri-badge';

const reminder = (id: string, overrides: Partial<Reminder> = {}): Reminder => ({
  id,
  originalText: 'Call Mum at 6pm',
  displayText: 'Call Mum',
  createdAt: 1_761_145_200_000,
  schedule: { kind: 'scheduled', date: '2026-10-22', time: '18:00' },
  repeatRule: null,
  ...overrides,
});
const json = (value: unknown) => JSON.stringify(value);
const prefs = { alerts: true, sound: false, badge: true, includeToday: false };

describe('Siri context', () => {
  const reminders = [reminder('a'), reminder('b', { schedule: { kind: 'scheduled', date: '2026-10-23' } })];

  it('publishes the settings, repeat flag and badge timeline', () => {
    expect(buildSiriContext(reminders, true, prefs, true)).toEqual({
      alerts: true, sound: false, badge: true, includeToday: false, repeatsActive: true,
      badgeTimeline: buildBadgeTimeline(reminders, false),
    });
  });

  it('turns alerts and badge off when Reminders or Notifications is off, as the app then schedules nothing', () => {
    const context = buildSiriContext(reminders, false, prefs, false);
    expect(context.alerts).toBe(false);
    expect(context.badge).toBe(false);
    expect(context.badgeTimeline).toEqual([]);
  });

  it('leaves the timeline empty when the badge is off', () => {
    expect(buildSiriContext(reminders, true, { ...prefs, badge: false }, true).badgeTimeline).toEqual([]);
  });
});

describe('Siri reminder validation', () => {
  it('accepts timed, date-only and Sometime reminders, with or without a repeat rule', () => {
    expect(isSiriReminder(reminder('a'))).toBe(true);
    expect(isSiriReminder(reminder('a', { schedule: { kind: 'scheduled', date: '2026-10-23' } }))).toBe(true);
    expect(isSiriReminder(reminder('a', { schedule: { kind: 'sometime' } }))).toBe(true);
    expect(isSiriReminder(reminder('a', { repeatRule: { frequency: 'weekly', interval: 1, byDay: ['mo'] } as Reminder['repeatRule'] }))).toBe(true);
  });

  it('rejects missing fields and malformed schedules', () => {
    expect(isSiriReminder({ id: 'a' })).toBe(false);
    expect(isSiriReminder(reminder('', {}))).toBe(false);
    expect(isSiriReminder(reminder('a', { schedule: { kind: 'scheduled', date: '22/10/2026' } }))).toBe(false);
    expect(isSiriReminder(reminder('a', { schedule: { kind: 'scheduled', date: '2026-10-22', time: '6pm' } }))).toBe(false);
    expect(isSiriReminder(null)).toBe(false);
  });
});

describe('Siri import plan', () => {
  it('imports a new reminder once', () => {
    const plan = planSiriImport([json(reminder('a'))], new Set());
    expect(plan.add.map((r) => r.id)).toEqual(['a']);
    expect(plan.remove).toEqual([]);
  });

  it('a second run after the save adds nothing and removes the entry', () => {
    expect(planSiriImport([json(reminder('a'))], new Set(['a']))).toEqual({ add: [], remove: ['a'] });
  });

  it('after a stop between saving and removing, the entry is removed, not added again', () => {
    expect(planSiriImport([json(reminder('a')), json(reminder('b'))], new Set(['a', 'x']))).toEqual({ add: [reminder('b')], remove: ['a'] });
  });

  it('never resurrects a reminder the user has since completed or deleted (it is saved by id)', () => {
    expect(planSiriImport([json(reminder('a'))], new Set(['a'])).add).toEqual([]);
  });

  it('adds the same id once when it is listed twice', () => {
    expect(planSiriImport([json(reminder('a')), json(reminder('a'))], new Set()).add).toHaveLength(1);
  });

  it('imports two reminders with the same text: duplicates are by id, never by text', () => {
    expect(planSiriImport([json(reminder('a')), json(reminder('b'))], new Set()).add.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    expect(planSiriImport([], new Set())).toEqual({ add: [], remove: [] });
  });

  it('removes malformed entries that carry an id and skips unreadable ones', () => {
    const plan = planSiriImport(['not json', json({ text: 'no id' }), json({ id: 'bad', schedule: {} }), json(reminder('ok'))], new Set());
    expect(plan.add.map((r) => r.id)).toEqual(['ok']);
    expect(plan.remove).toEqual(['bad']);
  });
});
