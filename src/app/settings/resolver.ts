// Read-only settings resolver. See docs/settings-flags-spec.md, section 4.
// A feature is active when its parent features, its admin flag, its user preferences
// and (for notifications) iOS permission are all on. Nothing here writes to storage.

import { HAPTICS_PREF_KEY, SETTINGS_DEFAULTS } from './keys';
import type { SettingsStorage } from './keys';

export type Feature =
  | 'reminders'
  | 'lists'
  | 'repeatReminders'
  | 'oneMinuteIncrements'
  | 'calendar'
  | 'smartReminders'
  | 'listTemplates'
  | 'pinnedLists'
  | 'notificationAlerts'
  | 'notificationBadge'
  | 'badgeIncludesToday'
  | 'haptics'
  | 'sounds'
  | 'siriReminders'
  | 'siriLists'
  | 'nlc'
  | 'nlcPhone'
  | 'nlcContacts'
  | 'onboarding'
  | 'settingsMenu'
  | 'infoIcons'
  | 'paywall';

interface FeatureDef {
  flag: string;
  parents?: Feature[];
  prefs?: string[];
  needsPermission?: boolean;
}

const FEATURES: Record<Feature, FeatureDef> = {
  reminders: { flag: 'reminderly-ff-reminders' },
  lists: { flag: 'reminderly-ff-lists' },
  repeatReminders: { flag: 'reminderly-ff-repeat-reminders', parents: ['reminders'] },
  oneMinuteIncrements: { flag: 'reminderly-ff-one-minute-increments', parents: ['reminders'], prefs: ['reminderly-pref-one-minute-increments'] },
  calendar: { flag: 'reminderly-ff-calendar', parents: ['reminders'], prefs: ['reminderly-pref-calendar'] },
  smartReminders: { flag: 'reminderly-ff-smart-reminders', parents: ['reminders', 'lists'] },
  listTemplates: { flag: 'reminderly-ff-saved-lists', parents: ['lists'] },
  pinnedLists: { flag: 'reminderly-ff-pinned-lists', parents: ['lists'] },
  notificationAlerts: { flag: 'reminderly-ff-notifications', parents: ['reminders'], prefs: ['reminderly-pref-notif-alerts'], needsPermission: true },
  notificationBadge: { flag: 'reminderly-ff-notifications', parents: ['reminders'], prefs: ['reminderly-pref-notif-badge'], needsPermission: true },
  badgeIncludesToday: { flag: 'reminderly-ff-notifications', parents: ['reminders'], prefs: ['reminderly-pref-notif-badge', 'reminderly-pref-notif-include-today'], needsPermission: true },
  haptics: { flag: 'reminderly-ff-haptics', prefs: [HAPTICS_PREF_KEY] },
  sounds: { flag: 'reminderly-ff-sounds', prefs: ['reminderly-pref-sounds'] },
  siriReminders: { flag: 'reminderly-ff-siri-reminders', parents: ['reminders'], prefs: ['reminderly-pref-siri-reminders'] },
  siriLists: { flag: 'reminderly-ff-siri-lists', parents: ['lists'], prefs: ['reminderly-pref-siri-lists'] },
  nlc: { flag: 'reminderly-ff-nlc', parents: ['reminders'], prefs: ['reminderly-pref-nlc'] },
  nlcPhone: { flag: 'reminderly-ff-nlc-phone', parents: ['nlc'] },
  nlcContacts: { flag: 'reminderly-ff-nlc-contacts', parents: ['nlc'] },
  onboarding: { flag: 'reminderly-ff-onboarding-tutorial' },
  settingsMenu: { flag: 'reminderly-ff-settings-menu-v2' },
  infoIcons: { flag: 'reminderly-ff-info-icons' },
  paywall: { flag: 'reminderly-ff-paywall' },
};

export const ALL_FEATURES = Object.keys(FEATURES) as Feature[];

/** Saved value, or the default when the key has never been saved. */
export function readSetting(key: string, storage: SettingsStorage = localStorage): string | null {
  try {
    return storage.getItem(key) ?? SETTINGS_DEFAULTS[key] ?? null;
  } catch {
    return SETTINGS_DEFAULTS[key] ?? null;
  }
}

export function readSettingBool(key: string, storage: SettingsStorage = localStorage): boolean {
  // The haptics preference is a JSON object; its master switch is allHaptics.
  if (key === HAPTICS_PREF_KEY) {
    try {
      return JSON.parse(readSetting(key, storage) ?? '{}').allHaptics === true;
    } catch {
      return false;
    }
  }
  return readSetting(key, storage) === 'true';
}

export function isFeatureActive(
  feature: Feature,
  options: { storage?: SettingsStorage; permissionGranted?: boolean } = {},
): boolean {
  const { storage = localStorage, permissionGranted = false } = options;
  const def = FEATURES[feature];
  if (def.parents?.some((parent) => !isFeatureActive(parent, { storage, permissionGranted: true }))) return false;
  if (!readSettingBool(def.flag, storage)) return false;
  if (def.prefs?.some((pref) => !readSettingBool(pref, storage))) return false;
  if (def.needsPermission && !permissionGranted) return false;
  return true;
}
