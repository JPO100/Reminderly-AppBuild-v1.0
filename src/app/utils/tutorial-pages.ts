export type TutorialPageConfig = {
  variant: 'reminders' | 'lists';
  settingsMenuEnabled: boolean;
  smartRemindersEnabled: boolean;
  savedListsEnabled: boolean;
  nlcDemoAvailable?: boolean;
  notificationAskEligible?: boolean;
  // Siri for reminders available (flag and Reminders module on); the user's Siri setting does not matter
  siriAvailable?: boolean;
  // Reminder attachments available (flag and Reminders module on)
  attachmentsAvailable?: boolean;
  // Onboarding testing mode: the pages to show, replacing the rules below (null when testing mode is off)
  testPageIds?: number[] | null;
};

export const TUTORIAL_PAGE_CREATE_REMINDER = 6;
export const TUTORIAL_PAGE_TYPE_NATURALLY = 7;
export const TUTORIAL_PAGE_NOTIFICATION_ASK = 8;
export const TUTORIAL_PAGE_SIRI = 9;
export const TUTORIAL_PAGE_ATTACHMENT = 10;

// Reminders tutorial pages: 0 tour, 1 filters, 2 manage, 3 mark done, 4 see done, 5 re-run from settings,
// 6 create a reminder, 7 type it naturally (NLC demo available), 8 notification ask (eligible when opened),
// 9 add reminders with Siri (Siri available), 10 add an attachment (attachments available), straight after create a
// reminder and before Siri.
// Page 1 (filters) is retired: page 0 now clicks through the filters, as the lists tour does (John, 2026-10-24).
// Lists tutorial pages: 0 tour, 1 completed lists, 2 view and edit, 3 smart reminders, 4 list templates,
// 5 re-run from settings.
// Page ids are stable so each page keeps its own content; only the visible sequence changes.
export function getTutorialPageIds(config: TutorialPageConfig): number[] {
  if (config.testPageIds && config.testPageIds.length > 0) return config.testPageIds;
  if (config.variant === 'lists') {
    const pages = [0, 1, 2];
    if (config.smartRemindersEnabled) pages.push(3);
    if (config.savedListsEnabled) pages.push(4);
    if (config.settingsMenuEnabled) pages.push(5);
    return pages;
  }

  const pages = [0, TUTORIAL_PAGE_CREATE_REMINDER];
  if (config.attachmentsAvailable) pages.push(TUTORIAL_PAGE_ATTACHMENT);
  if (config.siriAvailable) pages.push(TUTORIAL_PAGE_SIRI);
  if (config.nlcDemoAvailable) pages.push(TUTORIAL_PAGE_TYPE_NATURALLY);
  pages.push(2, 3, 4);
  if (config.settingsMenuEnabled) pages.push(5);
  if (config.notificationAskEligible) pages.push(TUTORIAL_PAGE_NOTIFICATION_ASK);
  return pages;
}

// Testing tools > Onboarding testing: per tutorial, a testing mode and a toggle per page. With testing mode on,
// the tutorial shows exactly the pages switched on, in the normal order, whatever the flags and ask state.
export type TutorialVariantId = TutorialPageConfig['variant'];

export const TUTORIAL_TEST_PAGES: Record<TutorialVariantId, { id: number; label: string }[]> = {
  reminders: [
    { id: 0, label: 'A tour of reminders' },
    { id: TUTORIAL_PAGE_CREATE_REMINDER, label: 'Create a reminder' },
    { id: TUTORIAL_PAGE_ATTACHMENT, label: 'Add an attachment' },
    { id: TUTORIAL_PAGE_SIRI, label: 'Add reminders with Siri' },
    { id: TUTORIAL_PAGE_TYPE_NATURALLY, label: 'Natural Language Capture' },
    { id: 2, label: 'Manage your reminders' },
    { id: 3, label: "Mark reminders as 'done'" },
    { id: 4, label: "See what you've done" },
    { id: 5, label: 'Re-run this tutorial' },
    { id: TUTORIAL_PAGE_NOTIFICATION_ASK, label: 'Never miss a reminder' },
  ],
  lists: [
    { id: 0, label: 'A tour of lists' },
    { id: 1, label: 'Manage completed lists' },
    { id: 2, label: 'View and edit lists' },
    { id: 3, label: 'Create smart reminders' },
    { id: 4, label: 'Use list templates' },
    { id: 5, label: 'Re-run this tutorial' },
  ],
};

export function tutorialTestModeKey(variant: TutorialVariantId): string {
  return `reminderly-test-tutorial-${variant}-mode`;
}

export function tutorialTestPageKey(variant: TutorialVariantId, pageId: number): string {
  return `reminderly-test-tutorial-${variant}-page-${pageId}`;
}

/** Testing mode off: null (normal rules). On: the pages switched on (missing means on); none on shows the first page. */
export function getTutorialTestPageIds(variant: TutorialVariantId, storage: Pick<Storage, 'getItem'> = localStorage): number[] | null {
  try {
    if (storage.getItem(tutorialTestModeKey(variant)) !== 'true') return null;
    const pages = TUTORIAL_TEST_PAGES[variant].map((page) => page.id).filter((id) => storage.getItem(tutorialTestPageKey(variant, id)) !== 'false');
    return pages.length > 0 ? pages : [TUTORIAL_TEST_PAGES[variant][0].id];
  } catch {
    return null;
  }
}

export type TutorialAutoOpenConfig = {
  showOnFirstLaunch: boolean;
  showOnEveryStart: boolean;
  hasSeenVariant: boolean;
};

// Every start always auto-opens. First launch only auto-opens a variant whose shown key is not 'true'.
export function shouldAutoOpenTutorial(config: TutorialAutoOpenConfig): boolean {
  if (config.showOnEveryStart) return true;
  if (config.showOnFirstLaunch) return !config.hasSeenVariant;
  return false;
}
