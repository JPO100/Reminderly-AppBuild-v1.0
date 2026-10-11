// Settings storage keys and development defaults.
// See docs/settings-flags-spec.md, section 8.
//
// Prefixes: reminderly-ff-* (admin flags), reminderly-pref-* (user preferences),
// reminderly-config-* (app behaviour set by us), reminderly-test-* (testing tools only).
// Values are stored as strings, matching the existing storage pattern.

export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const SETTINGS_SCHEMA_KEY = 'reminderly-settings-schema';
export const SETTINGS_SCHEMA_VERSION = 1;

export const HAPTICS_PREF_KEY = 'reminderly-pref-haptics';

// Development defaults, used when a key has never been saved (new installs).
// Existing installs keep their current behaviour through the migration (migration.ts).
// Before release, these are reviewed as the launch defaults.
export const SETTINGS_DEFAULTS: Record<string, string> = {
  // Reminders
  'reminderly-ff-reminders': 'true',
  'reminderly-ff-repeat-reminders': 'true',
  'reminderly-ff-one-minute-increments': 'true',
  'reminderly-pref-one-minute-increments': 'false',
  'reminderly-ff-calendar': 'false',
  'reminderly-pref-calendar': 'false',

  // Lists
  'reminderly-ff-lists': 'true',
  'reminderly-ff-smart-reminders': 'true',
  'reminderly-ff-saved-lists': 'true',
  'reminderly-ff-pinned-lists': 'true',
  'reminderly-config-templates-in-clean-state': 'false',

  // Notifications
  'reminderly-ff-notifications': 'true',
  'reminderly-pref-notif-alerts': 'false',
  'reminderly-pref-notif-badge': 'false',
  'reminderly-pref-notif-include-today': 'true',

  // Haptics: master off, individual actions on (missing actions merge to on in utils/haptics.ts)
  'reminderly-ff-haptics': 'true',
  [HAPTICS_PREF_KEY]: '{"allHaptics":false}',

  // Sounds
  'reminderly-ff-sounds': 'false',
  'reminderly-pref-sounds': 'false',

  // Siri
  'reminderly-ff-siri-reminders': 'false',
  'reminderly-ff-siri-lists': 'false',
  'reminderly-pref-siri-reminders': 'false',
  'reminderly-pref-siri-lists': 'false',

  // Natural language capture
  'reminderly-ff-nlc': 'false',
  'reminderly-pref-nlc': 'false',
  'reminderly-pref-nlc-mode': 'auto',
  'reminderly-pref-nlc-recognition': '{"date":true,"time":true,"repeats":true}',
  'reminderly-ff-nlc-phone': 'false',
  'reminderly-ff-nlc-contacts': 'false',

  // Onboarding
  'reminderly-ff-onboarding-tutorial': 'true',
  'reminderly-config-tutorial-first-launch': 'true',
  'reminderly-test-tutorial-every-start': 'false',

  // System
  'reminderly-ff-settings-menu-v2': 'false',
  'reminderly-ff-info-icons': 'false',
  'reminderly-ff-paywall': 'false',
};

// Transitional fallbacks (Phase 1.1): the current app defaults, used when a key has never been saved.
// They keep behaviour unchanged until each setting's integration phase (Phase 3, or Phase 4 for
// notifications), when the fallback becomes the development default in SETTINGS_DEFAULTS.
// Nothing is written at startup, so a missing key stays missing and that switch never overwrites
// a saved choice.
export const TRANSITIONAL_FALLBACKS: Record<string, boolean> = {
  // Migrated settings (authoritative new keys)
  'reminderly-ff-lists': true,
  'reminderly-pref-one-minute-increments': false,
  'reminderly-pref-notif-alerts': true,
  'reminderly-pref-notif-badge': true,
  'reminderly-pref-notif-include-today': true,
  'reminderly-config-tutorial-first-launch': true,
  'reminderly-test-tutorial-every-start': false,
  'reminderly-config-templates-in-clean-state': false,
  'reminderly-ff-siri-reminders': false,

  // Unchanged keys
  'reminderly-ff-onboarding-tutorial': true,
  'reminderly-ff-smart-reminders': false,
  'reminderly-ff-saved-lists': false,
  'reminderly-ff-pinned-lists': true,
  'reminderly-ff-settings-menu-v2': false,
  'reminderly-ff-info-icons': false,
  'reminderly-dev-tools-password-required': true,

  // Saved Dev tools flags, not yet read outside Dev tools
  'reminderly-ff-reminders': true,
  'reminderly-ff-notifications': true,
  'reminderly-ff-repeat-reminders': true,
};
