import { describe, it, expect } from 'vitest';
import { getTutorialPageIds, getTutorialTestPageIds, shouldAutoOpenTutorial, tutorialTestModeKey, tutorialTestPageKey, TUTORIAL_TEST_PAGES, type TutorialPageConfig } from '../utils/tutorial-pages';

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
  it('shows 5 pages, with create a reminder second and no filters page, when the optional pages are off', () => {
    expect(getTutorialPageIds(config())).toEqual([0, 6, 2, 3, 4]);
  });

  it('adds the re-run tutorial page when the settings menu is on', () => {
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true }))).toEqual([0, 6, 2, 3, 4, 5]);
  });

  it('adds type it naturally after create a reminder only when the NLC demo is available', () => {
    expect(getTutorialPageIds(config({ nlcDemoAvailable: true }))).toEqual([0, 6, 7, 2, 3, 4]);
  });

  it('adds the Siri page third, straight after create a reminder, only when Siri is available', () => {
    expect(getTutorialPageIds(config({ siriAvailable: true }))).toEqual([0, 6, 9, 2, 3, 4]);
    expect(getTutorialPageIds(config({ siriAvailable: true, nlcDemoAvailable: true }))).toEqual([0, 6, 9, 7, 2, 3, 4]);
    expect(getTutorialPageIds(config({ siriAvailable: false }))).toEqual([0, 6, 2, 3, 4]);
  });

  it('adds the attachment page straight after create a reminder only when attachments are available', () => {
    expect(getTutorialPageIds(config({ attachmentsAvailable: true }))).toEqual([0, 6, 10, 2, 3, 4]);
    expect(getTutorialPageIds(config({ attachmentsAvailable: false }))).toEqual([0, 6, 2, 3, 4]);
    expect(getTutorialPageIds(config({ attachmentsAvailable: true, siriAvailable: true, nlcDemoAvailable: true }))).toEqual([0, 6, 10, 9, 7, 2, 3, 4]);
  });

  it('never adds the attachment page to the lists tutorial', () => {
    expect(getTutorialPageIds(config({ variant: 'lists', attachmentsAvailable: true }))).toEqual([0, 1, 2]);
  });

  it('never adds the Siri page to the lists tutorial', () => {
    expect(getTutorialPageIds(config({ variant: 'lists', siriAvailable: true }))).toEqual([0, 1, 2]);
  });

  it('adds the notification ask as the last page only when eligible', () => {
    expect(getTutorialPageIds(config({ notificationAskEligible: true }))).toEqual([0, 6, 2, 3, 4, 8]);
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true, notificationAskEligible: true }))).toEqual([0, 6, 2, 3, 4, 5, 8]);
  });

  it('shows all 8 pages when every optional page is on', () => {
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true, nlcDemoAvailable: true, notificationAskEligible: true }))).toEqual([0, 6, 7, 2, 3, 4, 5, 8]);
    expect(getTutorialPageIds(config({ settingsMenuEnabled: true, nlcDemoAvailable: true, notificationAskEligible: true, siriAvailable: true, attachmentsAvailable: true }))).toEqual([0, 6, 10, 9, 7, 2, 3, 4, 5, 8]);
  });

  it('ignores list-only features', () => {
    expect(getTutorialPageIds(config({ smartRemindersEnabled: true, savedListsEnabled: true }))).toEqual([0, 6, 2, 3, 4]);
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

  it('adds the re-run tutorial page last when the settings menu is on', () => {
    expect(getTutorialPageIds(config({ variant: 'lists', settingsMenuEnabled: true }))).toEqual([0, 1, 2, 5]);
    expect(getTutorialPageIds(config({ variant: 'lists', settingsMenuEnabled: true, smartRemindersEnabled: true, savedListsEnabled: true }))).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('never includes placeholder pages or reminders-only pages', () => {
    const pages = getTutorialPageIds(config({ variant: 'lists', settingsMenuEnabled: true, smartRemindersEnabled: true, savedListsEnabled: true, nlcDemoAvailable: true, notificationAskEligible: true }));
    expect(pages.every((page) => page <= 5)).toBe(true);
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

describe('Onboarding testing mode', () => {
  function storage(values: Record<string, string>) {
    return { getItem: (key: string) => values[key] ?? null };
  }

  it('uses the normal rules while testing mode is off', () => {
    expect(getTutorialTestPageIds('reminders', storage({}))).toBeNull();
    expect(getTutorialTestPageIds('lists', storage({ [tutorialTestModeKey('lists')]: 'false' }))).toBeNull();
  });

  it('shows every page in the normal order when testing mode is on and nothing is switched off', () => {
    expect(getTutorialTestPageIds('reminders', storage({ [tutorialTestModeKey('reminders')]: 'true' }))).toEqual([0, 6, 10, 9, 7, 2, 3, 4, 5, 8]);
    expect(getTutorialTestPageIds('lists', storage({ [tutorialTestModeKey('lists')]: 'true' }))).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('leaves out pages switched off, and shows the first page when all are off', () => {
    const on = { [tutorialTestModeKey('reminders')]: 'true' };
    expect(getTutorialTestPageIds('reminders', storage({ ...on, [tutorialTestPageKey('reminders', 0)]: 'false', [tutorialTestPageKey('reminders', 9)]: 'false' }))).toEqual([6, 10, 7, 2, 3, 4, 5, 8]);
    const allOff = Object.fromEntries(TUTORIAL_TEST_PAGES.reminders.map((page) => [tutorialTestPageKey('reminders', page.id), 'false']));
    expect(getTutorialTestPageIds('reminders', storage({ ...on, ...allOff }))).toEqual([0]);
  });

  it('replaces the normal rules, including the notification ask page', () => {
    expect(getTutorialPageIds(config({ testPageIds: [8] }))).toEqual([8]);
    expect(getTutorialPageIds(config({ testPageIds: null }))).toEqual(getTutorialPageIds(config()));
  });
});
