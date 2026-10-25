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
export const SOUNDS_PREF_KEY = 'reminderly-pref-sounds';

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
  'reminderly-test-calendar-swipe-hint-every-visit': 'false',
  'reminderly-ff-reminder-attachments': 'false',
  'reminderly-ff-date-presets': 'false',
  'reminderly-pref-date-presets': 'true',

  // Lists
  'reminderly-ff-lists': 'true',
  'reminderly-ff-smart-reminders': 'true',
  'reminderly-ff-saved-lists': 'true',
  'reminderly-ff-pinned-lists': 'true',
  'reminderly-pref-list-sort-az': 'false',
  'reminderly-pref-list-oldest-first': 'false',
  'reminderly-pref-list-hide-ticked': 'false',
  'reminderly-pref-list-auto-clear': 'false',
  'reminderly-config-templates-in-clean-state': 'false',

  // Notifications
  'reminderly-ff-notifications': 'true',
  'reminderly-pref-notif-alerts': 'false',
  'reminderly-pref-notif-badge': 'false',
  'reminderly-pref-notif-include-today': 'true',
  'reminderly-pref-notif-sound': 'false',

  // Haptics: master off, individual actions on (missing actions merge to on in utils/haptics.ts)
  'reminderly-ff-haptics': 'true',
  [HAPTICS_PREF_KEY]: '{"allHaptics":false}',

  // Sounds: both panels off, individual actions on (missing actions merge to on in utils/sounds.ts)
  'reminderly-ff-sounds': 'false',
  [SOUNDS_PREF_KEY]: '{"remindersSounds":false,"listsSounds":false}',

  // Siri
  'reminderly-ff-siri-reminders': 'false',
  'reminderly-ff-siri-lists': 'false',
  'reminderly-pref-siri-reminders': 'false',
  'reminderly-pref-siri-lists': 'false',

  // Natural language capture
  'reminderly-ff-nlc': 'false',
  'reminderly-pref-nlc': 'false',
  'reminderly-pref-nlc-auto-parsing': 'true',
  'reminderly-pref-nlc-date': 'true',
  'reminderly-pref-nlc-time': 'true',
  'reminderly-pref-nlc-repeats': 'true',
  'reminderly-ff-nlc-phone': 'false',
  'reminderly-ff-nlc-contacts': 'false',

  // Onboarding
  'reminderly-ff-onboarding-tutorial': 'true',
  'reminderly-config-tutorial-first-launch': 'true',
  'reminderly-test-tutorial-every-start': 'false',

  // System
  'reminderly-ff-settings-menu-v2': 'true',
  'reminderly-ff-info-icons': 'false',
  'reminderly-ff-paywall': 'false',
  'reminderly-ff-lock-screen-widget': 'true',
};

// Transitional fallbacks: previous app defaults for keys outside SETTINGS_DEFAULTS. Every other setting
// falls back to its development default in SETTINGS_DEFAULTS (notifications since Phase 4). Nothing is
// written at startup, so a missing key stays missing and a saved choice is never overwritten.
export const TRANSITIONAL_FALLBACKS: Record<string, boolean> = {
  'reminderly-dev-tools-password-required': true,
};
