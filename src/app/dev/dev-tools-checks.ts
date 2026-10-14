/**
 * Dev Tools and Feature Flags Checks
 *
 * Deterministic checks for the Dev tools settings defaults, read through the
 * app's real settings path (settings/useStoredSetting and settings/resolver).
 * Uses an empty in-memory storage, so running them never touches real settings.
 *
 * STATELESS: Returns fresh check array on each call - no side effects.
 */

import type { Check } from './check-system';
import { readStoredBool, writeStoredBool } from '../settings/useStoredSetting';
import { isFeatureActive } from '../settings/resolver';
import { shouldAutoOpenTutorial } from '../utils/tutorial-pages';

/**
 * Simple assertion helper
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Returns all dev tools and feature flag checks.
 * PURE FUNCTION - builds fresh array on each call.
 */
export function getDevToolsChecks(): Check[] {
  return [
    {
      id: 'devtools-defaults',
      name: 'Dev tools defaults: password required on, paywall off, onboarding on, first-launch tutorial on, every-start tutorial off',
      run: () => {
        const storage = { getItem: () => null, setItem: () => {} };
        const expected: [string, boolean][] = [
          ['reminderly-dev-tools-password-required', true],
          ['reminderly-ff-paywall', false],
          ['reminderly-ff-onboarding-tutorial', true],
          ['reminderly-config-tutorial-first-launch', true],
          ['reminderly-test-tutorial-every-start', false],
        ];
        for (const [key, value] of expected) {
          const actual = readStoredBool(key, undefined, storage);
          assert(actual === value, `${key} should default ${value}, got ${actual}`);
        }
        assert(!isFeatureActive('paywall', { storage }), 'Paywall should be inactive when never saved');
      },
    },

    // ========================================================================
    // Tutorial first launch (D9 / F9): the shown keys decide whether first launch auto-opens
    // ========================================================================

    {
      id: 'tutorial-first-launch-skips-seen-variant',
      name: 'Tutorial first launch: does not auto-open a variant whose shown key is true',
      run: () => {
        const saved: Record<string, string> = { 'reminderly-tutorial-reminders-shown': 'true' };
        const remindersSeen = saved['reminderly-tutorial-reminders-shown'] === 'true';
        const listsSeen = saved['reminderly-tutorial-lists-shown'] === 'true';
        assert(!shouldAutoOpenTutorial({ showOnFirstLaunch: true, showOnEveryStart: false, hasSeenVariant: remindersSeen }), 'Expected the seen reminders tutorial not to auto-open');
        assert(shouldAutoOpenTutorial({ showOnFirstLaunch: true, showOnEveryStart: false, hasSeenVariant: listsSeen }), 'Expected the unseen lists tutorial to auto-open');
      },
    },

    {
      id: 'tutorial-every-start-ignores-seen-variant',
      name: 'Tutorial every start: auto-opens even when the shown key is true',
      run: () => {
        assert(shouldAutoOpenTutorial({ showOnFirstLaunch: false, showOnEveryStart: true, hasSeenVariant: true }), 'Expected every start to auto-open a seen tutorial');
      },
    },

    // ========================================================================
    // 10. Reminder attachments feature toggle
    // ========================================================================

    {
      id: 'reminder-attachments-default',
      name: 'Reminder attachments: default is off when no value is saved',
      run: () => {
        const storage = { getItem: () => null, setItem: () => {} };
        const actual = readStoredBool('reminderly-ff-reminder-attachments', undefined, storage);
        assert(actual === false, `Expected default false, got ${actual}`);
      },
    },

    {
      id: 'reminder-attachments-saved-values',
      name: 'Reminder attachments: saved true and false are read back through the settings path',
      run: () => {
        for (const value of [true, false]) {
          const saved: Record<string, string> = {};
          const storage = { getItem: (k: string) => saved[k] ?? null, setItem: (k: string, v: string) => { saved[k] = v; } };
          writeStoredBool('reminderly-ff-reminder-attachments', value, storage);
          assert(saved['reminderly-ff-reminder-attachments'] === String(value), `Expected '${value}' saved, got '${saved['reminderly-ff-reminder-attachments']}'`);
          const actual = readStoredBool('reminderly-ff-reminder-attachments', undefined, storage);
          assert(actual === value, `Expected ${value}, got ${actual}`);
        }
      },
    },
  ];
}
