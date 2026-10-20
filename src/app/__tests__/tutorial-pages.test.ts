import { describe, it, expect } from 'vitest';
import { getTutorialPageIds, shouldAutoOpenTutorial, type TutorialPageConfig } from '../utils/tutorial-pages';

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
  it('shows 6 pages, with create a reminder second, when the optional pages are off', () => {
    expect(getTutorialPageIds(config())).toEqual([0, 6, 1, 2, 3, 4]);
  });

  it('adds the re-run tutorial page when the settings menu is on', () => {
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true }))).toEqual([0, 6, 1, 2, 3, 4, 5]);
  });

  it('adds type it naturally after create a reminder only when the NLC demo is available', () => {
    expect(getTutorialPageIds(config({ nlcDemoAvailable: true }))).toEqual([0, 6, 7, 1, 2, 3, 4]);
  });

  it('adds the notification ask as the last page only when eligible', () => {
    expect(getTutorialPageIds(config({ notificationAskEligible: true }))).toEqual([0, 6, 1, 2, 3, 4, 8]);
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true, notificationAskEligible: true }))).toEqual([0, 6, 1, 2, 3, 4, 5, 8]);
  });

  it('shows all 9 pages when every optional page is on', () => {
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true, nlcDemoAvailable: true, notificationAskEligible: true }))).toEqual([0, 6, 7, 1, 2, 3, 4, 5, 8]);
  });

  it('ignores list-only features', () => {
    expect(getTutorialPageIds(config({ smartRemindersEnabled: true, savedListsEnabled: true }))).toEqual([0, 6, 1, 2, 3, 4]);
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

  it('never includes placeholder pages or reminders-only pages', () => {
    const pages = getTutorialPageIds(config({ variant: 'lists', settingsMenuEnabled: true, smartRemindersEnabled: true, savedListsEnabled: true, nlcDemoAvailable: true, notificationAskEligible: true }));
    expect(pages.every((page) => page <= 4)).toBe(true);
  });
});

describe('shouldAutoOpenTutorial', () => {
  it('first launch opens a variant that has not been seen', () => {
    expect(shouldAutoOpenTutorial({ showOnFirstLaunch: true, showOnEveryStart: false, hasSeenVariant: false })).toBe(true);
  });

  it('first launch does not open a variant that has been seen', () => {
    expect(shouldAutoOpenTutorial({ showOnFirstLaunch: true, showOnEveryStart: false, hasSeenVariant: true })).toBe(false);
  });

  it('every start opens even when the variant has been seen', () => {
    expect(shouldAutoOpenTutorial({ showOnFirstLaunch: false, showOnEveryStart: true, hasSeenVariant: true })).toBe(true);
  });

  it('existing user who has seen the reminders tutorial only gets the lists tutorial', () => {
    expect(shouldAutoOpenTutorial({ showOnFirstLaunch: true, showOnEveryStart: false, hasSeenVariant: true })).toBe(false);
    expect(shouldAutoOpenTutorial({ showOnFirstLaunch: true, showOnEveryStart: false, hasSeenVariant: false })).toBe(true);
  });

  it('never opens when both triggers are off', () => {
    expect(shouldAutoOpenTutorial({ showOnFirstLaunch: false, showOnEveryStart: false, hasSeenVariant: false })).toBe(false);
  });
});
