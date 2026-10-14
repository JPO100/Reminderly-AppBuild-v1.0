import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SETTINGS_DEFAULTS } from '../settings/keys';
import { readStoredBool } from '../settings/useStoredSetting';
import { playClick } from './sounds';

export type HapticAction =
  | 'markDone'
  | 'createReminder'
  | 'createList'
  | 'markListComplete'
  | 'deleteReminder'
  | 'deleteListItem'
  | 'clearAllDoneDeleted'
  | 'uncompleteReminder'
  | 'undeleteReminder'
  | 'undoListCompletion'
  | 'toggleListItemCheckbox'
  | 'swipeRevealDelete';

export type HapticPanel = 'reminders' | 'lists';

// allHaptics is the original single master. Each settings panel now has its own master
// (remindersHaptics, listsHaptics); when missing they start from allHaptics.
export type HapticsConfig = {
  allHaptics: boolean;
  remindersHaptics: boolean;
  listsHaptics: boolean;
} & Record<HapticAction, boolean>;

// Authoritative key since the settings migration (migrated from reminderly-haptics-config)
const STORAGE_KEY = 'reminderly-pref-haptics';
const FLAG_KEY = 'reminderly-ff-haptics';

const DEFAULT_CONFIG: HapticsConfig = {
  allHaptics: true,
  remindersHaptics: true,
  listsHaptics: true,
  markDone: true,
  createReminder: true,
  createList: true,
  markListComplete: true,
  deleteReminder: true,
  deleteListItem: true,
  clearAllDoneDeleted: true,
  uncompleteReminder: true,
  undeleteReminder: true,
  undoListCompletion: true,
  toggleListItemCheckbox: true,
  swipeRevealDelete: true,
};

/**
 * Fills in anything missing from a saved haptics value. Saved choices always win. Panel masters
 * that were never saved start from the original single master (allHaptics), so existing choices carry over.
 */
export function normaliseHapticsConfig(parsed: Partial<HapticsConfig>): HapticsConfig {
  const master = parsed.allHaptics ?? DEFAULT_CONFIG.allHaptics;
  return { ...DEFAULT_CONFIG, remindersHaptics: master, listsHaptics: master, ...parsed };
}

let config: HapticsConfig = loadConfig();

function loadConfig(): HapticsConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Never saved: development default (master off, actions on)
    return normaliseHapticsConfig(JSON.parse(stored ?? SETTINGS_DEFAULTS[STORAGE_KEY]));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Fail silently
  }
}

export function getHapticsConfig(): HapticsConfig {
  return { ...config };
}

export function setHapticsConfig(next: HapticsConfig) {
  config = { ...next };
  saveConfig();
}

/** Single tap feedback gated by action config */
export const hapticTap = (action: HapticAction) => {
  // Click sounds play on the same actions, with their own settings (utils/sounds)
  playClick(action);
  if (!readStoredBool(FLAG_KEY)) return;
  if (!config[panelMasterKey(panelForAction(action))]) return;
  if (!config[action]) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

/**
 * Haptic switches shown on each settings panel's Haptic feedback page. Each names one user action;
 * related actions follow it (restoring follows completing or deleting, swipe follows deleting).
 */
export const HAPTIC_GROUPS: Record<HapticPanel, { label: string; info: string; actions: HapticAction[] }[]> = {
  reminders: [
    { label: 'Creating a reminder', info: 'A small vibration when you tap New reminder or create a reminder.', actions: ['createReminder'] },
    { label: 'Completing a reminder', info: 'A small vibration when you mark a reminder as done, or restore a done reminder.', actions: ['markDone', 'uncompleteReminder'] },
    { label: 'Deleting a reminder', info: 'A small vibration when you delete or restore a reminder, or clear done and deleted reminders.', actions: ['deleteReminder', 'undeleteReminder', 'clearAllDoneDeleted'] },
  ],
  lists: [
    { label: 'Creating a list', info: 'A small vibration when you tap New list.', actions: ['createList'] },
    { label: 'Ticking off a list item', info: 'A small vibration when you tick or untick a list item.', actions: ['toggleListItemCheckbox'] },
    { label: 'Completing a list', info: 'A small vibration when you mark a list as done, or restore it.', actions: ['markListComplete', 'undoListCompletion'] },
    { label: 'Deleting a list item', info: 'A small vibration when you delete a list item, or swipe to reveal delete.', actions: ['deleteListItem', 'swipeRevealDelete'] },
  ],
};

export function panelMasterKey(panel: HapticPanel): 'remindersHaptics' | 'listsHaptics' {
  return panel === 'reminders' ? 'remindersHaptics' : 'listsHaptics';
}

export function panelForAction(action: HapticAction): HapticPanel {
  return HAPTIC_GROUPS.reminders.some((group) => group.actions.includes(action)) ? 'reminders' : 'lists';
}
