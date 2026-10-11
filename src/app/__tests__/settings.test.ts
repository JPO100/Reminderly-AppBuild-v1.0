import { describe, it } from 'vitest';
import { getSettingsChecks } from '../dev/settings-checks';

// The settings foundation checks use in-memory storage, so they run the same in Vitest and Self Check.
describe('settings foundation', () => {
  for (const check of getSettingsChecks()) {
    it(check.name, () => check.run());
  }
});
