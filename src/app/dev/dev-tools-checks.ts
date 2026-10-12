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
import { readStoredBool } from '../settings/useStoredSetting';
import { isFeatureActive } from '../settings/resolver';

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
  ];
}
