import { describe, it } from 'vitest';
import { getScheduleChecks } from '../dev/schedule-checks';

// The date preset checks are pure, so they run the same in Vitest and Self Check.
describe('date presets', () => {
  for (const check of getScheduleChecks().filter((c) => c.id.startsWith('date-preset-'))) {
    it(check.name, () => check.run());
  }
});
