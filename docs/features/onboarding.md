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
| `OnboardingCreateReminderContent` | Reminders pages 6 (Create a reminder) and 7 (Type it naturally): phone, mock New reminder sheet and animation |
| `OnboardingNotificationAskContent` | Reminders page 8 (Never miss a reminder): phone with alert banner, Allow alerts action and result |
| `OnboardingSiriContent` | Reminders page 9 (Add reminders with Siri): home screen, Siri orb and panel, Reminderly opening and the reminder inserted |

`OnboardingPage7Content`, `OnboardingPage8Content` and `OnboardingPage9Content` are not part of the active flow. `src/imports/tutorial-onboarding-content.tsx` is an unused earlier version.

`App.tsx` provides the wrapper: transparent backdrop, slide-up motion, viewport-aware top position, drag to close and close on backdrop tap. The tutorial keeps no completion state of its own.

## Pages

`getTutorialPageIds(config)` (`src/app/utils/tutorial-pages.ts`) chooses the visible pages from the current feature state. Page ids are fixed, so each page keeps its content; dots, Back, Next and Restart follow the visible sequence. Mock-ups mirror the live configuration (no tab bar when Lists is off).

### Reminders (6 to 10 pages)

Pages 0-5 are signed off and locked. Visible order: 0, 6, 9 (Siri available), 7 (NLC demo available), 1, 2, 3, 4, 5 (settings menu on), 8 (notification ask eligible). Pages 6-8 added on feature/onboarding-gaps (docs/plans/onboarding-gaps.md).

| Page | Title | Content |
|------|-------|---------|
| 0 | A tour of reminders | Mini-list builds with row fade-ins; 2000ms pause, then repeats |
| 1 | Filter your reminders | Cycles the filters; 2000ms pause |
| 2 | Manage your reminders | Attention throb on the "Pick up milk" three-dot button, then the scaled Reminder info overlay; 2000ms pause |
| 3 | Mark reminders as 'done' | Completes every reminder except the Sometime one; resets with fade-ins |
| 4 | See what you've done | Starts with only "Organise family photo"; the logo tick throbs and the view switches to Done reminders (scaled Done, Deleted and Clear all pills, white logo tick, no three-dot buttons) showing the page 3 reminders; 2000ms pauses between states |
| 5 | Re-run this tutorial | Only with the settings menu on. Subtitle "You can re-run this tutorial from / the settings menu". Static mini-list, no animation |
| 6 | Create a reminder | Always. New reminder button throbs, mock sheet slides up, "Book a haircut" typed (80ms per character), Date (Tomorrow) and Time (3pm) toggles tapped, tick throbs, row inserted with highlight and the mini list scrolls to show it; 2000ms pause, then repeats |
| 7 | Type it naturally | Only when NLC is active (flag and user setting) and `getNlcTutorialDemo` recognises a demo phrase with the user's recognition settings. Time recognition on: "Take the bins out tonight" (Date Today, Time 9pm); time off, date on: "Take the bins out tomorrow" (Date Tomorrow). Auto mode applies as typed; click mode shows a tap on the blue phrase. Subtitle follows the mode |
| 9 | Add reminders with Siri | Third, straight after Create a reminder, only while Siri for reminders is available (`reminderly-ff-siri-reminders` and the Reminders module on), whatever the user's Siri setting. Subtitle "Say "Hey Siri, add to Reminderly app" / then tell Siri your reminder". Phone top slice plays the Siri journey, modelled on Siri in iOS 27: home screen (flat #1C2C42 wallpaper, generic app icons, not Apple artwork, with Reminderly), the dark Siri orb drops from the Dynamic Island with the multicolour waveform (900ms), the dark panel shows "What would you like to be reminded about?" (2400ms), then "Call Mum at 6pm today" (4300ms), the panel closes into the island, Reminderly opens from its icon (6500ms) and "Call Mum" (today 6pm) is inserted at the top of the list with the usual highlight (7500ms, 1000ms); 2000ms pause, then repeats (`OnboardingSiriContent.tsx`). Siri Phase 3 |
| 8 | Never miss a reminder | Last page, only when the Reminders and Notifications flags are on and `shouldAskAutomatically(state, 'tutorial', permission)` passes when the tutorial opens (fixed for that opening). Mock alert banner; "Allow alerts" only while iOS is undecided, then "Alerts are on" or "You can turn alerts on later in Settings". Navigation unchanged |

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

Subtitles have no trailing full stop. Page 3 subtitle: "Add a reminder that tracks / your list's progress".

## Navigation

- Page dots, centred for the visible count.
- Back (hidden on the first page), Next, and "Okay, got it" on the last page, which closes the overlay.
- Restart returns to the first page (shown on the last page).

Below 570px height the container switches from 808px to auto height, dots are hidden and padding is adjusted.

## Files

- `src/app/components/TutorialOverlay.tsx`, `TutorialOnboardingContent.tsx`, `TutorialPhoneShell.tsx`, `TutorialPhoneHeader.tsx`, `TutorialMainTabBar.tsx`, `TutorialReminderFilters.tsx`, `TutorialStaticReminderList.tsx`, `tutorialTokens.ts`
- `src/app/components/OnboardingPage1Content.tsx` to `OnboardingPage6Content.tsx`, `OnboardingCreateReminderContent.tsx`, `OnboardingNotificationAskContent.tsx`
- `src/app/utils/tutorial-pages.ts`, `src/app/utils/tutorial-nlc-demo.ts`
