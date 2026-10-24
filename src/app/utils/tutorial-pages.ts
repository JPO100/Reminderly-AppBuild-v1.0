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
