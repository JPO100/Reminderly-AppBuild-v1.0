export type TutorialPageConfig = {
  variant: 'reminders' | 'lists';
  settingsMenuEnabled: boolean;
  smartRemindersEnabled: boolean;
  savedListsEnabled: boolean;
};

// Reminders tutorial pages: 0 tour, 1 filters, 2 manage, 3 mark done, 4 see done, 5 re-run from settings.
// Lists tutorial pages: 0 tour, 1 completed lists, 2 view and edit, 3 smart reminders, 4 list templates.
// Page ids are stable so each page keeps its own content; only the visible sequence changes.
export function getTutorialPageIds(config: TutorialPageConfig): number[] {
  if (config.variant === 'lists') {
    const pages = [0, 1, 2];
    if (config.smartRemindersEnabled) pages.push(3);
    if (config.savedListsEnabled) pages.push(4);
    return pages;
  }

  const pages = [0, 1, 2, 3, 4];
  if (config.settingsMenuEnabled) pages.push(5);
  return pages;
}
