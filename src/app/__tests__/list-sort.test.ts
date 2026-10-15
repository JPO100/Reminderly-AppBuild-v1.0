import { describe, it } from 'vitest';
import { getListChecks } from '../dev/list-checks';

// List ordering and buckets: these checks run the same in Vitest and Self Check.
describe('list ordering', () => {
  for (const check of getListChecks().filter((c) => c.id.startsWith('list-sort-') || c.id.startsWith('list-display-items-') || c.id.startsWith('list-category-'))) {
    it(check.name, () => check.run());
  }
});
