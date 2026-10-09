/**
 * Reminder Add-Flow Checks
 *
 * Deterministic checks for persistence, categorisation, and sorting.
 * No real Date.now dependency - all checks use fixed "now" values.
 * localStorage is saved/restored around each check that touches it.
 *
 * STATELESS: Returns fresh check array on each call - no side effects.
 */

import type { Check } from './check-system';
import {
  loadReminders,
  categoriseReminder,
  sortReminders,
  formatRepeatLabel,
  isOverdue,
  STORAGE_KEY,
  getDisplayCategory,
  getFilterForSettingsMenu,
} from '../reminder-utils';
import type { Reminder } from '../reminder-utils';
import { normaliseReminderText } from '../utils/normalise-text';
import { renderReminderText, getDisplayTitle } from '../utils/render-text';
import { formatSelectedDate } from '../../imports/NewReminderOverlay';

/**
 * Simple assertion helper (mirrors schedule-checks convention)
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Helper: run a callback with localStorage isolation.
 * Saves the current value of STORAGE_KEY before, restores it after,
 * regardless of success or failure.
 */
function withIsolatedStorage(fn: () => void): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  try {
    fn();
  } finally {
    if (saved === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, saved);
    }
  }
}

/**
 * Helper: build a minimal Reminder for testing
 */
function makeReminder(overrides: Partial<Reminder> & Pick<Reminder, 'id' | 'schedule'>): Reminder {
  const text = `Test reminder ${overrides.id}`;
  return {
    originalText: text,
    displayText: text,
    createdAt: Date.now(),
    ...overrides,
  };
}

/**
 * Returns all reminder add-flow checks.
 * PURE FUNCTION - builds fresh array on each call.
 */
