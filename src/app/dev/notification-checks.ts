import type { Check } from './check-system';
import type { Reminder } from '../reminder-utils';
import { computeBadgeCount, getNextTimeRefreshBoundary, getTodayProgress } from '../reminder-utils';
import { buildScheduledNotifications } from '../notifications';
import { askStateAfterNotNow, askStateOnLaunch, readAskState, settingsToggleNeedsAsk, shouldAskAutomatically, writeAskState } from '../notification-ask';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function yesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'test-1',
    originalText: 'Test reminder',
    displayText: 'Test reminder',
    createdAt: Date.now(),
    schedule: { kind: 'scheduled', date: '2026-06-01', time: '10:00' },
    ...overrides,
  };
}

export function getNotificationChecks(): Check[] {
  return [
    {
      id: 'notif-badge-counts-overdue',
      name: 'Badge count: counts overdue reminders',
      run: () => {
        const now = new Date();
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' } }),
        ];
        const count = computeBadgeCount(reminders, false, now);
        assert(count === 1, `Expected 1, got ${count}`);
      },
    },
    {
      id: 'notif-badge-includes-today-when-enabled',
      name: 'Badge count: includes today reminders when includeTodayInBadge is true',
      run: () => {
        const now = new Date();
        now.setHours(6, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '14:00' } }),
        ];
        const count = computeBadgeCount(reminders, true, now);
        assert(count === 1, `Expected 1, got ${count}`);
      },
    },
    {
      id: 'notif-badge-excludes-today-when-disabled',
      name: 'Badge count: excludes today reminders when includeTodayInBadge is false',
      run: () => {
        const now = new Date();
        now.setHours(6, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '14:00' } }),
        ];
        const count = computeBadgeCount(reminders, false, now);
        assert(count === 0, `Expected 0, got ${count}`);
      },
    },
    {
      id: 'notif-badge-excludes-completed',
      name: 'Badge count: excludes completed reminders',
      run: () => {
        const now = new Date();
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' }, completedAt: Date.now() }),
        ];
        const count = computeBadgeCount(reminders, false, now);
        assert(count === 0, `Expected 0, got ${count}`);
      },
    },
    {
      id: 'notif-badge-excludes-deleted',
      name: 'Badge count: excludes deleted reminders',
      run: () => {
        const now = new Date();
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' }, deletedAt: Date.now() }),
        ];
        const count = computeBadgeCount(reminders, false, now);
        assert(count === 0, `Expected 0, got ${count}`);
      },
    },
    {
      id: 'notif-badge-excludes-sometime',
      name: 'Badge count: excludes sometime reminders',
      run: () => {
        const now = new Date();
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'sometime' } }),
        ];
        const count = computeBadgeCount(reminders, true, now);
        assert(count === 0, `Expected 0, got ${count}`);
      },
    },
    {
      id: 'notif-badge-zero-when-empty',
      name: 'Badge count: returns 0 when no reminders match',
      run: () => {
        const now = new Date();
        const count = computeBadgeCount([], false, now);
        assert(count === 0, `Expected 0, got ${count}`);
      },
    },
    {
      id: 'notif-payload-badge-computed',
      name: 'Notification payload: sets badge to computed count at fire time',
      run: () => {
        const overdue = makeReminder({
          id: 'overdue-1',
          schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' },
        });
        const future = makeReminder({
          id: 'future-1',
          schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
        });
        const result = buildScheduledNotifications([overdue, future], true, false);
        const futureNotif = result.find((n) => n.extra.reminderId === 'future-1');
        assert(futureNotif !== undefined, 'Expected future notification');
        assert(futureNotif!.badge >= 1, `Expected badge >= 1, got ${futureNotif!.badge}`);
      },
    },
    {
      id: 'notif-payload-badge-zero-when-disabled',
      name: 'Notification payload: sets badge to 0 when notifAppBadge is false',
      run: () => {
        const future = makeReminder({
          id: 'future-1',
          schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
        });
        const result = buildScheduledNotifications([future], false, false);
        const notif = result.find((n) => n.extra.reminderId === 'future-1');
        assert(notif !== undefined, 'Expected notification');
        assert(notif!.badge === 0, `Expected badge 0, got ${notif!.badge}`);
      },
    },
    {
      id: 'notif-delta-positive-when-badge',
      name: 'Badge delta: sets badgeDeltaOnAction to 1 when badge > 0',
      run: () => {
        const overdue = makeReminder({
          id: 'overdue-1',
          schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' },
        });
        const future = makeReminder({
          id: 'future-1',
          schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
        });
        const result = buildScheduledNotifications([overdue, future], true, false);
        const futureNotif = result.find((n) => n.extra.reminderId === 'future-1');
        assert(futureNotif!.badge > 0, `Expected badge > 0, got ${futureNotif!.badge}`);
        assert(futureNotif!.extra.badgeDeltaOnAction === 1, `Expected delta 1, got ${futureNotif!.extra.badgeDeltaOnAction}`);
      },
    },
    {
      id: 'notif-delta-zero-when-no-badge',
      name: 'Badge delta: sets badgeDeltaOnAction to 0 when badge is 0',
      run: () => {
        const future = makeReminder({
          id: 'future-1',
          schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' },
        });
        const result = buildScheduledNotifications([future], false, false);
        const notif = result.find((n) => n.extra.reminderId === 'future-1');
        assert(notif!.badge === 0, `Expected badge 0, got ${notif!.badge}`);
        assert(notif!.extra.badgeDeltaOnAction === 0, `Expected delta 0, got ${notif!.extra.badgeDeltaOnAction}`);
      },
    },
    {
      id: 'notif-limit-64-no-midnight',
      name: 'Scheduling limits: limits to 64 notifications when no midnight needed',
      run: () => {
        const reminders: Reminder[] = [];
        for (let i = 0; i < 70; i++) {
          const date = futureDate(Math.floor(i / 24) + 1);
          const hour = String(i % 24).padStart(2, '0');
          reminders.push(makeReminder({
            id: `r-${i}`,
            displayText: `Reminder ${i}`,
            schedule: { kind: 'scheduled', date, time: `${hour}:00` },
          }));
        }
        const result = buildScheduledNotifications(reminders, true, false);
        assert(result.length === 64, `Expected 64, got ${result.length}`);
        assert(result.every((n) => n.title === 'Reminderly'), 'Expected all titles to be Reminderly');
      },
    },
    {
      id: 'notif-limit-63-plus-midnight',
      name: 'Scheduling limits: 63 reminder notifications plus midnight when date-only exists',
      run: () => {
        const reminders: Reminder[] = [
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
        ];
        for (let i = 0; i < 70; i++) {
          const date = futureDate(Math.floor(i / 24) + 1);
          const hour = String(i % 24).padStart(2, '0');
          reminders.push(makeReminder({
            id: `r-${i}`,
            displayText: `Reminder ${i}`,
            schedule: { kind: 'scheduled', date, time: `${hour}:00` },
          }));
        }
        const result = buildScheduledNotifications(reminders, true, false);
        const midnightNotif = result.find((n) => n.id === 2147483647);
        const reminderNotifs = result.filter((n) => n.id !== 2147483647);
        assert(midnightNotif !== undefined, 'Expected midnight notification');
        assert(reminderNotifs.length === 63, `Expected 63 reminder notifs, got ${reminderNotifs.length}`);
        assert(result.length === 64, `Expected 64 total, got ${result.length}`);
      },
    },
    {
      id: 'notif-midnight-included-date-only',
      name: 'Midnight notification: included when active date-only reminder exists',
      run: () => {
        const reminders = [
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
        ];
        const result = buildScheduledNotifications(reminders, true, false);
        const midnight = result.find((n) => n.id === 2147483647);
        assert(midnight !== undefined, 'Expected midnight notification');
      },
    },
    {
      id: 'notif-midnight-excluded-timed-only',
      name: 'Midnight notification: excluded when all reminders have times',
      run: () => {
        const reminders = [
          makeReminder({ id: 'timed', schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' } }),
        ];
        const result = buildScheduledNotifications(reminders, true, false);
        const midnight = result.find((n) => n.id === 2147483647);
        assert(midnight === undefined, 'Unexpected midnight notification');
      },
    },
    {
      id: 'notif-midnight-excluded-badge-disabled',
      name: 'Midnight notification: excluded when badge is disabled',
      run: () => {
        const reminders = [
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
        ];
        const result = buildScheduledNotifications(reminders, false, false);
        const midnight = result.find((n) => n.id === 2147483647);
        assert(midnight === undefined, 'Unexpected midnight notification when badge disabled');
      },
    },
    {
      id: 'notif-midnight-empty-title-body',
      name: 'Midnight notification: has empty title and body',
      run: () => {
        const reminders = [
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
        ];
        const result = buildScheduledNotifications(reminders, true, false);
        const midnight = result.find((n) => n.id === 2147483647);
        assert(midnight !== undefined, 'Expected midnight notification');
        assert(midnight!.title === '', `Expected empty title, got '${midnight!.title}'`);
        assert(midnight!.body === '', `Expected empty body, got '${midnight!.body}'`);
      },
    },
    {
      id: 'notif-midnight-excludes-completed',
      name: 'Midnight notification: excludes completed date-only reminders',
      run: () => {
        const reminders = [
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() }, completedAt: Date.now() }),
        ];
        const result = buildScheduledNotifications(reminders, true, false);
        const midnight = result.find((n) => n.id === 2147483647);
        assert(midnight === undefined, 'Unexpected midnight notification for completed reminder');
      },
    },
    {
      id: 'notif-midnight-excludes-deleted',
      name: 'Midnight notification: excludes deleted date-only reminders',
      run: () => {
        const reminders = [
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() }, deletedAt: Date.now() }),
        ];
        const result = buildScheduledNotifications(reminders, true, false);
        const midnight = result.find((n) => n.id === 2147483647);
        assert(midnight === undefined, 'Unexpected midnight notification for deleted reminder');
      },
    },
    {
      id: 'notif-all-64-slots-no-midnight',
      name: 'Scheduling limits: all 64 slots for reminders when no midnight needed',
      run: () => {
        const reminders: Reminder[] = [];
        for (let i = 0; i < 70; i++) {
          const date = futureDate(Math.floor(i / 24) + 1);
          const hour = String(i % 24).padStart(2, '0');
          reminders.push(makeReminder({
            id: `r-${i}`,
            displayText: `Reminder ${i}`,
            schedule: { kind: 'scheduled', date, time: `${hour}:00` },
          }));
        }
        const result = buildScheduledNotifications(reminders, true, false);
        assert(result.length === 64, `Expected 64, got ${result.length}`);
        assert(result.find((n) => n.id === 2147483647) === undefined, 'Unexpected midnight notification');
      },
    },
    {
      id: 'notif-phase4-badge-only',
      name: 'Phase 4: alerts off, badge on schedules silent badge-only notifications plus midnight',
      run: () => {
        const reminders = [
          makeReminder({ id: 'timed', schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' } }),
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
        ];
        const result = buildScheduledNotifications(reminders, true, false, false, true);
        const badgeOnly = result.filter((n) => n.id !== 2147483647);
        assert(badgeOnly.length === 1, `Expected 1 badge-only notification, got ${badgeOnly.length}`);
        const n = badgeOnly[0];
        assert(n.title === '' && n.body === '', 'Badge-only notification should have no title or body');
        assert(n.silent === true && n.sound === undefined, 'Badge-only notification should be silent with no sound');
        assert(n.actionTypeId === '', 'Badge-only notification should have no actions');
        assert(n.badge > 0, `Expected a badge number, got ${n.badge}`);
        assert(result.some((x) => x.id === 2147483647), 'Expected midnight notification');
      },
    },
    {
      id: 'notif-phase4-alerts-badge-off',
      name: 'Phase 4: alerts off, badge off schedules nothing',
      run: () => {
        const reminders = [
          makeReminder({ id: 'timed', schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' } }),
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
        ];
        const result = buildScheduledNotifications(reminders, false, true, false, true);
        assert(result.length === 0, `Expected nothing scheduled, got ${result.length}`);
      },
    },
    {
      id: 'notif-phase4-sound-alerts-only',
      name: 'Phase 4: sound on adds the default sound to alerts only',
      run: () => {
        const reminders = [
          makeReminder({ id: 'timed', schedule: { kind: 'scheduled', date: tomorrowDate(), time: '10:00' } }),
          makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } }),
        ];
        const on = buildScheduledNotifications(reminders, true, false, true, true);
        const off = buildScheduledNotifications(reminders, true, false, true, false);
        assert(on.find((n) => n.id !== 2147483647)?.sound === 'default', 'Expected default sound on the alert');
        assert(on.find((n) => n.id === 2147483647)?.sound === undefined, 'Midnight notification should have no sound');
        assert(off.every((n) => n.sound === undefined), 'Sound off should leave every notification without a sound');
      },
    },
    {
      id: 'notif-phase4-badge-only-limit',
      name: 'Phase 4: badge-only stays within 64 with the midnight slot reserved',
      run: () => {
        const reminders: Reminder[] = [makeReminder({ id: 'date-only', schedule: { kind: 'scheduled', date: todayDate() } })];
        for (let i = 0; i < 70; i++) {
          reminders.push(makeReminder({
            id: `r-${i}`,
            displayText: `Reminder ${i}`,
            schedule: { kind: 'scheduled', date: futureDate(Math.floor(i / 24) + 1), time: `${String(i % 24).padStart(2, '0')}:00` },
          }));
        }
        const result = buildScheduledNotifications(reminders, true, false, false, false);
        assert(result.length === 64, `Expected 64, got ${result.length}`);
        assert(result.some((n) => n.id === 2147483647), 'Expected midnight notification');
      },
    },
    {
      id: 'notif-ask-automatic',
      name: 'Phase 4 ask: automatic ask only while permission is undecided, never asked or declined once',
      run: () => {
        for (const trigger of ['tutorial', 'timed-reminder'] as const) {
          assert(shouldAskAutomatically(null, trigger, 'prompt'), `Never asked should ask at ${trigger}`);
          assert(!shouldAskAutomatically(null, trigger, 'granted'), 'Granted should not ask');
          assert(!shouldAskAutomatically(null, trigger, 'denied'), 'Denied should not ask');
          assert(!shouldAskAutomatically('not-now-2', trigger, 'prompt'), 'not-now-2 should not ask');
          assert(!shouldAskAutomatically('accepted', trigger, 'prompt'), 'accepted should not ask');
          assert(!shouldAskAutomatically('something-else', trigger, 'prompt'), 'Unrecognised state should not ask');
        }
        assert(shouldAskAutomatically('not-now-1', 'timed-reminder', 'prompt'), 'not-now-1 should ask at the next timed reminder');
        assert(!shouldAskAutomatically('not-now-1', 'tutorial', 'prompt'), 'not-now-1 should not ask at the tutorial');
      },
    },
    {
      id: 'notif-ask-not-now',
      name: 'Phase 4 ask: Not now moves automatic asks on one step and leaves settings asks unchanged',
      run: () => {
        assert(askStateAfterNotNow(null, 'automatic') === 'not-now-1', 'First Not now should be not-now-1');
        assert(askStateAfterNotNow('not-now-1', 'automatic') === 'not-now-2', 'Second Not now should be not-now-2');
        assert(askStateAfterNotNow('not-now-2', 'automatic') === 'not-now-2', 'not-now-2 should stay');
        for (const state of [null, 'not-now-1', 'not-now-2', 'odd']) {
          assert(askStateAfterNotNow(state, 'settings') === state, `Settings Not now should keep ${state}`);
        }
      },
    },
    {
      id: 'notif-ask-launch-and-settings',
      name: 'Phase 4 ask: existing installs with permission are accepted, settings toggles ask only while undecided',
      run: () => {
        assert(askStateOnLaunch(null, 'granted') === 'accepted', 'Granted with no state should become accepted');
        assert(askStateOnLaunch(null, 'prompt') === null, 'Undecided should stay unasked');
        assert(askStateOnLaunch(null, 'denied') === null, 'Denied should stay unasked');
        assert(askStateOnLaunch('not-now-1', 'granted') === 'not-now-1', 'A saved state should be kept');
        assert(settingsToggleNeedsAsk(true, 'prompt'), 'Turning on while undecided should ask');
        assert(!settingsToggleNeedsAsk(true, 'granted') && !settingsToggleNeedsAsk(true, 'denied'), 'Decided permission should not ask');
        assert(!settingsToggleNeedsAsk(false, 'prompt'), 'Turning off should never ask');
        const map = new Map<string, string>();
        const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); } };
        assert(readAskState(storage) === null, 'Missing state should read as null');
        writeAskState(null, storage);
        assert(map.size === 0, 'Writing null should write nothing');
        writeAskState('not-now-1', storage);
        assert(readAskState(storage) === 'not-now-1', 'Saved state should read back');
      },
    },
    {
      id: 'notif-refresh-boundary-midnight',
      name: 'Refresh boundary: returns ms to midnight when no timed reminders today',
      run: () => {
        const now = new Date();
        now.setHours(22, 0, 0, 0);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const expectedMs = tomorrow.getTime() - now.getTime();
        const result = getNextTimeRefreshBoundary([], now);
        assert(result === expectedMs, `Expected ${expectedMs}, got ${result}`);
      },
    },
    {
      id: 'notif-refresh-boundary-next-timed',
      name: 'Refresh boundary: returns ms to next timed reminder when sooner than midnight',
      run: () => {
        const now = new Date();
        now.setHours(9, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '10:00' } }),
        ];
        const expected = new Date(now);
        expected.setHours(10, 0, 0, 0);
        const expectedMs = expected.getTime() - now.getTime();
        const result = getNextTimeRefreshBoundary(reminders, now);
        assert(result === expectedMs, `Expected ${expectedMs}, got ${result}`);
      },
    },
    {
      id: 'widget-progress-none-done',
      name: 'Widget progress: today and overdue reminders count as outstanding',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '18:00' } }),
          makeReminder({ id: 'r2', schedule: { kind: 'scheduled', date: todayDate() } }),
          makeReminder({ id: 'r3', schedule: { kind: 'scheduled', date: yesterdayDate(), time: '08:00' } }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 3 && p.done === 0, `Expected 3/0, got ${p.outstanding}/${p.done}`);
        assert(p.date === todayDate(), `Expected date ${todayDate()}, got ${p.date}`);
      },
    },
    {
      id: 'widget-progress-some-done',
      name: 'Widget progress: reminders completed today count as done',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const doneAt = new Date(now).setHours(9, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate() } }),
          makeReminder({ id: 'r2', schedule: { kind: 'scheduled', date: todayDate() }, completedAt: doneAt }),
          makeReminder({ id: 'r3', schedule: { kind: 'scheduled', date: yesterdayDate() }, completedAt: doneAt }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 1 && p.done === 2, `Expected 1/2, got ${p.outstanding}/${p.done}`);
      },
    },
    {
      id: 'widget-progress-all-done',
      name: 'Widget progress: all done gives 0 outstanding',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const doneAt = new Date(now).setHours(9, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate() }, completedAt: doneAt }),
          makeReminder({ id: 'r2', schedule: { kind: 'scheduled', date: todayDate() }, completedAt: doneAt }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 0 && p.done === 2, `Expected 0/2, got ${p.outstanding}/${p.done}`);
      },
    },
    {
      id: 'widget-progress-nothing-due',
      name: 'Widget progress: nothing due gives 0 outstanding and 0 done',
      run: () => {
        const p = getTodayProgress([], new Date());
        assert(p.outstanding === 0 && p.done === 0 && p.dueTomorrow === 0, `Expected all 0, got ${JSON.stringify(p)}`);
      },
    },
    {
      id: 'widget-progress-exclusions',
      name: 'Widget progress: excludes deleted, sometime and future-dated reminders',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate() }, deletedAt: now.getTime() }),
          makeReminder({ id: 'r2', schedule: { kind: 'sometime' } }),
          makeReminder({ id: 'r3', schedule: { kind: 'scheduled', date: futureDate(3) } }),
          makeReminder({ id: 'r4', schedule: { kind: 'scheduled', date: futureDate(3) }, completedAt: now.getTime() }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 0 && p.done === 0, `Expected 0/0, got ${p.outstanding}/${p.done}`);
      },
    },
    {
      id: 'widget-progress-completed-yesterday',
      name: 'Widget progress: reminders completed before today are not counted',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: yesterdayDate() }, completedAt: yesterday.getTime() }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 0 && p.done === 0, `Expected 0/0, got ${p.outstanding}/${p.done}`);
      },
    },
    {
      id: 'widget-progress-due-tomorrow',
      name: 'Widget progress: reminders due tomorrow are counted separately for midnight rollover',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: tomorrowDate(), time: '09:00' } }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 0 && p.dueTomorrow === 1, `Expected 0 outstanding and 1 tomorrow, got ${JSON.stringify(p)}`);
      },
    },
    {
      id: 'widget-progress-tomorrow-completed-early',
      name: 'Widget progress: reminder due tomorrow but completed today is not counted for midnight rollover',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: tomorrowDate() }, completedAt: now.getTime() }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 0 && p.done === 0 && p.dueTomorrow === 0, `Expected all 0, got ${JSON.stringify(p)}`);
      },
    },
    {
      id: 'widget-progress-repeating',
      name: 'Widget progress: completed daily repeat counts as done, next occurrence is tomorrow',
      run: () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        const repeatRule = { frequency: 'daily' as const, interval: 1, byDay: null };
        const reminders = [
          makeReminder({ id: 'r1', schedule: { kind: 'scheduled', date: todayDate(), time: '08:00' }, repeatRule, completedAt: now.getTime() }),
          makeReminder({ id: 'r2', schedule: { kind: 'scheduled', date: tomorrowDate(), time: '08:00' }, repeatRule }),
        ];
        const p = getTodayProgress(reminders, now);
        assert(p.outstanding === 0 && p.done === 1 && p.dueTomorrow === 1, `Expected 0/1/1, got ${JSON.stringify(p)}`);
      },
    },
  ];
}
