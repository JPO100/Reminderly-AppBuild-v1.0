// In-app notification ask (docs/plans/notifications-phase-4.md, section 6). Pure rules plus the stored
// ask state. The ask state records the in-app ask only; iOS permission is always read from iOS.
//
// Stored values: missing (never asked), 'not-now-1', 'not-now-2', 'accepted'. Any other value suppresses
// automatic asks and is replaced only when the user taps Allow.

import type { SettingsStorage } from './settings/keys';

export const NOTIF_ASK_STATE_KEY = 'reminderly-notif-ask-state';
export const ASK_STATE_ACCEPTED = 'accepted';

export type AskTrigger = 'tutorial' | 'timed-reminder';
export type AskSource = 'automatic' | 'settings';

/** iOS has not decided yet, so the iOS prompt can still be shown. */
export function isPermissionUndecided(permission: string | null | undefined): boolean {
  return permission === 'prompt' || permission === 'prompt-with-rationale';
}

/** Automatic ask: never asked (tutorial end or first timed reminder), or declined once (next timed reminder). */
export function shouldAskAutomatically(state: string | null, trigger: AskTrigger, permission: string | null | undefined): boolean {
  if (!isPermissionUndecided(permission)) return false;
  if (state === null) return true;
  if (state === 'not-now-1') return trigger === 'timed-reminder';
  return false;
}

/** Not now from an automatic ask moves on one step. Not now from settings changes nothing (the user started it). */
export function askStateAfterNotNow(state: string | null, source: AskSource): string | null {
  if (source === 'settings') return state;
  if (state === null) return 'not-now-1';
  if (state === 'not-now-1') return 'not-now-2';
  return state;
}

/**
 * Tutorial closed (docs/plans/onboarding-gaps.md, section 4): closing on the Never miss a reminder page without
 * Allow counts as Not now; closing before reaching it, or after Allow, leaves the ask state unchanged.
 */
export function askStateOnTutorialClose(state: string | null, closedOnAskPage: boolean, allowed: boolean): string | null {
  if (!closedOnAskPage || allowed) return state;
  return askStateAfterNotNow(state, 'automatic');
}

/** Existing installs that already have permission are marked accepted, so they are never asked. */
export function askStateOnLaunch(state: string | null, permission: string | null | undefined): string | null {
  return state === null && permission === 'granted' ? ASK_STATE_ACCEPTED : state;
}

/** Settings toggles (alerts, badge) show the in-app ask first while permission is undecided (section 6.3). */
export function settingsToggleNeedsAsk(value: boolean, permission: string | null | undefined): boolean {
  return value && isPermissionUndecided(permission);
}

export function readAskState(storage: SettingsStorage = localStorage): string | null {
  try {
    return storage.getItem(NOTIF_ASK_STATE_KEY);
  } catch {
    return null;
  }
}

export function writeAskState(state: string | null, storage: SettingsStorage = localStorage): void {
  if (state === null) return;
  try {
    storage.setItem(NOTIF_ASK_STATE_KEY, state);
  } catch {
    // Ask state is advisory; a failed write only means the ask may show again
  }
}
