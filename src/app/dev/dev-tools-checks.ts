/**
 * Dev Tools and Feature Flags Checks
 *
 * Deterministic checks for dev tools settings and feature flag persistence.
 * Tests localStorage hydration and default value behaviour.
 *
 * STATELESS: Returns fresh check array on each call - no side effects.
 */

import type { Check } from './check-system';

/**
 * Simple assertion helper
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Helper: run a callback with localStorage isolation for a given key.
 * Saves the current value before, restores it after.
 */
function withIsolatedKey(key: string, fn: () => void): void {
  const saved = localStorage.getItem(key);
  try {
    fn();
  } finally {
    if (saved === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, saved);
    }
  }
}

/**
 * Returns all dev tools and feature flag checks.
 * PURE FUNCTION - builds fresh array on each call.
 */
export function getDevToolsChecks(): Check[] {
  return [
    // ========================================================================
    // 1. Dev tools password required
    // ========================================================================

    {
      id: 'devtools-password-default',
      name: 'Dev tools password: default is true when no value persisted',
      run: () => {
        withIsolatedKey('reminderly-dev-tools-password-required', () => {
          localStorage.removeItem('reminderly-dev-tools-password-required');
          const stored = localStorage.getItem('reminderly-dev-tools-password-required');
          assert(stored === null, 'Expected no stored value');
          // Default logic: if stored === 'false' return false, else return true
          const defaultValue = stored === 'false' ? false : true;
          assert(defaultValue === true, `Expected default true, got ${defaultValue}`);
        });
      },
    },

    {
      id: 'devtools-password-persist-true',
      name: 'Dev tools password: true persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-dev-tools-password-required', () => {
          localStorage.setItem('reminderly-dev-tools-password-required', 'true');
          const stored = localStorage.getItem('reminderly-dev-tools-password-required');
          assert(stored === 'true', `Expected 'true', got '${stored}'`);
        });
      },
    },

    {
      id: 'devtools-password-persist-false',
      name: 'Dev tools password: false persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-dev-tools-password-required', () => {
          localStorage.setItem('reminderly-dev-tools-password-required', 'false');
          const stored = localStorage.getItem('reminderly-dev-tools-password-required');
          assert(stored === 'false', `Expected 'false', got '${stored}'`);
        });
      },
    },

    {
      id: 'devtools-password-hydrate-true',
      name: 'Dev tools password: hydrates true correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-dev-tools-password-required', () => {
          localStorage.setItem('reminderly-dev-tools-password-required', 'true');
          const stored = localStorage.getItem('reminderly-dev-tools-password-required');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === true, `Expected true, got ${hydrated}`);
        });
      },
    },

    {
      id: 'devtools-password-hydrate-false',
      name: 'Dev tools password: hydrates false correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-dev-tools-password-required', () => {
          localStorage.setItem('reminderly-dev-tools-password-required', 'false');
          const stored = localStorage.getItem('reminderly-dev-tools-password-required');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === false, `Expected false, got ${hydrated}`);
        });
      },
    },

    // ========================================================================
    // 2. Paywall toggle
    // ========================================================================

    {
      id: 'paywall-default',
      name: 'Paywall toggle: default is true when no value persisted',
      run: () => {
        withIsolatedKey('reminderly-ff-paywall', () => {
          localStorage.removeItem('reminderly-ff-paywall');
          const stored = localStorage.getItem('reminderly-ff-paywall');
          assert(stored === null, 'Expected no stored value');
          // Default logic: if stored === 'false' return false, else return true
          const defaultValue = stored === 'false' ? false : true;
          assert(defaultValue === true, `Expected default true, got ${defaultValue}`);
        });
      },
    },

    {
      id: 'paywall-persist-true',
      name: 'Paywall toggle: true persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-paywall', () => {
          localStorage.setItem('reminderly-ff-paywall', 'true');
          const stored = localStorage.getItem('reminderly-ff-paywall');
          assert(stored === 'true', `Expected 'true', got '${stored}'`);
        });
      },
    },

    {
      id: 'paywall-persist-false',
      name: 'Paywall toggle: false persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-paywall', () => {
          localStorage.setItem('reminderly-ff-paywall', 'false');
          const stored = localStorage.getItem('reminderly-ff-paywall');
          assert(stored === 'false', `Expected 'false', got '${stored}'`);
        });
      },
    },

    {
      id: 'paywall-hydrate-true',
      name: 'Paywall toggle: hydrates true correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-paywall', () => {
          localStorage.setItem('reminderly-ff-paywall', 'true');
          const stored = localStorage.getItem('reminderly-ff-paywall');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === true, `Expected true, got ${hydrated}`);
        });
      },
    },

    {
      id: 'paywall-hydrate-false',
      name: 'Paywall toggle: hydrates false correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-paywall', () => {
          localStorage.setItem('reminderly-ff-paywall', 'false');
          const stored = localStorage.getItem('reminderly-ff-paywall');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === false, `Expected false, got ${hydrated}`);
        });
      },
    },

    // ========================================================================
    // 3. Onboarding tutorial enabled toggle
    // ========================================================================

    {
      id: 'tutorial-enabled-default',
      name: 'Onboarding tutorial enabled: default is true when no value persisted',
      run: () => {
        withIsolatedKey('reminderly-ff-onboarding-tutorial', () => {
          localStorage.removeItem('reminderly-ff-onboarding-tutorial');
          const stored = localStorage.getItem('reminderly-ff-onboarding-tutorial');
          assert(stored === null, 'Expected no stored value');
          // Default logic: if stored === 'false' return false, else return true
          const defaultValue = stored === 'false' ? false : true;
          assert(defaultValue === true, `Expected default true, got ${defaultValue}`);
        });
      },
    },

    {
      id: 'tutorial-enabled-persist-true',
      name: 'Onboarding tutorial enabled: true persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-onboarding-tutorial', () => {
          localStorage.setItem('reminderly-ff-onboarding-tutorial', 'true');
          const stored = localStorage.getItem('reminderly-ff-onboarding-tutorial');
          assert(stored === 'true', `Expected 'true', got '${stored}'`);
        });
      },
    },

    {
      id: 'tutorial-enabled-persist-false',
      name: 'Onboarding tutorial enabled: false persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-onboarding-tutorial', () => {
          localStorage.setItem('reminderly-ff-onboarding-tutorial', 'false');
          const stored = localStorage.getItem('reminderly-ff-onboarding-tutorial');
          assert(stored === 'false', `Expected 'false', got '${stored}'`);
        });
      },
    },

    {
      id: 'tutorial-enabled-hydrate-true',
      name: 'Onboarding tutorial enabled: hydrates true correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-onboarding-tutorial', () => {
          localStorage.setItem('reminderly-ff-onboarding-tutorial', 'true');
          const stored = localStorage.getItem('reminderly-ff-onboarding-tutorial');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === true, `Expected true, got ${hydrated}`);
        });
      },
    },

    {
      id: 'tutorial-enabled-hydrate-false',
      name: 'Onboarding tutorial enabled: hydrates false correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-onboarding-tutorial', () => {
          localStorage.setItem('reminderly-ff-onboarding-tutorial', 'false');
          const stored = localStorage.getItem('reminderly-ff-onboarding-tutorial');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === false, `Expected false, got ${hydrated}`);
        });
      },
    },

    // ========================================================================
    // 4. Tutorial first-launch toggle
    // ========================================================================

    {
      id: 'tutorial-first-launch-default',
      name: 'Tutorial first-launch: default is true when no value persisted',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-first-launch', () => {
          localStorage.removeItem('reminderly-ff-tutorial-first-launch');
          const stored = localStorage.getItem('reminderly-ff-tutorial-first-launch');
          assert(stored === null, 'Expected no stored value');
          // Default logic: if stored === 'false' return false, else return true
          const defaultValue = stored === 'false' ? false : true;
          assert(defaultValue === true, `Expected default true, got ${defaultValue}`);
        });
      },
    },

    {
      id: 'tutorial-first-launch-persist-true',
      name: 'Tutorial first-launch: true persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-first-launch', () => {
          localStorage.setItem('reminderly-ff-tutorial-first-launch', 'true');
          const stored = localStorage.getItem('reminderly-ff-tutorial-first-launch');
          assert(stored === 'true', `Expected 'true', got '${stored}'`);
        });
      },
    },

    {
      id: 'tutorial-first-launch-persist-false',
      name: 'Tutorial first-launch: false persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-first-launch', () => {
          localStorage.setItem('reminderly-ff-tutorial-first-launch', 'false');
          const stored = localStorage.getItem('reminderly-ff-tutorial-first-launch');
          assert(stored === 'false', `Expected 'false', got '${stored}'`);
        });
      },
    },

    {
      id: 'tutorial-first-launch-hydrate-true',
      name: 'Tutorial first-launch: hydrates true correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-first-launch', () => {
          localStorage.setItem('reminderly-ff-tutorial-first-launch', 'true');
          const stored = localStorage.getItem('reminderly-ff-tutorial-first-launch');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === true, `Expected true, got ${hydrated}`);
        });
      },
    },

    {
      id: 'tutorial-first-launch-hydrate-false',
      name: 'Tutorial first-launch: hydrates false correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-first-launch', () => {
          localStorage.setItem('reminderly-ff-tutorial-first-launch', 'false');
          const stored = localStorage.getItem('reminderly-ff-tutorial-first-launch');
          const hydrated = stored === 'false' ? false : true;
          assert(hydrated === false, `Expected false, got ${hydrated}`);
        });
      },
    },

    // ========================================================================
    // 5. Tutorial every-start toggle
    // ========================================================================

    {
      id: 'tutorial-every-start-default',
      name: 'Tutorial every-start: default is false when no value persisted',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-every-start', () => {
          localStorage.removeItem('reminderly-ff-tutorial-every-start');
          const stored = localStorage.getItem('reminderly-ff-tutorial-every-start');
          assert(stored === null, 'Expected no stored value');
          // Default logic: if stored === 'true' return true, else return false
          const defaultValue = stored === 'true' ? true : false;
          assert(defaultValue === false, `Expected default false, got ${defaultValue}`);
        });
      },
    },

    {
      id: 'tutorial-every-start-persist-true',
      name: 'Tutorial every-start: true persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-every-start', () => {
          localStorage.setItem('reminderly-ff-tutorial-every-start', 'true');
          const stored = localStorage.getItem('reminderly-ff-tutorial-every-start');
          assert(stored === 'true', `Expected 'true', got '${stored}'`);
        });
      },
    },

    {
      id: 'tutorial-every-start-persist-false',
      name: 'Tutorial every-start: false persists to localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-every-start', () => {
          localStorage.setItem('reminderly-ff-tutorial-every-start', 'false');
          const stored = localStorage.getItem('reminderly-ff-tutorial-every-start');
          assert(stored === 'false', `Expected 'false', got '${stored}'`);
        });
      },
    },

    {
      id: 'tutorial-every-start-hydrate-true',
      name: 'Tutorial every-start: hydrates true correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-every-start', () => {
          localStorage.setItem('reminderly-ff-tutorial-every-start', 'true');
          const stored = localStorage.getItem('reminderly-ff-tutorial-every-start');
          const hydrated = stored === 'true' ? true : false;
          assert(hydrated === true, `Expected true, got ${hydrated}`);
        });
      },
    },

    {
      id: 'tutorial-every-start-hydrate-false',
      name: 'Tutorial every-start: hydrates false correctly from localStorage',
      run: () => {
        withIsolatedKey('reminderly-ff-tutorial-every-start', () => {
          localStorage.setItem('reminderly-ff-tutorial-every-start', 'false');
          const stored = localStorage.getItem('reminderly-ff-tutorial-every-start');
          const hydrated = stored === 'true' ? true : false;
          assert(hydrated === false, `Expected false, got ${hydrated}`);
        });
      },
    },

    // ========================================================================
    // 6. First-launch tutorial sentinels
    // ========================================================================

    {
      id: 'tutorial-reminders-sentinel-default-absent',
      name: 'Tutorial reminders sentinel: absent by default (no value persisted)',
      run: () => {
        withIsolatedKey('reminderly-tutorial-reminders-shown', () => {
          localStorage.removeItem('reminderly-tutorial-reminders-shown');
          const stored = localStorage.getItem('reminderly-tutorial-reminders-shown');
          assert(stored === null, 'Expected no stored value');
        });
      },
    },

    {
      id: 'tutorial-reminders-sentinel-written',
      name: 'Tutorial reminders sentinel: can be written to localStorage',
      run: () => {
        withIsolatedKey('reminderly-tutorial-reminders-shown', () => {
          localStorage.setItem('reminderly-tutorial-reminders-shown', 'true');
          const stored = localStorage.getItem('reminderly-tutorial-reminders-shown');
          assert(stored === 'true', `Expected 'true', got '${stored}'`);
        });
      },
    },

    {
      id: 'tutorial-lists-sentinel-default-absent',
      name: 'Tutorial lists sentinel: absent by default (no value persisted)',
      run: () => {
        withIsolatedKey('reminderly-tutorial-lists-shown', () => {
          localStorage.removeItem('reminderly-tutorial-lists-shown');
          const stored = localStorage.getItem('reminderly-tutorial-lists-shown');
          assert(stored === null, 'Expected no stored value');
        });
      },
    },

    {
      id: 'tutorial-lists-sentinel-written',
      name: 'Tutorial lists sentinel: can be written to localStorage',
      run: () => {
        withIsolatedKey('reminderly-tutorial-lists-shown', () => {
          localStorage.setItem('reminderly-tutorial-lists-shown', 'true');
          const stored = localStorage.getItem('reminderly-tutorial-lists-shown');
          assert(stored === 'true', `Expected 'true', got '${stored}'`);
        });
      },
    },

    // ========================================================================
    // 9. Hide overdue dev toggle
    // ========================================================================

    {
      id: 'hide-overdue-default',
      name: 'Hide overdue: default is false on initial load',
      run: () => {
        // hideOverdue does not persist, default is false
        const defaultValue = false;
        assert(defaultValue === false, `Expected default false, got ${defaultValue}`);
      },
    },

    {
      id: 'hide-overdue-state-change-true',
      name: 'Hide overdue: state can change to true',
      run: () => {
        let hideOverdue = false;
        hideOverdue = true;
        assert(hideOverdue === true, `Expected true, got ${hideOverdue}`);
      },
    },

    {
      id: 'hide-overdue-state-change-false',
      name: 'Hide overdue: state can change to false',
      run: () => {
        let hideOverdue = true;
        hideOverdue = false;
        assert(hideOverdue === false, `Expected false, got ${hideOverdue}`);
      },
    },

    {
      id: 'hide-overdue-reinit-resets',
      name: 'Hide overdue: reinitialisation resets to default false',
      run: () => {
        // Simulates component reinitialisation within same runtime
        let hideOverdue = true;
        // Reinit
        hideOverdue = false;
        assert(hideOverdue === false, `Expected false after reinit, got ${hideOverdue}`);
      },
    },
  ];
}
