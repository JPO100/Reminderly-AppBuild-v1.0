// One-time settings storage migration. See docs/settings-flags-spec.md, section 8.
// Copies current keys to the new keys. Never overwrites a new key, never changes or
// deletes an old key, and never touches reminder or list data. Safe to run repeatedly.

import { HAPTICS_PREF_KEY, SETTINGS_SCHEMA_KEY, SETTINGS_SCHEMA_VERSION } from './keys';
import type { SettingsStorage } from './keys';

// [current key, new key]. Saved values are copied as-is, including 'false'.
const COPIES: [string, string][] = [
  ['dev.listsEnabled', 'reminderly-ff-lists'],
  ['reminderly-dev-one-minute-time-increments', 'reminderly-pref-one-minute-increments'],
  ['reminderly-notif-reminder-alerts', 'reminderly-pref-notif-alerts'],
  ['reminderly-notif-app-badge', 'reminderly-pref-notif-badge'],
  ['reminderly-notif-include-today-in-badge', 'reminderly-pref-notif-include-today'],
  ['reminderly-haptics-config', HAPTICS_PREF_KEY],
  ['reminderly-ff-tutorial-first-launch', 'reminderly-config-tutorial-first-launch'],
  ['reminderly-ff-tutorial-every-start', 'reminderly-test-tutorial-every-start'],
  ['reminderly-dev-default-templates-in-clean-state', 'reminderly-config-templates-in-clean-state'],
  // Siri: the lists flag is not copied, it stays off until a Lists Siri action exists (D7)
  ['reminderly-ff-siri-shortcuts', 'reminderly-ff-siri-reminders'],
  ['reminderly-ff-siri-shortcuts', 'reminderly-pref-siri-reminders'],
  ['reminderly-ff-siri-shortcuts', 'reminderly-pref-siri-lists'],
];

// Existing installs keep current behaviour where it differs from the new-install default
// and nothing was saved (the current code treats these missing values as on).
const EXISTING_INSTALL_VALUES: Record<string, string> = {
  'reminderly-pref-notif-alerts': 'true',
  'reminderly-pref-notif-badge': 'true',
  [HAPTICS_PREF_KEY]: '{"allHaptics":true}',
};

// The current app saves these on its first launch, even with no reminders or lists.
const EXISTING_INSTALL_KEYS = ['reminderly.reminders.v1', 'reminderly-created-lists', 'reminderly-active-main-tab'];

/** Runs the migration if it has not run yet. Returns true when it ran. */
export function migrateSettings(storage: SettingsStorage = localStorage): boolean {
  if (Number(storage.getItem(SETTINGS_SCHEMA_KEY)) >= SETTINGS_SCHEMA_VERSION) return false;

  const isExistingInstall = EXISTING_INSTALL_KEYS.some((key) => storage.getItem(key) !== null);
  const setIfAbsent = (key: string, value: string) => {
    if (storage.getItem(key) === null) storage.setItem(key, value);
  };

  for (const [oldKey, newKey] of COPIES) {
    const value = storage.getItem(oldKey);
    if (value !== null) setIfAbsent(newKey, value);
  }
  if (isExistingInstall) {
    for (const [key, value] of Object.entries(EXISTING_INSTALL_VALUES)) setIfAbsent(key, value);
  }

  storage.setItem(SETTINGS_SCHEMA_KEY, String(SETTINGS_SCHEMA_VERSION));
  return true;
}
