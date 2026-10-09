import { describe, it, expect } from 'vitest';
import { getTutorialPageIds, type TutorialPageConfig } from '../utils/tutorial-pages';

function config(overrides: Partial<TutorialPageConfig> = {}): TutorialPageConfig {
  return {
    variant: 'reminders',
    settingsMenuEnabled: false,
    smartRemindersEnabled: false,
    savedListsEnabled: false,
    ...overrides,
  };
}

describe('getTutorialPageIds - reminders tutorial', () => {
  it('shows 5 pages when the settings menu is off', () => {
    expect(getTutorialPageIds(config())).toEqual([0, 1, 2, 3, 4]);
  });

  it('adds the re-run tutorial page when the settings menu is on', () => {
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true }))).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('ignores list-only features', () => {
    expect(getTutorialPageIds(config({ smartRemindersEnabled: true, savedListsEnabled: true }))).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('getTutorialPageIds - lists tutorial', () => {
  it('shows only the 3 core pages when smart reminders and saved lists are off', () => {
    expect(getTutorialPageIds(config({ variant: 'lists' }))).toEqual([0, 1, 2]);
  });

  it('adds the smart reminders page only when smart reminders are on', () => {
    expect(getTutorialPageIds(config({ variant: 'lists', smartRemindersEnabled: true }))).toEqual([0, 1, 2, 3]);
  });

  it('adds the list templates page only when saved lists are on', () => {
    expect(getTutorialPageIds(config({ variant: 'lists', savedListsEnabled: true }))).toEqual([0, 1, 2, 4]);
  });

  it('shows all 5 pages when both features are on', () => {
    expect(getTutorialPageIds(config({ variant: 'lists', smartRemindersEnabled: true, savedListsEnabled: true }))).toEqual([0, 1, 2, 3, 4]);
  });

  it('never includes placeholder pages or the reminders settings page', () => {
    const pages = getTutorialPageIds(config({ variant: 'lists', settingsMenuEnabled: true, smartRemindersEnabled: true, savedListsEnabled: true }));
    expect(pages.every((page) => page <= 4)).toBe(true);
  });
});
