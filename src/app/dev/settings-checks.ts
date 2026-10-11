/**
 * Settings Foundation Checks
 *
 * Checks for the settings storage migration and the read-only resolver
 * (docs/settings-flags-spec.md, Phase 1). Uses in-memory storage only,
 * so running them never touches the app's real settings.
 *
 * STATELESS: Returns fresh check array on each call - no side effects.
 */

import type { Check } from './check-system';
import { migrateSettings } from '../settings/migration';
import { ALL_FEATURES, canChangeModuleFlag, isFeatureActive, readSetting } from '../settings/resolver';
import { SETTINGS_DEFAULTS, SETTINGS_SCHEMA_KEY, TRANSITIONAL_FALLBACKS } from '../settings/keys';
import { defaultFor, readStoredBool, setSettingsWriteFailureListener, writeStoredBool } from '../settings/useStoredSetting';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  let writes = 0;
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      writes += 1;
      map.set(key, String(value));
    },
    snapshot: () => Object.fromEntries(map),
    writes: () => writes,
  };
}

const EXISTING = { 'reminderly.reminders.v1': '[]' };

// Legacy keys replaced by authoritative keys in Phase 1.1, with the app default each one had.
const LEGACY_TO_AUTHORITATIVE: [string, string, boolean][] = [
  ['dev.listsEnabled', 'reminderly-ff-lists', true],
  ['reminderly-dev-one-minute-time-increments', 'reminderly-pref-one-minute-increments', false],
  ['reminderly-notif-reminder-alerts', 'reminderly-pref-notif-alerts', true],
  ['reminderly-notif-app-badge', 'reminderly-pref-notif-badge', true],
  ['reminderly-notif-include-today-in-badge', 'reminderly-pref-notif-include-today', true],
  ['reminderly-ff-tutorial-first-launch', 'reminderly-config-tutorial-first-launch', true],
  ['reminderly-ff-tutorial-every-start', 'reminderly-test-tutorial-every-start', false],
  ['reminderly-dev-default-templates-in-clean-state', 'reminderly-config-templates-in-clean-state', false],
  ['reminderly-ff-siri-shortcuts', 'reminderly-ff-siri-reminders', false],
];

// A representative existing install with every current settings key saved.
const ALL_OLD_KEYS: Record<string, string> = {
  'reminderly.reminders.v1': '[{"id":"r1"}]',
  'reminderly-created-lists': '[{"id":"l1"}]',
  'reminderly-active-main-tab': 'lists',
  'dev.listsEnabled': 'true',
  'reminderly-dev-one-minute-time-increments': 'true',
  'reminderly-notif-reminder-alerts': 'true',
  'reminderly-notif-app-badge': 'true',
  'reminderly-notif-include-today-in-badge': 'false',
  'reminderly-haptics-config': '{"allHaptics":true,"markDone":false}',
  'reminderly-ff-tutorial-first-launch': 'false',
  'reminderly-ff-tutorial-every-start': 'true',
  'reminderly-dev-default-templates-in-clean-state': 'true',
  'reminderly-ff-siri-shortcuts': 'true',
  'reminderly-ff-smart-reminders': 'true',
  'reminderly-ff-saved-lists': 'true',
  'reminderly-tutorial-reminders-shown': 'true',
};

