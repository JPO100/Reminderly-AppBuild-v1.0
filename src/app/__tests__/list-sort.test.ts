import { describe, it } from 'vitest';
import { getListChecks } from '../dev/list-checks';

// Global list sort order: the ordering checks run the same in Vitest and Self Check.
describe('list ordering', () => {
  for (const check of getListChecks().filter((c) => c.id.startsWith('list-sort-') || c.id.startsWith('list-display-items-'))) {
    it(check.name, () => check.run());
  }
});
