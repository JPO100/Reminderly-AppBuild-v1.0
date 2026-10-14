# Onboarding and tutorial

The animated tutorial for Reminders and Lists, shown in a slide-up overlay with a miniature phone.

## Availability and access

| Key | Default | Effect |
|-----|---------|--------|
| `reminderly-ff-onboarding-tutorial` | on | Tutorial available. Off: `TutorialOverlay` renders nothing |
| `reminderly-config-tutorial-first-launch` | on | Open automatically on launch |
| `reminderly-test-tutorial-every-start` | off | Open on every start (testing; mutually exclusive with first launch) |

- Automatic opening: on mount, unless a notification tap is pending, if either launch setting is on, the tutorial for the visible tab opens. Switching to the other tab later in the session opens that tab's tutorial once.
- Manual: Reminders settings > Reminders tutorial, or Lists settings > Lists tutorial (settings menu on). Always starts at the first page.
- The variant follows the shown tab: Lists tab gives the Lists tutorial, otherwise Reminders.
- Closing writes `reminderly-tutorial-reminders-shown` or `reminderly-tutorial-lists-shown`. These keys are not currently read by the app.

### Confirmed requirement

Confirmed product requirement (John, 2026-10-12):

- Show the tutorial automatically once, on first launch.
- Record that it has been shown, so it does not appear automatically on later launches.
- Keep it available manually through the existing settings rows.

Implementation (2026-10-14): closing a tutorial saves its "shown" key (`reminderly-tutorial-reminders-shown`, `reminderly-tutorial-lists-shown`). With "Show tutorial on first launch", each variant auto-opens only while its key is not `'true'`, on app start and on first switching to that tab. "Show tutorial on every start" still always opens it. Existing users who have already closed a tutorial keep their saved key, so it does not reopen. Decision logic: `shouldAutoOpenTutorial` in `utils/tutorial-pages.ts`. Manual access is unchanged.

## Structure

Render path:

`App.tsx` > `TutorialOverlay.tsx` > `TutorialOnboardingContent.tsx` > `TutorialPhoneShell.tsx` > `TutorialPhoneHeader.tsx` > `TutorialMainTabBar.tsx` > `TutorialReminderFilters.tsx` > page body

| Component | Owns |
|-----------|------|
| `TutorialOnboardingContent` | Page selection, variant routing, navigation, per-page shell configuration; Lists pages (`ListsTutorialPlaceholderPage`) |
| `TutorialPhoneShell` | Phone size, padding, shell and bezel colour |
| `TutorialPhoneHeader` | Shared header |
| `TutorialMainTabBar` | Reminders/Lists tabs (hidden when Lists is off) |
| `TutorialReminderFilters` | Filter pills, including the Done/Deleted state |
| `TutorialStaticReminderList` | Default reminder mini-list data and rendering |
| `OnboardingPage1Content` ... `OnboardingPage6Content` | Reminders pages 0-5 (content only) |

`OnboardingPage7Content`, `OnboardingPage8Content` and `OnboardingPage9Content` are not part of the active flow. `src/imports/tutorial-onboarding-content.tsx` is an unused earlier version.

`App.tsx` provides the wrapper: transparent backdrop, slide-up motion, viewport-aware top position, drag to close and close on backdrop tap. The tutorial keeps no completion state of its own.

## Pages

`getTutorialPageIds(config)` (`src/app/utils/tutorial-pages.ts`) chooses the visible pages from the current feature state. Page ids are fixed, so each page keeps its content; dots, Back, Next and Restart follow the visible sequence. Mock-ups mirror the live configuration (no tab bar when Lists is off).

### Reminders (5 or 6 pages)

Pages 0-4 are signed off and locked.

| Page | Title | Content |
|------|-------|---------|
| 0 | A tour of reminders | Mini-list builds with row fade-ins; 2000ms pause, then repeats |
| 1 | Filter your reminders | Cycles the filters; 2000ms pause |
| 2 | Manage your reminders | Attention throb on the "Pick up milk" three-dot button, then the scaled Reminder info overlay; 2000ms pause |
| 3 | Mark reminders as 'done' | Completes every reminder except the Sometime one; resets with fade-ins |
| 4 | See what you've done | Starts with only "Organise family photo"; the logo tick throbs and the view switches to Done reminders (scaled Done, Deleted and Clear all pills, white logo tick, no three-dot buttons) showing the page 3 reminders; 2000ms pauses between states |
| 5 | Re-run this tutorial | Only with the settings menu on. Subtitle "You can re-run this tutorial from / the settings menu". Static mini-list, no animation |

Attention throb (page 2): three opacity pulses, `duration 2.3`, `delay 0.4`, `times [0, 0.109, 0.217, 0.391, 0.5, 0.609, 0.783, 0.891, 1]`, `easeInOut`. Page 4's first logo throb becomes visible after the shared 400ms delay.

Default mini-list (`TutorialStaticReminderList.tsx`): Pick up milk (today), Call the dentist (today), Pay credit card (this week, monthly repeat), Submit expenses (later), Put the bins out (later, weekly repeat), Organise family photo (Sometime). Every dated reminder has a time; subtitles use the live app's formatting.

Scaled Done/Deleted pills (page 4): 31.5px high, 9.751px text, 11.144px side padding, 66px Clear all width.

### Lists (3 to 5 pages)

| Page | Title | Shown | Content |
|------|-------|-------|---------|
| 0 | A tour of lists | Always | Colour-grouped, filtered lists |
| 1 | Manage completed lists | Always | Logo tick throb to the done lists view and back |
| 2 | View and edit lists | Always | List editor; add-button throb (50px), "Prepare update" typed into "Work tasks" at 80ms per character, inserted with highlight, 2000ms pause |
| 3 | Create smart reminders | Smart reminders on | Three-dot throb, list settings, smart reminder on, switch to Reminders, smart reminder sheet with tick throb (62px), reminder inserted |
| 4 | Use list templates | Templates on | Templates button throb, panel with six templates, "Weekly food shop" opened (8 items), "Olive oil" typed and added, menu throb, template settings |

## Navigation

- Page dots, centred for the visible count.
- Back (hidden on the first page), Next, and "Okay, got it" on the last page, which closes the overlay.
- Restart returns to the first page (shown on the last page).

Below 570px height the container switches from 808px to auto height, dots are hidden and padding is adjusted.

## Files

- `src/app/components/TutorialOverlay.tsx`, `TutorialOnboardingContent.tsx`, `TutorialPhoneShell.tsx`, `TutorialPhoneHeader.tsx`, `TutorialMainTabBar.tsx`, `TutorialReminderFilters.tsx`, `TutorialStaticReminderList.tsx`, `tutorialTokens.ts`
- `src/app/components/OnboardingPage1Content.tsx` to `OnboardingPage6Content.tsx`
- `src/app/utils/tutorial-pages.ts`