export function getSettingsChecks(): Check[] {
  return [
    // Migration
    {
      id: 'settings-migration-new-install',
      name: 'Migration: new install writes only the schema marker and gets development defaults',
      run: () => {
        const storage = memoryStorage();
        assert(migrateSettings(storage) === true, 'Migration should run');
        assert(JSON.stringify(Object.keys(storage.snapshot())) === JSON.stringify([SETTINGS_SCHEMA_KEY]), 'Only the schema key should be written');
        assert(!isFeatureActive('notificationAlerts', { storage, permissionGranted: true }), 'Alerts should default off');
        assert(!isFeatureActive('notificationBadge', { storage, permissionGranted: true }), 'Badge should default off');
        assert(!isFeatureActive('haptics', { storage }), 'Haptics should default off');
        assert(!isFeatureActive('oneMinuteIncrements', { storage }), '1 minute increments should default off');
        assert(!isFeatureActive('nlc', { storage }), 'NLC should default off');
        assert(!isFeatureActive('siriReminders', { storage }), 'Siri should default off');
        assert(isFeatureActive('smartReminders', { storage }), 'Smart reminders should default on');
        assert(isFeatureActive('listTemplates', { storage }), 'List templates should default on');
        assert(readSetting('reminderly-pref-nlc-mode', storage) === 'auto', 'NLC mode should default to auto');
      },
    },
    {
      id: 'settings-migration-existing-empty',
      name: 'Migration: existing install with nothing saved keeps notifications and haptics on',
      run: () => {
        const storage = memoryStorage(EXISTING);
        migrateSettings(storage);
        assert(isFeatureActive('notificationAlerts', { storage, permissionGranted: true }), 'Alerts should stay on');
        assert(isFeatureActive('notificationBadge', { storage, permissionGranted: true }), 'Badge should stay on');
        assert(isFeatureActive('badgeIncludesToday', { storage, permissionGranted: true }), 'Include today should stay on');
        assert(isFeatureActive('haptics', { storage }), 'Haptics should stay on');
      },
    },
    {
      id: 'settings-migration-detection',
      name: 'Migration: each existing-install key on its own marks an existing install',
      run: () => {
        for (const key of ['reminderly.reminders.v1', 'reminderly-created-lists', 'reminderly-active-main-tab']) {
          const storage = memoryStorage({ [key]: key === 'reminderly-active-main-tab' ? 'reminders' : '[]' });
          migrateSettings(storage);
          assert(storage.getItem('reminderly-pref-notif-alerts') === 'true', `${key} should mark an existing install`);
        }
      },
    },
    {
      id: 'settings-migration-copies',
      name: 'Migration: every saved current key is copied to its new key',
      run: () => {
        const storage = memoryStorage(ALL_OLD_KEYS);
        migrateSettings(storage);
        const expected: Record<string, string> = {
          'reminderly-ff-lists': 'true',
          'reminderly-pref-one-minute-increments': 'true',
          'reminderly-pref-notif-alerts': 'true',
          'reminderly-pref-notif-badge': 'true',
          'reminderly-pref-notif-include-today': 'false',
          'reminderly-pref-haptics': '{"allHaptics":true,"markDone":false}',
          'reminderly-config-tutorial-first-launch': 'false',
          'reminderly-test-tutorial-every-start': 'true',
          'reminderly-config-templates-in-clean-state': 'true',
          'reminderly-ff-siri-reminders': 'true',
          'reminderly-pref-siri-reminders': 'true',
          'reminderly-pref-siri-lists': 'true',
        };
        for (const [key, value] of Object.entries(expected)) {
          assert(storage.getItem(key) === value, `${key} should be ${value}, got ${storage.getItem(key)}`);
        }
      },
    },
    {
      id: 'settings-migration-explicit-off',
      name: 'Migration: explicitly saved off values stay off (alerts, badge, include today, smart reminders, templates)',
      run: () => {
        const storage = memoryStorage({
          ...EXISTING,
          'reminderly-notif-reminder-alerts': 'false',
          'reminderly-notif-app-badge': 'false',
          'reminderly-notif-include-today-in-badge': 'false',
          'reminderly-ff-smart-reminders': 'false',
          'reminderly-ff-saved-lists': 'false',
          'reminderly-haptics-config': '{"allHaptics":false}',
        });
        migrateSettings(storage);
        assert(storage.getItem('reminderly-pref-notif-alerts') === 'false', 'Alerts off should be honoured (D4)');
        assert(storage.getItem('reminderly-pref-notif-badge') === 'false', 'Badge off should be honoured');
        assert(storage.getItem('reminderly-pref-notif-include-today') === 'false', 'Include today off should be honoured');
        assert(!isFeatureActive('notificationAlerts', { storage, permissionGranted: true }), 'Alerts should be inactive');
        assert(!isFeatureActive('notificationBadge', { storage, permissionGranted: true }), 'Badge should be inactive');
        assert(!isFeatureActive('smartReminders', { storage }), 'Smart reminders off should be honoured');
        assert(!isFeatureActive('listTemplates', { storage }), 'List templates off should be honoured');
        assert(!isFeatureActive('haptics', { storage }), 'Haptics off should be honoured');
      },
    },
    {
      id: 'settings-migration-repeat-run',
      name: 'Migration: a second run changes nothing',
      run: () => {
        const storage = memoryStorage(ALL_OLD_KEYS);
        migrateSettings(storage);
        const first = JSON.stringify(storage.snapshot());
        const writes = storage.writes();
        assert(migrateSettings(storage) === false, 'Second run should be skipped');
        assert(storage.writes() === writes, 'Second run should not write');
        assert(JSON.stringify(storage.snapshot()) === first, 'Storage should be unchanged');
      },
    },
    {
      id: 'settings-migration-no-overwrite',
      name: 'Migration: never overwrites a new key that already has a value',
      run: () => {
        const storage = memoryStorage({ ...EXISTING, 'reminderly-notif-reminder-alerts': 'true', 'reminderly-pref-notif-alerts': 'false' });
        migrateSettings(storage);
        assert(storage.getItem('reminderly-pref-notif-alerts') === 'false', 'Existing new key should be kept');
      },
    },
    {
      id: 'settings-migration-old-keys-and-data-untouched',
      name: 'Migration: current keys, reminders, lists and tutorial state are unchanged',
      run: () => {
        const storage = memoryStorage(ALL_OLD_KEYS);
        migrateSettings(storage);
        for (const [key, value] of Object.entries(ALL_OLD_KEYS)) {
          assert(storage.getItem(key) === value, `${key} should be unchanged`);
        }
        const newKeys = Object.keys(storage.snapshot()).filter((key) => !(key in ALL_OLD_KEYS));
        const allowed = /^reminderly-(ff|pref|config|test)-|^reminderly-settings-schema$/;
        assert(newKeys.every((key) => allowed.test(key)), `Unexpected keys written: ${newKeys.join(', ')}`);
      },
    },
    {
      id: 'settings-migration-siri',
      name: 'Migration: Siri on moves to Siri reminders. Siri lists stays off with its preference kept',
      run: () => {
        const storage = memoryStorage({ ...EXISTING, 'reminderly-ff-siri-shortcuts': 'true' });
        migrateSettings(storage);
        assert(isFeatureActive('siriReminders', { storage }), 'Siri reminders should be on');
        assert(!isFeatureActive('siriLists', { storage }), 'Siri lists should be off (D7)');
        assert(storage.getItem('reminderly-ff-siri-lists') === null, 'Siri lists flag should not be written');
        assert(storage.getItem('reminderly-pref-siri-lists') === 'true', 'Siri lists preference should be kept');
      },
    },
    {
      id: 'settings-migration-bad-schema',
      name: 'Migration: an unreadable schema value runs the migration safely',
      run: () => {
        const storage = memoryStorage({ ...EXISTING, [SETTINGS_SCHEMA_KEY]: 'abc', 'reminderly-pref-notif-alerts': 'false' });
        assert(migrateSettings(storage) === true, 'Migration should run');
        assert(storage.getItem('reminderly-pref-notif-alerts') === 'false', 'Existing new key should be kept');
        assert(storage.getItem(SETTINGS_SCHEMA_KEY) === '1', 'Schema should be set');
      },
    },

    // Stored settings (Phase 1.1)
    {
      id: 'settings-stored-precedence',
      name: 'Stored settings: a saved value wins over the fallback, a missing value uses it',
      run: () => {
        const storage = memoryStorage({ 'reminderly-pref-notif-alerts': 'false', 'reminderly-ff-smart-reminders': 'true' });
        assert(readStoredBool('reminderly-pref-notif-alerts', undefined, storage) === false, 'Saved false should win over fallback true');
        assert(readStoredBool('reminderly-ff-smart-reminders', undefined, storage) === true, 'Saved true should win over fallback false');
        assert(readStoredBool('reminderly-pref-notif-badge', undefined, storage) === true, 'Missing badge should use fallback true');
        assert(readStoredBool('reminderly-ff-saved-lists', undefined, storage) === true, 'Missing templates should use the development default (on)');
      },
    },
    {
      id: 'settings-stored-explicit-false',
      name: 'Stored settings: explicit false stays distinct from missing',
      run: () => {
        const missing = memoryStorage();
        const off = memoryStorage({ 'reminderly-ff-pinned-lists': 'false' });
        assert(readStoredBool('reminderly-ff-pinned-lists', undefined, missing) === true, 'Missing should use fallback true');
        assert(readStoredBool('reminderly-ff-pinned-lists', undefined, off) === false, 'Explicit false should stay false');
        assert(missing.getItem('reminderly-ff-pinned-lists') === null, 'Missing should stay missing');
      },
    },
    {
      id: 'settings-stored-malformed',
      name: 'Stored settings: a malformed value uses the fallback and is not overwritten by reading',
      run: () => {
        const storage = memoryStorage({ 'reminderly-ff-lists': 'yes' });
        assert(readStoredBool('reminderly-ff-lists', undefined, storage) === true, 'Malformed should use fallback');
        assert(storage.getItem('reminderly-ff-lists') === 'yes', 'Malformed value should be left as it is');
      },
    },
    {
      id: 'settings-stored-read-no-write',
      name: 'Stored settings: reading every setting never writes',
      run: () => {
        const storage = memoryStorage(ALL_OLD_KEYS);
        for (const key of [...Object.keys(TRANSITIONAL_FALLBACKS), ...Object.keys(SETTINGS_DEFAULTS)]) readStoredBool(key, undefined, storage);
        assert(storage.writes() === 0, 'Reading should not write');
      },
    },
    {
      id: 'settings-stored-write-authoritative-only',
      name: 'Stored settings: a change writes only the authoritative key, legacy keys unchanged',
      run: () => {
        const storage = memoryStorage(ALL_OLD_KEYS);
        migrateSettings(storage);
        const before = storage.snapshot();
        writeStoredBool('reminderly-pref-one-minute-increments', false, storage);
        writeStoredBool('reminderly-ff-siri-reminders', false, storage);
        const after = storage.snapshot();
        const changed = Object.keys(after).filter((key) => after[key] !== before[key]);
        assert(JSON.stringify(changed.sort()) === JSON.stringify(['reminderly-ff-siri-reminders', 'reminderly-pref-one-minute-increments']), `Unexpected changes: ${changed.join(', ')}`);
        for (const [legacy] of LEGACY_TO_AUTHORITATIVE) {
          assert(after[legacy] === ALL_OLD_KEYS[legacy], `${legacy} should be unchanged`);
        }
      },
    },
    {
      id: 'settings-stored-mapping',
      name: 'Stored settings: every migrated setting reads its authoritative key with its default',
      run: () => {
        for (const [legacy, key, appDefault] of LEGACY_TO_AUTHORITATIVE) {
          assert(defaultFor(key) === appDefault, `${key} default should be ${appDefault}`);
          assert(!(legacy in TRANSITIONAL_FALLBACKS) && !(legacy in SETTINGS_DEFAULTS), `${legacy} should not be read any more`);
          const storage = memoryStorage({ [legacy]: String(!appDefault) });
          assert(readStoredBool(key, undefined, storage) === appDefault, `${key} should ignore the legacy key`);
        }
      },
    },
    {
      id: 'settings-stored-phase1-upgrade',
      name: 'Stored settings: an install already migrated in Phase 1 keeps its new values',
      run: () => {
        // Phase 1 build: migrated, then the app kept writing the legacy keys
        const storage = memoryStorage({
          ...EXISTING,
          [SETTINGS_SCHEMA_KEY]: '1',
          'reminderly-pref-notif-badge': 'false',
          'reminderly-notif-app-badge': 'true',
          'reminderly-ff-lists': 'true',
          'dev.listsEnabled': 'false',
        });
        assert(migrateSettings(storage) === false, 'Migration should not run again');
        assert(readStoredBool('reminderly-pref-notif-badge', undefined, storage) === false, 'New badge value should be kept');
        assert(readStoredBool('reminderly-ff-lists', undefined, storage) === true, 'New lists value should be kept');
      },
    },
    {
      id: 'settings-stored-new-install',
      name: 'Stored settings: a new install has no preference keys until something is changed',
      run: () => {
        const storage = memoryStorage();
        migrateSettings(storage);
        for (const key of [...Object.keys(TRANSITIONAL_FALLBACKS), ...Object.keys(SETTINGS_DEFAULTS)]) readStoredBool(key, undefined, storage);
        const prefKeys = Object.keys(storage.snapshot()).filter((key) => key.startsWith('reminderly-pref-'));
        assert(prefKeys.length === 0, `Unexpected preference keys: ${prefKeys.join(', ')}`);
      },
    },

    {
      id: 'settings-stored-write-failure',
      name: 'Stored settings: a failed write is reported, a successful write reports nothing (cannot clear other errors)',
      run: () => {
        let failures = 0;
        const previous = setSettingsWriteFailureListener(() => { failures += 1; });
        try {
          const failing = { getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } };
          assert(writeStoredBool('reminderly-pref-notif-badge', false, failing) === false, 'Failed write should return false');
          const working = memoryStorage();
          assert(writeStoredBool('reminderly-pref-notif-badge', false, working) === true, 'Successful write should return true');
          assert(working.getItem('reminderly-pref-notif-badge') === 'false', 'Value should be saved');
        } finally {
          setSettingsWriteFailureListener(previous);
        }
        assert(failures === 1, `Expected 1 failure report, got ${failures}`);
      },
    },

    // Dev tools (Phase 2)
    {
      id: 'settings-last-module',
      name: 'Dev tools: the last enabled of Reminders and Lists cannot be turned off',
      run: () => {
        assert(!canChangeModuleFlag(false, false), 'Turning off Reminders with Lists off should be rejected');
        assert(canChangeModuleFlag(false, true), 'Turning off Reminders with Lists on should be allowed');
        assert(canChangeModuleFlag(true, false), 'Turning a module on should always be allowed');
      },
    },

    // Resolver
    {
      id: 'settings-resolver-read-only',
      name: 'Resolver: never writes to storage',
      run: () => {
        const storage = memoryStorage(ALL_OLD_KEYS);
        for (const feature of ALL_FEATURES) {
          isFeatureActive(feature, { storage, permissionGranted: true });
          isFeatureActive(feature, { storage, permissionGranted: false });
        }
        assert(storage.writes() === 0, 'Resolver should not write');
      },
    },
    {
      id: 'settings-resolver-lists-parent',
      name: 'Resolver: Lists off hides lists features. Turning it back on restores them unchanged',
      run: () => {
        const storage = memoryStorage({ 'reminderly-ff-lists': 'false', 'reminderly-ff-smart-reminders': 'true', 'reminderly-ff-siri-lists': 'true', 'reminderly-pref-siri-lists': 'true' });
        for (const feature of ['lists', 'smartReminders', 'listTemplates', 'pinnedLists', 'siriLists'] as const) {
          assert(!isFeatureActive(feature, { storage }), `${feature} should be inactive with Lists off`);
        }
        assert(isFeatureActive('repeatReminders', { storage }), 'Reminders features should be unaffected');
        storage.setItem('reminderly-ff-lists', 'true');
        assert(isFeatureActive('smartReminders', { storage }), 'Smart reminders should return (F8)');
        assert(isFeatureActive('siriLists', { storage }), 'Siri lists should return');
      },
    },
    {
      id: 'settings-resolver-reminders-parent',
      name: 'Resolver: Reminders off hides reminders features, including smart reminders and notifications',
      run: () => {
        const storage = memoryStorage({
          'reminderly-ff-reminders': 'false',
          'reminderly-pref-notif-alerts': 'true',
          'reminderly-pref-notif-badge': 'true',
          'reminderly-pref-one-minute-increments': 'true',
          'reminderly-ff-nlc': 'true',
          'reminderly-pref-nlc': 'true',
        });
        for (const feature of ['reminders', 'repeatReminders', 'oneMinuteIncrements', 'smartReminders', 'notificationAlerts', 'notificationBadge', 'nlc', 'siriReminders'] as const) {
          assert(!isFeatureActive(feature, { storage, permissionGranted: true }), `${feature} should be inactive with Reminders off`);
        }
        assert(isFeatureActive('pinnedLists', { storage }), 'Lists features should be unaffected');
        storage.setItem('reminderly-ff-reminders', 'true');
        assert(isFeatureActive('notificationAlerts', { storage, permissionGranted: true }), 'Alerts should return');
        assert(isFeatureActive('oneMinuteIncrements', { storage }), '1 minute increments should return');
        assert(isFeatureActive('nlc', { storage }), 'NLC should return');
      },
    },
    {
      id: 'settings-resolver-flag-keeps-pref',
      name: 'Resolver: a flag off hides the feature without changing the preference',
      run: () => {
        const storage = memoryStorage({ 'reminderly-ff-one-minute-increments': 'false', 'reminderly-pref-one-minute-increments': 'true' });
        assert(!isFeatureActive('oneMinuteIncrements', { storage }), 'Should be inactive with flag off');
        storage.setItem('reminderly-ff-one-minute-increments', 'true');
        assert(isFeatureActive('oneMinuteIncrements', { storage }), 'Preference should apply again');
      },
    },
    {
      id: 'settings-resolver-notifications',
      name: 'Resolver: alerts and badge resolve independently and need iOS permission',
      run: () => {
        const alertsOnly = memoryStorage({ 'reminderly-pref-notif-alerts': 'true', 'reminderly-pref-notif-badge': 'false' });
        assert(isFeatureActive('notificationAlerts', { storage: alertsOnly, permissionGranted: true }), 'Alerts should be active');
        assert(!isFeatureActive('notificationBadge', { storage: alertsOnly, permissionGranted: true }), 'Badge should be inactive');
        assert(!isFeatureActive('badgeIncludesToday', { storage: alertsOnly, permissionGranted: true }), 'Include today needs the badge');

        const badgeOnly = memoryStorage({ 'reminderly-pref-notif-alerts': 'false', 'reminderly-pref-notif-badge': 'true' });
        assert(!isFeatureActive('notificationAlerts', { storage: badgeOnly, permissionGranted: true }), 'Alerts should be inactive');
        assert(isFeatureActive('notificationBadge', { storage: badgeOnly, permissionGranted: true }), 'Badge should be active');

        const both = memoryStorage({ 'reminderly-pref-notif-alerts': 'true', 'reminderly-pref-notif-badge': 'true' });
        assert(!isFeatureActive('notificationAlerts', { storage: both }), 'No permission: alerts inactive');
        assert(!isFeatureActive('notificationBadge', { storage: both }), 'No permission: badge inactive');
        assert(both.getItem('reminderly-pref-notif-alerts') === 'true', 'Permission should not change the preference');

        both.setItem('reminderly-ff-notifications', 'false');
        assert(!isFeatureActive('notificationAlerts', { storage: both, permissionGranted: true }), 'Flag off: alerts inactive');
        assert(!isFeatureActive('notificationBadge', { storage: both, permissionGranted: true }), 'Flag off: badge inactive');
      },
    },
    {
      id: 'settings-resolver-values',
      name: 'Resolver: unrecognised values read as off, haptics reads its master switch',
      run: () => {
        const storage = memoryStorage({
          'reminderly-ff-paywall': 'yes',
          'reminderly-pref-haptics': 'not json',
        });
        assert(!isFeatureActive('paywall', { storage }), 'Unrecognised value should be off');
        assert(!isFeatureActive('haptics', { storage }), 'Unreadable haptics should be off');
        storage.setItem('reminderly-pref-haptics', '{"allHaptics":true}');
        assert(isFeatureActive('haptics', { storage }), 'Haptics master on should be active');
      },
    },
    {
      id: 'settings-resolver-test-keys-isolated',
      name: 'Resolver: testing-only keys never change any feature',
      run: () => {
        const storage = memoryStorage(ALL_OLD_KEYS);
        migrateSettings(storage);
        const before = ALL_FEATURES.map((feature) => isFeatureActive(feature, { storage, permissionGranted: true }));
        storage.setItem('reminderly-test-tutorial-every-start', storage.getItem('reminderly-test-tutorial-every-start') === 'true' ? 'false' : 'true');
        const after = ALL_FEATURES.map((feature) => isFeatureActive(feature, { storage, permissionGranted: true }));
        assert(JSON.stringify(before) === JSON.stringify(after), 'Test keys should not affect features');
      },
    },
  ];
}