export function getReminderChecks(): Check[] {
  return [
    // ========================================================================
    // 1. Persistence - defensive load
    // ========================================================================

    {
      id: 'persist-load-invalid-json',
      name: 'Persistence: loadReminders returns [] for invalid JSON',
      run: () => {
        withIsolatedStorage(() => {
          localStorage.setItem(STORAGE_KEY, '{not valid json!!!');
          const result = loadReminders();
          assert(Array.isArray(result), 'Expected an array');
          assert(result.length === 0, `Expected empty array, got length ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-not-array-object',
      name: 'Persistence: loadReminders returns [] for JSON object',
      run: () => {
        withIsolatedStorage(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
          const result = loadReminders();
          assert(Array.isArray(result), 'Expected an array');
          assert(result.length === 0, `Expected empty array, got length ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-not-array-string',
      name: 'Persistence: loadReminders returns [] for JSON string',
      run: () => {
        withIsolatedStorage(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify('hello'));
          const result = loadReminders();
          assert(Array.isArray(result), 'Expected an array');
          assert(result.length === 0, `Expected empty array, got length ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-not-array-number',
      name: 'Persistence: loadReminders returns [] for JSON number',
      run: () => {
        withIsolatedStorage(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(42));
          const result = loadReminders();
          assert(Array.isArray(result), 'Expected an array');
          assert(result.length === 0, `Expected empty array, got length ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-missing-schedule-drops',
      name: 'Persistence: record with missing schedule is dropped',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { id: 'no-sched', originalText: 'No schedule', displayText: 'No schedule', createdAt: 1000 },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 0, `Expected 0 reminders, got ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-unknown-schedule-kind-drops',
      name: 'Persistence: record with unknown schedule.kind is dropped',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { id: 'bad-kind', originalText: 'Bad kind', displayText: 'Bad kind', createdAt: 1000, schedule: { kind: 'future-thing' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 0, `Expected 0 reminders, got ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-invalid-scheduled-date-drops',
      name: 'Persistence: scheduled with invalid date/time is dropped',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { id: 'bad-date', originalText: 'Bad date', displayText: 'Bad date', createdAt: 1000, schedule: { kind: 'scheduled', date: 'not-a-date' } },
            { id: 'bad-time', originalText: 'Bad time', displayText: 'Bad time', createdAt: 1000, schedule: { kind: 'scheduled', date: '2026-03-01', time: 'noon' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 0, `Expected 0 reminders, got ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-invalid-scheduled-time-drops',
      name: 'Persistence: scheduled with malformed time (non-HH:mm) is dropped',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { id: 'time-9pm', originalText: 'Bad time', displayText: 'Bad time', createdAt: 1000, schedule: { kind: 'scheduled', date: '2026-03-01', time: '9pm' } },
            { id: 'time-2599', originalText: 'Bad time', displayText: 'Bad time', createdAt: 1000, schedule: { kind: 'scheduled', date: '2026-03-01', time: '25:99' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 0, `Expected 0 reminders, got ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-missing-id-drops',
      name: 'Persistence: record with missing/empty id is dropped',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { originalText: 'No id', displayText: 'No id', createdAt: 1000, schedule: { kind: 'sometime' } },
            { id: '', originalText: 'Empty id', displayText: 'Empty id', createdAt: 1000, schedule: { kind: 'sometime' } },
            { id: '  ', originalText: 'Blank id', displayText: 'Blank id', createdAt: 1000, schedule: { kind: 'sometime' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 0, `Expected 0 reminders, got ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-non-string-text-drops',
      name: 'Persistence: record where both text paths fail is dropped',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { id: 'bad-text-1', originalText: 123, displayText: 'ok', createdAt: 1000, schedule: { kind: 'sometime' } },
            { id: 'bad-text-2', text: 456, createdAt: 1000, schedule: { kind: 'sometime' } },
            { id: 'bad-text-3', createdAt: 1000, schedule: { kind: 'sometime' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 0, `Expected 0 reminders, got ${result.length}`);
        });
      },
    },

    {
      id: 'persist-load-invalid-createdAt-defaults-to-now-number',
      name: 'Persistence: invalid createdAt defaults to a finite number',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { id: 'bad-ca-1', originalText: 'Missing ca', displayText: 'Missing ca', schedule: { kind: 'sometime' } },
            { id: 'bad-ca-2', originalText: 'String ca', displayText: 'String ca', createdAt: 'not-a-number', schedule: { kind: 'sometime' } },
            { id: 'bad-ca-3', originalText: 'Infinity ca', displayText: 'Infinity ca', createdAt: Infinity, schedule: { kind: 'sometime' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 3, `Expected 3 reminders, got ${result.length}`);
          for (const rem of result) {
            assert(typeof rem.createdAt === 'number', `createdAt should be number, got ${typeof rem.createdAt}`);
            assert(Number.isFinite(rem.createdAt), `createdAt should be finite, got ${rem.createdAt}`);
          }
        });
      },
    },

    {
      id: 'persist-load-invalid-repeatRule-null',
      name: 'Persistence: invalid repeatRule becomes null',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            { id: 'bad-rr-1', originalText: 'String rr', displayText: 'String rr', createdAt: 1000, schedule: { kind: 'sometime' }, repeatRule: 'daily' },
            { id: 'bad-rr-2', originalText: 'No freq', displayText: 'No freq', createdAt: 1000, schedule: { kind: 'sometime' }, repeatRule: { interval: 1 } },
            { id: 'bad-rr-3', originalText: 'No interval', displayText: 'No interval', createdAt: 1000, schedule: { kind: 'sometime' }, repeatRule: { frequency: 'daily' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const result = loadReminders();
          assert(result.length === 3, `Expected 3 reminders, got ${result.length}`);
          for (const rem of result) {
            assert(rem.repeatRule === null, `repeatRule should be null, got ${JSON.stringify(rem.repeatRule)}`);
          }
        });
      },
    },

    // ========================================================================
    // 2. Persistence - round trip
    // ========================================================================

    {
      id: 'persist-round-trip',
      name: 'Persistence: write then load preserves reminders (new format)',
      run: () => {
        withIsolatedStorage(() => {
          const seed = [
            {
              id: 'rt-1',
              originalText: 'Round trip A',
              displayText: 'Round trip A',
              createdAt: 1000,
              schedule: { kind: 'sometime' },
            },
            {
              id: 'rt-2',
              originalText: 'Call mum tomorrow',
              displayText: 'Call mum on Sunday',
              createdAt: 2000,
              schedule: { kind: 'scheduled', date: '2026-03-01', time: '14:30' },
            },
          ];

          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));

          const loaded = loadReminders();

          assert(loaded.length === 2, `Expected 2 reminders, got ${loaded.length}`);
          assert(loaded[0].id === 'rt-1', `Expected id rt-1, got ${loaded[0].id}`);
          assert(loaded[0].originalText === 'Round trip A', `Expected originalText "Round trip A", got "${loaded[0].originalText}"`);
          assert(loaded[0].displayText === 'Round trip A', `Expected displayText "Round trip A", got "${loaded[0].displayText}"`);
          assert(loaded[0].schedule.kind === 'sometime', `Expected schedule kind sometime, got ${loaded[0].schedule.kind}`);
          assert(loaded[1].id === 'rt-2', `Expected id rt-2, got ${loaded[1].id}`);
          assert(loaded[1].originalText === 'Call mum tomorrow', `Expected originalText preserved, got "${loaded[1].originalText}"`);
          assert(loaded[1].displayText === 'Call mum on Sunday', `Expected displayText preserved, got "${loaded[1].displayText}"`);
          assert(loaded[1].schedule.kind === 'scheduled', `Expected schedule kind scheduled, got ${loaded[1].schedule.kind}`);

          const s1 = loaded[1].schedule as { kind: 'scheduled'; date: string; time?: string };
          assert(s1.date === '2026-03-01', `Expected date 2026-03-01, got ${s1.date}`);
          assert(s1.time === '14:30', `Expected time 14:30, got ${s1.time}`);
        });
      },
    },

    // ========================================================================
    // 3. Categorisation - derived categories
    // ========================================================================
    // Fixed now: 2026-02-25 12:00 (Wednesday)
    // Week: Mon 2026-02-23 to Sun 2026-03-01

    {
      id: 'cat-today',
      name: 'Categorisation: scheduled on same day returns "today"',
      run: () => {
        const now = new Date(2026, 1, 25, 12, 0); // Wed 25 Feb 2026
        const r = makeReminder({ id: 'c1', schedule: { kind: 'scheduled', date: '2026-02-25' } });
        assert(categoriseReminder(r, now) === 'today', 'Expected "today"');
      },
    },

    {
      id: 'cat-this-week',
      name: 'Categorisation: scheduled later in same Mon-Sun week returns "this-week"',
      run: () => {
        const now = new Date(2026, 1, 25, 12, 0); // Wed 25 Feb 2026
        const r = makeReminder({ id: 'c2', schedule: { kind: 'scheduled', date: '2026-02-27' } }); // Friday
        assert(categoriseReminder(r, now) === 'this-week', 'Expected "this-week"');
      },
    },

    {
      id: 'cat-this-week-monday',
      name: 'Categorisation: scheduled on Monday of current week returns "this-week"',
      run: () => {
        const now = new Date(2026, 1, 25, 12, 0); // Wed 25 Feb 2026
        const r = makeReminder({ id: 'c2b', schedule: { kind: 'scheduled', date: '2026-02-23' } }); // Monday
        assert(categoriseReminder(r, now) === 'this-week', 'Expected "this-week"');
      },
    },

    {
      id: 'cat-later',
      name: 'Categorisation: scheduled after end of week returns "later"',
      run: () => {
        const now = new Date(2026, 1, 25, 12, 0);
        const r = makeReminder({ id: 'c3', schedule: { kind: 'scheduled', date: '2026-03-05' } });
        assert(categoriseReminder(r, now) === 'later', 'Expected "later"');
      },
    },

    {
      id: 'cat-sometime',
      name: 'Categorisation: schedule.kind "sometime" returns "sometime"',
      run: () => {
        const now = new Date(2026, 1, 25, 12, 0);
        const r = makeReminder({ id: 'c4', schedule: { kind: 'sometime' } });
        assert(categoriseReminder(r, now) === 'sometime', 'Expected "sometime"');
      },
    },

    // Settings menu (Phase 1): combined Later/Sometime presentation
    {
      id: 'settings-menu-display-category-on',
      name: 'Settings menu on: Sometime displays as Later, other categories unchanged',
      run: () => {
        assert(getDisplayCategory('sometime', true) === 'later', 'Expected sometime to display as later');
        assert(getDisplayCategory('later', true) === 'later', 'Expected later unchanged');
        assert(getDisplayCategory('today', true) === 'today', 'Expected today unchanged');
        assert(getDisplayCategory('this-week', true) === 'this-week', 'Expected this-week unchanged');
      },
    },

    {
      id: 'settings-menu-display-category-off',
      name: 'Settings menu off: Sometime keeps its own display category',
      run: () => {
        assert(getDisplayCategory('sometime', false) === 'sometime', 'Expected sometime unchanged');
        assert(getDisplayCategory('later', false) === 'later', 'Expected later unchanged');
      },
    },

    {
      id: 'settings-menu-filter-on',
      name: 'Settings menu on: Later and Sometime filters switch to combined Later',
      run: () => {
        assert(getFilterForSettingsMenu('sometime', true) === 'other', 'Expected sometime -> other');
        assert(getFilterForSettingsMenu('later', true) === 'other', 'Expected later -> other');
        assert(getFilterForSettingsMenu('today', true) === 'today', 'Expected today unchanged');
        assert(getFilterForSettingsMenu('all', true) === 'all', 'Expected all unchanged');
      },
    },

    {
      id: 'settings-menu-filter-off',
      name: 'Settings menu off: combined Later filter restores standard Later',
      run: () => {
        assert(getFilterForSettingsMenu('other', false) === 'later', 'Expected other -> later');
        assert(getFilterForSettingsMenu('sometime', false) === 'sometime', 'Expected sometime unchanged');
        assert(getFilterForSettingsMenu('this-week', false) === 'this-week', 'Expected this-week unchanged');
      },
    },

    {
      id: 'settings-menu-filter-round-trip',
      name: 'Settings menu on -> off -> on: filter is always a visible filter',
      run: () => {
        let filter = getFilterForSettingsMenu('sometime', true);
        assert(filter === 'other', 'Expected other after on');
        filter = getFilterForSettingsMenu(filter, false);
        assert(filter === 'later', 'Expected later after off');
        filter = getFilterForSettingsMenu(filter, true);
        assert(filter === 'other', 'Expected other after on again');
      },
    },

    {
      id: 'settings-menu-combined-order',
      name: 'Settings menu: combined Later lists dated Later before undated Sometime',
      run: () => {
        const now = new Date(2026, 1, 25, 12, 0);
        const sometime = makeReminder({ id: 'sm-s', schedule: { kind: 'sometime' }, createdAt: 1000 });
        const later = makeReminder({ id: 'sm-l', schedule: { kind: 'scheduled', date: '2026-04-10' }, createdAt: 2000 });
        const sorted = sortReminders([sometime, later], now);
        assert(sorted[0].id === 'sm-l' && sorted[1].id === 'sm-s', 'Expected dated Later first, then Sometime');
      },
    },

    {
      id: 'settings-menu-data-unchanged',
      name: 'Settings menu: presentation helpers do not change stored reminders',
      run: () => {
        withIsolatedStorage(() => {
          const now = new Date(2026, 1, 25, 12, 0);
          const stored = [
            makeReminder({ id: 'sm-d1', schedule: { kind: 'sometime' }, createdAt: 1000 }),
            makeReminder({ id: 'sm-d2', schedule: { kind: 'scheduled', date: '2026-04-10' }, createdAt: 2000 }),
          ];
          const raw = JSON.stringify(stored);
          localStorage.setItem(STORAGE_KEY, raw);
          const loaded = loadReminders();
          for (const enabled of [true, false, true]) {
            loaded.forEach((r) => getDisplayCategory(categoriseReminder(r, now), enabled));
          }
          assert(localStorage.getItem(STORAGE_KEY) === raw, 'Expected stored reminders unchanged');
          assert(loaded[0].schedule.kind === 'sometime', 'Expected Sometime reminder to stay undated');
          assert(categoriseReminder(loaded[0], now) === 'sometime', 'Expected derived category unchanged');
        });
      },
    },

    // ========================================================================
    // 4. Sorting - date then time, unscheduled last by createdAt
    // ========================================================================

    {
      id: 'sort-scheduled-date-asc',
      name: 'Sorting: scheduled reminders sort by date ascending',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const list: Reminder[] = [
          makeReminder({ id: 's-late', createdAt: 1, schedule: { kind: 'scheduled', date: '2026-03-10' } }),
          makeReminder({ id: 's-early', createdAt: 2, schedule: { kind: 'scheduled', date: '2026-02-25' } }),
        ];
        const sorted = sortReminders(list, now);
        assert(sorted[0].id === 's-early', `Expected s-early first, got ${sorted[0].id}`);
        assert(sorted[1].id === 's-late', `Expected s-late second, got ${sorted[1].id}`);
      },
    },

    {
      id: 'sort-scheduled-time-asc',
      name: 'Sorting: same-date scheduled reminders sort by time ascending',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const list: Reminder[] = [
          makeReminder({ id: 's-pm', createdAt: 1, schedule: { kind: 'scheduled', date: '2026-02-25', time: '18:30' } }),
          makeReminder({ id: 's-am', createdAt: 2, schedule: { kind: 'scheduled', date: '2026-02-25', time: '09:05' } }),
        ];
        const sorted = sortReminders(list, now);
        assert(sorted[0].id === 's-am', `Expected s-am first, got ${sorted[0].id}`);
        assert(sorted[1].id === 's-pm', `Expected s-pm second, got ${sorted[1].id}`);
      },
    },

    {
      id: 'sort-unscheduled-after-scheduled',
      name: 'Sorting: unscheduled come after scheduled, ordered by createdAt asc',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const list: Reminder[] = [
          makeReminder({ id: 'st-3', createdAt: 300, schedule: { kind: 'sometime' } }),
          makeReminder({ id: 'st-1', createdAt: 100, schedule: { kind: 'sometime' } }),
          makeReminder({ id: 'sched-1', createdAt: 500, schedule: { kind: 'scheduled', date: '2026-03-01' } }),
          makeReminder({ id: 'st-2', createdAt: 200, schedule: { kind: 'sometime' } }),
        ];
        const sorted = sortReminders(list, now);

        // Scheduled first
        assert(sorted[0].id === 'sched-1', `Expected sched-1 first, got ${sorted[0].id}`);

        // Then unscheduled by createdAt ascending
        assert(sorted[1].id === 'st-1', `Expected st-1 second, got ${sorted[1].id}`);
        assert(sorted[2].id === 'st-2', `Expected st-2 third, got ${sorted[2].id}`);
        assert(sorted[3].id === 'st-3', `Expected st-3 fourth, got ${sorted[3].id}`);
      },
    },

    {
      id: 'sort-with-time-before-without-time',
      name: 'Sorting: same-date reminder with time sorts before one without time',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const list: Reminder[] = [
          makeReminder({ id: 's-notime', createdAt: 1, schedule: { kind: 'scheduled', date: '2026-02-25' } }),
          makeReminder({ id: 's-withtime', createdAt: 2, schedule: { kind: 'scheduled', date: '2026-02-25', time: '09:00' } }),
        ];
        const sorted = sortReminders(list, now);
        assert(sorted[0].id === 's-withtime', `Expected s-withtime first, got ${sorted[0].id}`);
        assert(sorted[1].id === 's-notime', `Expected s-notime second, got ${sorted[1].id}`);
      },
    },

    // ========================================================================
    // 5. Persistence - repeatRule round trip
    // ========================================================================

    {
      id: 'persist-round-trip-hourly-repeat',
      name: 'Persistence: round trip preserves hourly repeatRule',
      run: () => {
        withIsolatedStorage(() => {
          // Legacy format with `text` — migration will convert to originalText/displayText
          const seed = [
            {
              id: 'rr-hourly',
              text: 'Hourly repeat test',
              createdAt: 1000,
              schedule: { kind: 'scheduled', date: '2026-03-01' },
              repeatRule: { frequency: 'hourly', interval: 3, byDay: null },
            },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const loaded = loadReminders();

          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].repeatRule != null, 'Expected repeatRule to be present');
          const rr = loaded[0].repeatRule!;
          assert(rr.frequency === 'hourly', `Expected frequency "hourly", got "${rr.frequency}"`);
          assert(rr.interval === 3, `Expected interval 3, got ${rr.interval}`);
          assert(rr.byDay === null, `Expected byDay null, got ${JSON.stringify(rr.byDay)}`);
        });
      },
    },

    {
      id: 'persist-round-trip-weekly-byday',
      name: 'Persistence: round trip preserves weekly repeatRule with byDay (custom-days mapping)',
      run: () => {
        withIsolatedStorage(() => {
          // Legacy format with `text` — migration will convert to originalText/displayText
          const seed = [
            {
              id: 'rr-weekly',
              text: 'Weekly custom days test',
              createdAt: 2000,
              schedule: { kind: 'scheduled', date: '2026-03-01' },
              repeatRule: { frequency: 'weekly', interval: 1, byDay: ['mo', 'we', 'fr'] },
            },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
          const loaded = loadReminders();

          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].repeatRule != null, 'Expected repeatRule to be present');
          const rr = loaded[0].repeatRule!;
          assert(rr.frequency === 'weekly', `Expected frequency "weekly", got "${rr.frequency}"`);
          assert(rr.interval === 1, `Expected interval 1, got ${rr.interval}`);
          assert(Array.isArray(rr.byDay), 'Expected byDay to be an array');
          assert(rr.byDay!.length === 3, `Expected 3 byDay entries, got ${rr.byDay!.length}`);
          assert(rr.byDay!.includes('mo' as any), 'Expected byDay to include "mo"');
          assert(rr.byDay!.includes('we' as any), 'Expected byDay to include "we"');
          assert(rr.byDay!.includes('fr' as any), 'Expected byDay to include "fr"');
        });
      },
    },

    // ========================================================================
    // 6. formatRepeatLabel - repeat label formatting
    // ========================================================================

    {
      id: 'repeat-label-hourly-interval-1',
      name: 'formatRepeatLabel: hourly interval 1 returns "Repeats every hour"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'hourly', interval: 1, byDay: null });
        assert(result === 'Repeats every hour', `Expected "Repeats every hour", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-hourly-interval-3',
      name: 'formatRepeatLabel: hourly interval 3 returns "Repeats every 3 hours"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'hourly', interval: 3, byDay: null });
        assert(result === 'Repeats every 3 hours', `Expected "Repeats every 3 hours", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-weekly-byday',
      name: 'formatRepeatLabel: weekly with byDay (mo, we, fr) interval 1',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'weekly', interval: 1, byDay: ['mo', 'we', 'fr'] });
        assert(result === 'Repeats every week (Mon, Wed, Fri)', `Expected "Repeats every week (Mon, Wed, Fri)", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-daily-interval-2',
      name: 'formatRepeatLabel: daily interval 2 returns "Repeats every 2 days"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'daily', interval: 2, byDay: null });
        assert(result === 'Repeats every 2 days', `Expected "Repeats every 2 days", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-daily-with-time',
      name: 'formatRepeatLabel: daily with time includes "at 5pm"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'daily', interval: 1, byDay: null }, '17:00');
        assert(result === 'Repeats every day at 5pm', `Expected "Repeats every day at 5pm", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-weekly-byday-with-time',
      name: 'formatRepeatLabel: weekly with byDay and time includes day and "at 4pm"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'weekly', interval: 1, byDay: ['we'] }, '16:00');
        assert(result === 'Repeats every week (Wed) at 4pm', `Expected "Repeats every week (Wed) at 4pm", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-daily-no-time-unchanged',
      name: 'formatRepeatLabel: daily without time returns "Repeats every day"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'daily', interval: 1, byDay: null });
        assert(result === 'Repeats every day', `Expected "Repeats every day", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-monthly-with-time',
      name: 'formatRepeatLabel: monthly interval 1 with time returns "Repeats every month at 12pm"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'monthly', interval: 1, byDay: null }, '12:00');
        assert(result === 'Repeats every month at 12pm', `Expected "Repeats every month at 12pm", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-monthly-interval-3-with-time',
      name: 'formatRepeatLabel: monthly interval 3 with time returns "Repeats every 3 months at 12pm"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'monthly', interval: 3, byDay: null }, '12:00');
        assert(result === 'Repeats every 3 months at 12pm', `Expected "Repeats every 3 months at 12pm", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-monthly-date-interval-1',
      name: 'formatRepeatLabel: monthly interval 1 + date + time → "Repeats every month on 12th at 12pm"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'monthly', interval: 1, byDay: null }, '12:00', '2026-03-12');
        assert(result === 'Repeats every month on 12th at 12pm', `Expected "Repeats every month on 12th at 12pm", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-monthly-date-interval-2',
      name: 'formatRepeatLabel: monthly interval 2 + date + time → "Repeats every 2 months on 12th at 12pm"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'monthly', interval: 2, byDay: null }, '12:00', '2026-03-12');
        assert(result === 'Repeats every 2 months on 12th at 12pm', `Expected "Repeats every 2 months on 12th at 12pm", got "${result}"`);
      },
    },

    {
      id: 'repeat-label-monthly-no-date',
      name: 'formatRepeatLabel: monthly with no schedule date omits "on …"',
      run: () => {
        const result = formatRepeatLabel({ frequency: 'monthly', interval: 1, byDay: null }, '12:00', undefined);
        assert(result === 'Repeats every month at 12pm', `Expected "Repeats every month at 12pm", got "${result}"`);
      },
    },

    // ========================================================================
    // 7. Overdue detection - isOverdue pure function
    // ========================================================================
    // Fixed now: Wed 2026-02-25 14:00

    {
      id: 'overdue-yesterday-date-only',
      name: 'Overdue: yesterday (date only) is overdue',
      run: () => {
        const now = new Date(2026, 1, 25, 14, 0);
        const r = makeReminder({ id: 'od-1', schedule: { kind: 'scheduled', date: '2026-02-24' } });
        assert(isOverdue(r, now) === true, 'Expected yesterday date-only to be overdue');
      },
    },

    {
      id: 'overdue-today-earlier-time',
      name: 'Overdue: today + earlier time is overdue',
      run: () => {
        const now = new Date(2026, 1, 25, 14, 0);
        const r = makeReminder({ id: 'od-2', schedule: { kind: 'scheduled', date: '2026-02-25', time: '09:00' } });
        assert(isOverdue(r, now) === true, 'Expected today + earlier time to be overdue');
      },
    },

    {
      id: 'overdue-today-later-time',
      name: 'Overdue: today + later time is NOT overdue',
      run: () => {
        const now = new Date(2026, 1, 25, 14, 0);
        const r = makeReminder({ id: 'od-3', schedule: { kind: 'scheduled', date: '2026-02-25', time: '18:00' } });
        assert(isOverdue(r, now) === false, 'Expected today + later time to NOT be overdue');
      },
    },

    {
      id: 'overdue-tomorrow',
      name: 'Overdue: tomorrow is NOT overdue',
      run: () => {
        const now = new Date(2026, 1, 25, 14, 0);
        const r = makeReminder({ id: 'od-4', schedule: { kind: 'scheduled', date: '2026-02-26' } });
        assert(isOverdue(r, now) === false, 'Expected tomorrow to NOT be overdue');
      },
    },

    {
      id: 'overdue-sometime-false',
      name: 'Overdue: sometime schedule is never overdue',
      run: () => {
        const now = new Date(2026, 1, 25, 14, 0);
        const r = makeReminder({ id: 'od-5', schedule: { kind: 'sometime' } });
        assert(isOverdue(r, now) === false, 'Expected sometime to NOT be overdue');
      },
    },

    {
      id: 'overdue-today-date-only-not-overdue',
      name: 'Overdue: today (date only, no time) is NOT overdue',
      run: () => {
        const now = new Date(2026, 1, 25, 14, 0);
        const r = makeReminder({ id: 'od-7', schedule: { kind: 'scheduled', date: '2026-02-25' } });
        assert(isOverdue(r, now) === false, 'Expected today date-only to NOT be overdue');
      },
    },

    // ========================================================================
    // 8. Overdue sorting - pinned to absolute top of every view
    // ========================================================================

    {
      id: 'overdue-sort-pinned-in-this-week',
      name: 'Overdue sorting: overdue items pinned to top within this-week list',
      run: () => {
        // Runtime now ≈ Thu 2026-02-26, week = Mon 23 Feb - Sun 1 Mar
        // Tue 24 Feb (overdue, this-week), Sat 28 Feb (not overdue, this-week)
        const list: Reminder[] = [
          makeReminder({ id: 'tw-future', createdAt: 1, schedule: { kind: 'scheduled', date: '2026-02-28' } }),
          makeReminder({ id: 'tw-overdue', createdAt: 2, schedule: { kind: 'scheduled', date: '2026-02-24' } }),
        ];
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const sorted = sortReminders(list, now);
        assert(sorted[0].id === 'tw-overdue', `Expected overdue item first, got ${sorted[0].id}`);
        assert(sorted[1].id === 'tw-future', `Expected future item second, got ${sorted[1].id}`);
      },
    },

    {
      id: 'overdue-sort-absolute-top',
      name: 'Overdue sorting: overdue items appear above ALL non-overdue items regardless of category',
      run: () => {
        // Runtime now ≈ Thu 2026-02-26
        // Overdue this-week item should appear ABOVE non-overdue today item
        const list: Reminder[] = [
          makeReminder({ id: 'tw-future', createdAt: 1, schedule: { kind: 'scheduled', date: '2026-02-28' } }), // this-week, not overdue
          makeReminder({ id: 'tw-overdue', createdAt: 2, schedule: { kind: 'scheduled', date: '2026-02-24' } }), // this-week, overdue (Tue past)
          makeReminder({ id: 'today-ok', createdAt: 3, schedule: { kind: 'scheduled', date: '2026-02-26', time: '23:59' } }), // today, not overdue
          makeReminder({ id: 'sometime-1', createdAt: 4, schedule: { kind: 'sometime' } }), // sometime
        ];
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const sorted = sortReminders(list, now);
        // Expected order: tw-overdue (overdue, absolute top), today-ok (today cat), tw-future (this-week), sometime-1
        assert(sorted[0].id === 'tw-overdue', `Expected tw-overdue first (overdue pinned to absolute top), got ${sorted[0].id}`);
        assert(sorted[1].id === 'today-ok', `Expected today-ok second, got ${sorted[1].id}`);
        assert(sorted[2].id === 'tw-future', `Expected tw-future third, got ${sorted[2].id}`);
        assert(sorted[3].id === 'sometime-1', `Expected sometime-1 fourth, got ${sorted[3].id}`);
      },
    },

    // ========================================================================
    // 9. Legacy hydration migration
    // ========================================================================

    {
      id: 'hydration-legacy-schedule-migration',
      name: 'Hydration: legacy localStorage with removed schedule kind loads as "sometime"',
      run: () => {
        withIsolatedStorage(() => {
          const legacy = [
            { id: 'legacy-1', text: 'Old reminder', createdAt: 1000, schedule: { kind: 'inbox' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

          const loaded = loadReminders();
          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].schedule.kind === 'sometime', `Expected schedule kind "sometime" after migration, got "${loaded[0].schedule.kind}"`);
          assert(loaded[0].id === 'legacy-1', `Expected id preserved, got ${loaded[0].id}`);
          assert(loaded[0].originalText === 'Old reminder', `Expected originalText preserved from legacy text, got "${loaded[0].originalText}"`);
          assert(loaded[0].displayText === 'Old reminder', `Expected displayText set equal to legacy text, got "${loaded[0].displayText}"`);
        });
      },
    },

    {
      id: 'hydration-legacy-text-migration',
      name: 'Hydration: legacy localStorage with "text" migrates to originalText + displayText',
      run: () => {
        withIsolatedStorage(() => {
          const legacy = [
            { id: 'legacy-txt', text: 'Pick up groceries', createdAt: 500, schedule: { kind: 'sometime' } },
          ];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

          const loaded = loadReminders();
          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].originalText === 'Pick up groceries', `Expected originalText "Pick up groceries", got "${loaded[0].originalText}"`);
          assert(loaded[0].displayText === 'Pick up groceries', `Expected displayText "Pick up groceries", got "${loaded[0].displayText}"`);
        });
      },
    },

    // ========================================================================
    // 10. Text normalisation — normaliseReminderText
    // ========================================================================
    // Fixed now: Thu 2026-02-26 12:00

    {
      id: 'normalise-tomorrow-with-time',
      name: 'Normalise: "Call mum tomorrow night at 7:30pm" → "Call mum on Friday at 7:30pm"',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const result = normaliseReminderText(
          'Call mum tomorrow night at 7:30pm',
          { kind: 'scheduled', date: '2026-02-27', time: '19:30' },
          null,
          now,
        );
        assert(result === 'Call mum on Friday at 7:30pm', `Expected "Call mum on Friday at 7:30pm", got "${result}"`);
      },
    },

    {
      id: 'normalise-next-monday-date-only',
      name: 'Normalise: "Pay rent next Monday" → "Pay rent on Monday" (within 6 days uses weekday)',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0);
        const result = normaliseReminderText(
          'Pay rent next Monday',
          { kind: 'scheduled', date: '2026-03-02' },
          null,
          now,
        );
        // 26 Feb → 2 Mar = 4 days, within 6-day threshold → weekday format
        assert(result === 'Pay rent on Monday', `Expected "Pay rent on Monday", got "${result}"`);
      },
    },

    {
      id: 'normalise-tonight-with-time',
      name: 'Normalise: "Dinner tonight" → "Dinner on Thursday at 7pm"',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0);
        const result = normaliseReminderText(
          'Dinner tonight',
          { kind: 'scheduled', date: '2026-02-26', time: '19:00' },
          null,
          now,
        );
        assert(result === 'Dinner on Thursday at 7pm', `Expected "Dinner on Thursday at 7pm", got "${result}"`);
      },
    },

    {
      id: 'normalise-no-date-unchanged',
      name: 'Normalise: "Buy milk" with no date returns unchanged',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0);
        const result = normaliseReminderText(
          'Buy milk',
          { kind: 'sometime' },
          null,
          now,
        );
        assert(result === 'Buy milk', `Expected "Buy milk", got "${result}"`);
      },
    },

    {
      id: 'normalise-no-time-no-at',
      name: 'Normalise: scheduled date-only does not inject "at" time',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0);
        const result = normaliseReminderText(
          'Meeting tomorrow',
          { kind: 'scheduled', date: '2026-02-27' },
          null,
          now,
        );
        assert(result === 'Meeting on Friday', `Expected "Meeting on Friday", got "${result}"`);
        assert(!result.includes('at '), 'Expected no "at" time injection for date-only schedule');
      },
    },

    {
      id: 'normalise-recurring-no-date-injection',
      name: 'Normalise: recurring \"Call mum every wednesday at 7pm\" does not inject \"on Wednesday\"',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const repeatRule = { frequency: 'weekly' as const, interval: 1, byDay: ['we' as const] };
        const result = normaliseReminderText(
          'Call mum every wednesday at 7pm',
          { kind: 'scheduled', date: '2026-03-04', time: '19:00' },
          repeatRule,
          now,
        );
        assert(result.includes('every wednesday'), `Expected result to contain "every wednesday", got "${result}"`);
        assert(result.includes('at 7pm'), `Expected result to contain "at 7pm", got "${result}"`);
        assert(!result.includes('on Wednesday'), `Expected no "on Wednesday" injection, got "${result}"`);
        assert(!result.includes(' on '), `Expected no " on " phrase at all, got "${result}"`);
      },
    },

    {
      id: 'normalise-month-date-short-with-time',
      name: 'Normalise: "Call mum Feb 28 at 7pm" → "Call mum at 7pm"',
      run: () => {
        const now = new Date(2026, 1, 27, 10, 0); // Thu 27 Feb 2026
        const result = normaliseReminderText(
          'Call mum Feb 28 at 7pm',
          { kind: 'scheduled', date: '2026-02-28', time: '19:00' },
          null,
          now,
        );
        assert(result === 'Call mum at 7pm', `Expected "Call mum at 7pm", got "${result}"`);
      },
    },

    {
      id: 'normalise-month-date-full-ordinal',
      name: 'Normalise: "Call mum February 28th" → "Call mum"',
      run: () => {
        const now = new Date(2026, 1, 27, 10, 0); // Thu 27 Feb 2026
        const result = normaliseReminderText(
          'Call mum February 28th',
          { kind: 'scheduled', date: '2026-02-28' },
          null,
          now,
        );
        assert(result === 'Call mum', `Expected "Call mum", got "${result}"`);
      },
    },

    {
      id: 'normalise-month-date-explicit-year',
      name: 'Normalise: "Car MOT March 7th 2027 at 12pm" → "Car MOT at 12pm"',
      run: () => {
        const now = new Date(2026, 1, 27, 10, 0); // Thu 27 Feb 2026
        const result = normaliseReminderText(
          'Car MOT March 7th 2027 at 12pm',
          { kind: 'scheduled', date: '2027-03-07', time: '12:00' },
          null,
          now,
        );
        assert(result === 'Car MOT at 12pm', `Expected "Car MOT at 12pm", got "${result}"`);
      },
    },

    {
      id: 'normalise-month-date-no-year',
      name: 'Normalise: "Car MOT March 7th at 12pm" → "Car MOT at 12pm"',
      run: () => {
        const now = new Date(2026, 1, 27, 10, 0); // Thu 27 Feb 2026
        const result = normaliseReminderText(
          'Car MOT March 7th at 12pm',
          { kind: 'scheduled', date: '2026-03-07', time: '12:00' },
          null,
          now,
        );
        assert(result === 'Car MOT at 12pm', `Expected "Car MOT at 12pm", got "${result}"`);
      },
    },

    // Regression: absolute date + time-of-day phrase — no orphan "in the"
    {
      id: 'normalise-absolute-date-morning-phrase',
      name: 'Normalise: "Call mum March 1 in the morning" → "Call mum at 7am"',
      run: () => {
        const now = new Date(2026, 1, 28, 12, 0); // Sat 28 Feb 2026
        const result = normaliseReminderText(
          'Call mum March 1 in the morning',
          { kind: 'scheduled', date: '2026-03-01', time: '07:00' },
          null,
          now,
        );
        assert(!result.includes('in the'), `Expected no "in the" fragment, got "${result}"`);
        assert(!result.includes('on Sunday'), `Expected no "on Sunday", got "${result}"`);
        assert(result === 'Call mum at 7am', `Expected "Call mum at 7am", got "${result}"`);
      },
    },

    // Regression: variant without "the"
    {
      id: 'normalise-absolute-date-morning-no-the',
      name: 'Normalise: "Call mum March 1 in morning" → "Call mum at 7am"',
      run: () => {
        const now = new Date(2026, 1, 28, 12, 0); // Sat 28 Feb 2026
        const result = normaliseReminderText(
          'Call mum March 1 in morning',
          { kind: 'scheduled', date: '2026-03-01', time: '07:00' },
          null,
          now,
        );
        assert(!result.includes('in '), `Expected no orphan "in", got "${result}"`);
        assert(result === 'Call mum at 7am', `Expected "Call mum at 7am", got "${result}"`);
      },
    },

    // Safety: legitimate "on" in middle is preserved
    {
      id: 'normalise-absolute-date-keeps-middle-on',
      name: 'Normalise: "Call mum on speaker March 1 in the morning" keeps "on speaker"',
      run: () => {
        const now = new Date(2026, 1, 28, 12, 0); // Sat 28 Feb 2026
        const result = normaliseReminderText(
          'Call mum on speaker March 1 in the morning',
          { kind: 'scheduled', date: '2026-03-01', time: '07:00' },
          null,
          now,
        );
        assert(result.includes('on speaker'), `Expected "on speaker" preserved, got "${result}"`);
        assert(!result.includes('in the'), `Expected no orphan "in the", got "${result}"`);
        assert(result === 'Call mum on speaker at 7am', `Expected "Call mum on speaker at 7am", got "${result}"`);
      },
    },

    {
      id: 'normalise-manual-date-no-injection',
      name: 'Normalise: manual date selection (skipDateInjection) does not alter text',
      run: () => {
        const now = new Date(2026, 1, 26, 12, 0); // Thu 26 Feb 2026
        const result = normaliseReminderText(
          'Test reminder',
          { kind: 'scheduled', date: '2026-03-26' },
          null,
          now,
          { skipDateInjection: true },
        );
        assert(result === 'Test reminder', `Expected "Test reminder", got "${result}"`);
      },
    },

    {
      id: 'normalise-bare-weekday-no-duplication',
      name: 'Normalise: bare weekday after stripping is replaced in-place, not duplicated',
      run: () => {
        // now = Fri 27 Feb 2026; schedule = Thu 5 Mar 2026 (6 days out, within-6-days branch)
        const now = new Date(2026, 1, 27, 12, 0);
        const scheduleDate = '2026-03-05';
        const d = new Date(2026, 2, 5);
        const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const expectedWeekday = WEEKDAYS[d.getDay()];
        const expectedDD = d.getDate();
        const expectedMon = MONTHS[d.getMonth()];

        const result = normaliseReminderText(
          'test reminder for thursday next week',
          { kind: 'scheduled', date: scheduleDate },
          null,
          now,
        );
        const expectedText = `test reminder for ${expectedWeekday} ${expectedDD} ${expectedMon}`;
        assert(result === expectedText, `Expected "${expectedText}", got "${result}"`);
      },
    },

    // ========================================================================
    // 10b. Restore from done — bucket colour consistency
    // ========================================================================

    {
      id: 'restore-bucket-colour-matches-repeat-reinsertion',
      name: 'Restore: bucket colour after clearing completedAt matches repeat reinsertion derivation',
      run: () => {
        const CATEGORY_COLOURS: Record<string, string> = {
          today: '#00AFEE',
          'this-week': '#DF4DFC',
          later: '#FAA429',
          sometime: '#939393',
        };
        const OVERDUE_COLOUR = '#F2243E';
        const now = new Date(2026, 1, 25, 12, 0); // Wed 25 Feb 2026

        // Simulate a "today" reminder that was completed and is now restored
        const restored: Reminder = makeReminder({
          id: 'restore-1',
          schedule: { kind: 'scheduled', date: '2026-02-25' },
          completedAt: undefined, // cleared — same as completedAt: null
        });
        // Simulate a repeat reinsertion with the same schedule
        const reinserted: Reminder = makeReminder({
          id: 'reinsert-1',
          schedule: { kind: 'scheduled', date: '2026-02-25' },
        });

        const catRestored = categoriseReminder(restored, now);
        const catReinserted = categoriseReminder(reinserted, now);
        assert(catRestored === catReinserted, `Expected same category, got restored="${catRestored}" vs reinserted="${catReinserted}"`);

        const overdueRestored = isOverdue(restored, now);
        const overdueReinserted = isOverdue(reinserted, now);
        const colourRestored = overdueRestored ? OVERDUE_COLOUR : CATEGORY_COLOURS[catRestored] ?? '#939393';
        const colourReinserted = overdueReinserted ? OVERDUE_COLOUR : CATEGORY_COLOURS[catReinserted] ?? '#939393';
        assert(colourRestored === colourReinserted, `Expected same colour, got restored="${colourRestored}" vs reinserted="${colourReinserted}"`);
      },
    },

    {
      id: 'restore-bucket-colour-overdue',
      name: 'Restore: overdue restored reminder gets OVERDUE colour (same as repeat reinsertion)',
      run: () => {
        const OVERDUE_COLOUR = '#F2243E';
        const now = new Date(2026, 1, 25, 14, 0); // Wed 25 Feb 14:00

        // Reminder was due yesterday — overdue after restore
        const restored: Reminder = makeReminder({
          id: 'restore-overdue',
          schedule: { kind: 'scheduled', date: '2026-02-24' },
          completedAt: undefined,
        });
        const reinserted: Reminder = makeReminder({
          id: 'reinsert-overdue',
          schedule: { kind: 'scheduled', date: '2026-02-24' },
        });

        assert(isOverdue(restored, now) === true, 'Expected restored to be overdue');
        assert(isOverdue(reinserted, now) === true, 'Expected reinserted to be overdue');
        // Both should produce OVERDUE_COLOUR
        const catR = categoriseReminder(restored, now);
        const catI = categoriseReminder(reinserted, now);
        const colR = isOverdue(restored, now) ? OVERDUE_COLOUR : '#000';
        const colI = isOverdue(reinserted, now) ? OVERDUE_COLOUR : '#000';
        assert(colR === OVERDUE_COLOUR, `Expected OVERDUE_COLOUR for restored, got ${colR}`);
        assert(colI === OVERDUE_COLOUR, `Expected OVERDUE_COLOUR for reinserted, got ${colI}`);
        assert(colR === colI, `Expected same colour, got restored="${colR}" vs reinserted="${colI}"`);
      },
    },

    // ========================================================================
    // 11. renderReminderText — presentation-only "today" substitution
    // ========================================================================

    {
      id: 'render-text-today-substitution',
      name: 'renderReminderText: scheduled date equals today → output contains "today"',
      run: () => {
        const now = new Date(2026, 1, 26, 14, 0); // Thu 26 Feb 2026
        const r = makeReminder({
          id: 'rt-today',
          schedule: { kind: 'scheduled', date: '2026-02-26', time: '19:30' },
        });
        r.displayText = 'Call mum on Thursday at 7:30pm';
        const result = renderReminderText(r, now);
        assert(result.includes('today'), `Expected output to contain "today", got "${result}"`);
        assert(result === 'Call mum today at 7:30pm', `Expected "Call mum today at 7:30pm", got "${result}"`);
      },
    },

    {
      id: 'render-text-not-today-unchanged',
      name: 'renderReminderText: scheduled date not today/tomorrow → output equals displayText',
      run: () => {
        const now = new Date(2026, 1, 26, 14, 0); // Thu 26 Feb 2026
        const r = makeReminder({
          id: 'rt-sat',
          schedule: { kind: 'scheduled', date: '2026-02-28', time: '19:30' },
        });
        r.displayText = 'Call mum on Saturday at 7:30pm';
        const result = renderReminderText(r, now);
        assert(result === r.displayText, `Expected unchanged displayText, got "${result}"`);
      },
    },

    {
      id: 'render-text-sometime-unchanged',
      name: 'renderReminderText: non-scheduled reminder → output equals displayText',
      run: () => {
        const now = new Date(2026, 1, 26, 14, 0);
        const r = makeReminder({
          id: 'rt-sometime',
          schedule: { kind: 'sometime' },
        });
        r.displayText = 'Buy milk';
        const result = renderReminderText(r, now);
        assert(result === r.displayText, `Expected unchanged displayText, got "${result}"`);
      },
    },

    {
      id: 'render-text-tomorrow-substitution',
      name: 'renderReminderText: scheduled date equals tomorrow → output contains "tomorrow"',
      run: () => {
        const now = new Date(2026, 1, 26, 14, 0); // Thu 26 Feb 2026
        const r = makeReminder({
          id: 'rt-tomorrow',
          schedule: { kind: 'scheduled', date: '2026-02-27', time: '19:30' },
        });
        r.displayText = 'Call mum on Friday at 7:30pm';
        const result = renderReminderText(r, now);
        assert(result.includes('tomorrow'), `Expected output to contain "tomorrow", got "${result}"`);
        assert(!result.includes('on Friday'), `Expected no "on Friday" in output, got "${result}"`);
        assert(!result.includes('on 27 Feb'), `Expected no "on 27 Feb" in output, got "${result}"`);
        assert(result === 'Call mum tomorrow at 7:30pm', `Expected "Call mum tomorrow at 7:30pm", got "${result}"`);
      },
    },

    {
      id: 'render-text-not-tomorrow-unchanged',
      name: 'renderReminderText: scheduled date 2+ days away → output equals displayText',
      run: () => {
        const now = new Date(2026, 1, 26, 14, 0); // Thu 26 Feb 2026
        const r = makeReminder({
          id: 'rt-sat2',
          schedule: { kind: 'scheduled', date: '2026-02-28', time: '19:30' },
        });
        r.displayText = 'Call mum on Saturday at 7:30pm';
        const result = renderReminderText(r, now);
        assert(result === r.displayText, `Expected unchanged displayText, got "${result}"`);
      },
    },

    {
      id: 'render-text-recurring-today',
      name: 'renderReminderText: recurring reminder due today → "Meditate today at 7am"',
      run: () => {
        // Fixed now = Thursday 26 Feb 2026
        const now = new Date(2026, 1, 26, 14, 0);
        const r = makeReminder({
          id: 'rt-recur-today',
          schedule: { kind: 'scheduled', date: '2026-02-26', time: '07:00' },
          repeatRule: { frequency: 'daily', interval: 1 },
        });
        r.displayText = 'Meditate every morning at 7am';
        const result = renderReminderText(r, now);
        assert(result === 'Meditate today at 7am', `Expected "Meditate today at 7am", got "${result}"`);
      },
    },

    {
      id: 'render-text-recurring-not-today',
      name: 'renderReminderText: recurring reminder not due today → unchanged displayText',
      run: () => {
        // Fixed now = Thursday 26 Feb 2026, scheduled for tomorrow (27 Feb)
        const now = new Date(2026, 1, 26, 14, 0);
        const r = makeReminder({
          id: 'rt-recur-not-today',
          schedule: { kind: 'scheduled', date: '2026-02-27', time: '07:00' },
          repeatRule: { frequency: 'daily', interval: 1 },
        });
        r.displayText = 'Meditate every morning at 7am';
        const result = renderReminderText(r, now);
        assert(result === r.displayText, `Expected unchanged displayText, got "${result}"`);
      },
    },

    // ========================================================================
    // 12. Date indicator label — year suffix
    // ========================================================================

    {
      id: 'date-indicator-same-year',
      name: 'Date indicator: same year → "Mar 7th" (no year)',
      run: () => {
        const now = new Date(2026, 1, 27, 10, 0); // 27 Feb 2026
        const date = new Date(2026, 2, 7); // 7 Mar 2026
        const result = formatSelectedDate(date, now);
        assert(result === 'Mar 7th', `Expected "Mar 7th", got "${result}"`);
      },
    },

    {
      id: 'date-indicator-different-year',
      name: 'Date indicator: different year → "Mar 7th, 2027"',
      run: () => {
        const now = new Date(2026, 1, 27, 10, 0); // 27 Feb 2026
        const date = new Date(2027, 2, 7); // 7 Mar 2027
        const result = formatSelectedDate(date, now);
        assert(result === 'Mar 7th, 2027', `Expected "Mar 7th, 2027", got "${result}"`);
      },
    },

    // ========================================================================
    // 13. getDisplayTitle — trailing injected suffix stripping
    // ========================================================================

    {
      id: 'display-title-strip-date-and-time',
      name: 'getDisplayTitle: strips exact trailing " on <date> at <time>"',
      run: () => {
        const r = makeReminder({
          id: 'dt-date-time',
          schedule: { kind: 'scheduled', date: '2026-03-21', time: '21:00' },
        });
        r.displayText = 'Call mum on 21 Mar at 9pm';
        const result = getDisplayTitle(r);
        assert(result === 'Call mum', `Expected "Call mum", got "${result}"`);
      },
    },

    {
      id: 'display-title-strip-date-only',
      name: 'getDisplayTitle: strips exact trailing " on <date>"',
      run: () => {
        const r = makeReminder({
          id: 'dt-date-only',
          schedule: { kind: 'scheduled', date: '2026-03-21' },
        });
        r.displayText = 'Call mum on 21 Mar';
        const result = getDisplayTitle(r);
        assert(result === 'Call mum', `Expected "Call mum", got "${result}"`);
      },
    },

    {
      id: 'display-title-strip-time-only',
      name: 'getDisplayTitle: strips exact trailing " at <time>"',
      run: () => {
        const r = makeReminder({
          id: 'dt-time-only',
          schedule: { kind: 'scheduled', date: '2026-03-15', time: '21:00' },
        });
        r.displayText = 'Call mum at 9pm';
        const result = getDisplayTitle(r);
        assert(result === 'Call mum', `Expected "Call mum", got "${result}"`);
      },
    },

    {
      id: 'display-title-no-strip-mid-string',
      name: 'getDisplayTitle: does NOT strip when same text appears mid-string',
      run: () => {
        const r = makeReminder({
          id: 'dt-mid-string',
          schedule: { kind: 'scheduled', date: '2026-03-15', time: '21:00' },
        });
        r.displayText = 'Call mum at 9pm about dinner on 15 Mar at 9pm';
        const result = getDisplayTitle(r);
        // Should strip the trailing suffix, leaving the mid-string "at 9pm" intact
        assert(result === 'Call mum at 9pm about dinner', `Expected "Call mum at 9pm about dinner", got "${result}"`);
      },
    },

    {
      id: 'display-title-no-strip-no-match',
      name: 'getDisplayTitle: does NOT strip when no exact match exists',
      run: () => {
        const r = makeReminder({
          id: 'dt-no-match',
          schedule: { kind: 'scheduled', date: '2026-03-15', time: '21:00' },
        });
        r.displayText = 'Call mum about the 9pm booking';
        const result = getDisplayTitle(r);
        assert(result === 'Call mum about the 9pm booking', `Expected "Call mum about the 9pm booking", got "${result}"`);
      },
    },
  ];
}