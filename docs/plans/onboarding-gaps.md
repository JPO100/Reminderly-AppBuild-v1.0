# Onboarding gaps - scope

Status: approved by the CTO (2026-10-17), implemented and merged into main (71ff2a5, 2026-10-20). Deviations are listed in development-history.md. Simulator tutorial checks and fresh-install device checks outstanding.

## 1. Summary

The onboarding review (2026-10-17) found two gaps in the Reminders tutorial:

- No page shows how to create a reminder, the app's core action.
- Notification permission is asked in a separate dialog after the tutorial closes, not as part of onboarding.

This scope adds up to three Reminders pages (Create a reminder, Type it naturally, Never miss a reminder) and Lists copy fixes. Everything else in both tutorials is unchanged.

Classification: Type C (new tutorial components; changes when notification permission is asked, a protected area).

Out of scope (John, 2026-10-17): no Skip control, no change to the tutorial navigation buttons (dots, Back, Next, "Okay, got it" / "Okay, got it!", Restart), and no welcome line on page 0 (no room; page 0 stays as it is).

## 2. Page breakdown

### Reminders (6 to 9 pages, currently 5 to 6)

| # | Page | Status | Shown when |
|---|---|---|---|
| 0 | A tour of reminders | Unchanged | Always |
| 1 | Create a reminder | New (section 3) | Always |
| 2 | Type it naturally | New (section 3) | Natural language capture (NLC) active |
| 3 | Filter your reminders | Unchanged (was page 1) | Always |
| 4 | Manage your reminders | Unchanged | Always |
| 5 | Mark reminders as 'done' | Unchanged | Always |
| 6 | See what you've done | Unchanged | Always |
| 7 | Re-run this tutorial | Unchanged | Settings menu on |
| 8 | Never miss a reminder | New (section 4) | Notification ask eligible |

Page numbers are positions when every page is shown; hidden pages close up, as today.

### Lists (3 to 5 pages, unchanged)

Copy only:

- Page 3 (Create smart reminders) subtitle: "Add a reminder that tracks / your list's progress".
- Pages 2, 3 and 4: remove the trailing full stop, matching the other pages.

No permission page on Lists.

## 3. Create a reminder and Type it naturally pages

Both are animated mocks in the existing pattern: the New reminder button throbs, the New reminder sheet slides up (built from `TutorialSmartReminderSheet` in `OnboardingPage3Content.tsx`, titled "New reminder"), text is typed at the existing 80ms per character, the tick throbs, the sheet closes and the row is inserted with the existing highlight, 2000ms pause, then repeat. Both mirror the live sheet configuration (for example the date presets row when that flag is on), and the inserted row uses the live subtitle formatting.

### Create a reminder (always)

- Title "Create a reminder". Subtitle "Tap New reminder, type it in / and set when it's due".
- Animation: types "Call the dentist", turns on Set date (tomorrow) and Set time (3:00 PM) through the picker rows, saves.
- Same animation whether NLC is on or off, so the manual route is always shown.

### Type it naturally (NLC active only)

NLC is a major feature when active, so it gets its own page (John, 2026-10-17). Based on John's original NLC slide design, with the adjustments below agreed on 2026-10-17. When NLC is not active the page is removed from the sequence.

Layout: title, subtitle and the tutorial phone, as on every other page. No header icon (John's original had one; no other page does and space is tight).

- Title: "Type it naturally". Not "Smart reminders", which is already the name for list-linked reminders.
- Subtitle, following the live NLC mode, with the word "blue" shown in blue:
  - Auto mode (default): "When Reminderly spots a time or date, it / turns the text blue and sets it for you"
  - Click mode: "When Reminderly spots a time or date, it / turns the text blue - just tap it to set it"

Animation (one example, no repeat variant):

| Step | Phone mock |
|---|---|
| 1 | New reminder button throbs; the New reminder sheet slides up over the list (existing tutorial phone shell, sheet built from `TutorialSmartReminderSheet`) |
| 2 | "Take the bins out tonight" typed at 80ms per character; the tick turns blue once there is text, as in the live sheet; "tonight" turns blue when recognised |
| 3 | Click mode only: throb and tap on "tonight" |
| 4 | Set date switches on, value "Today" |
| 5 | Set time switches on, value "9:00 PM" (NLC reads "tonight" as 21:00; live time format) |
| 6 | Tick throbs, sheet closes, "Take the bins out" inserted in the list with the existing highlight, subtitle "Today at 9:00 PM" in the live format |
| 7 | 2000ms pause, then repeat |

- NLC active means `isNlcActive` (NLC flag `reminderly-ff-nlc` on and the user's NLC setting on). The flag and the user setting both default off, so tying the page to the flag alone would demo a feature new users have not switched on (section 9).
- The page is also hidden when both NLC date and time recognition are off, since "tonight" would not be recognised. With only one of them on, only that row switches on, matching the live editor.
- Displayed text after save follows the live normalisation ("tonight" is stripped from the saved title).

## 4. Never miss a reminder page

### When it shows

The page list is fixed when the tutorial opens. The page is included when all of these are true:

- Reminders and Notifications flags on (same guard as `maybeAskForNotifications` today).
- `shouldAskAutomatically(readAskState(), 'tutorial', permission)` is true, so iOS has not decided and the in-app ask has never been answered. This is the existing tutorial rule, unchanged.

Fixing the list at open keeps the dots stable after the user taps Allow.

### Content

- Title "Never miss a reminder". Subtitle: the current dialog copy, "Reminderly can alert you when a reminder is due and show a count on the app icon."
- In place of the phone mock: a bell visual and a blue "Allow alerts" button in the page body. The navigation row is unchanged, so this is the last page and shows "Okay, got it" and Restart as now.

### Behaviour

| Action | Result |
|---|---|
| Allow alerts | Same as Allow in the dialog today (`handleNotifAskAllow`, automatic source): ask state `accepted`, alerts and badge preferences on, iOS prompt. The page then shows "Alerts are on" (granted) or "You can turn alerts on later in Settings" (denied). The tutorial stays open |
| "Okay, got it", backdrop tap or drag down on this page without Allow | Not now: ask state moves to `not-now-1`. The backup ask on the next timed reminder still applies |
| Tutorial closed before reaching this page | No ask (John, 2026-10-17). Ask state unchanged, so the first timed reminder shows the existing dialog |

### Removed

- `closeTutorial` no longer calls `maybeAskForNotifications('tutorial')`. The post-tutorial dialog is replaced by the page.
- Unchanged: the timed reminder ask, the settings toggle ask, `NotificationAskDialog`, the ask state values and the launch rule for existing installs.

## 5. Native and dependency review

| Dependency | Side effect | Handling |
|---|---|---|
| `@capacitor/local-notifications` `requestPermissions` (patched) | `requestAuthorization([.badge, .alert, .sound])`; shows the one-time iOS prompt. The patch only touches badge and action handling, not permission | Called only from Allow alerts, through the existing handler. No new call sites |
| `@capawesome/capacitor-badge` | `set` and `clear` call `requestAuthorization(.badge)` every time | Existing guard (only called once permission is `granted`) unchanged. Tutorial mocks make no plugin calls |
| iOS permission alert | App goes inactive and active; the foreground listener refreshes permission and resyncs | Verify the tutorial stays open on the same page and the page list does not change |
| Notification tap handler | Closes the tutorial on a notification tap | Unchanged. A tap while on the permission page counts as closing without Allow |
| Persistence | No new storage keys. Uses `reminderly-notif-ask-state` and the existing tutorial shown keys | No migration |

## 6. Files

- `src/app/utils/tutorial-pages.ts` - new page ids (create reminder, type it naturally, notification ask) in the visible sequence; config gains `nlcActive` and `notificationAskEligible`.
- `src/app/components/OnboardingCreateReminderContent.tsx` - new; shared by the Create a reminder and Type it naturally pages (picker and NLC modes, auto and click).
- `src/app/components/OnboardingNotificationAskContent.tsx` - new.
- `src/app/components/TutorialOnboardingContent.tsx` - routing for the new pages; Lists copy.
- `src/app/components/TutorialOverlay.tsx` - pass through new props.
- `src/app/App.tsx` - pass NLC, repeat and ask eligibility state; Allow and Not now from the page; remove the ask on tutorial close.
- `src/app/__tests__/tutorial-pages.test.ts`, `src/app/dev/notification-checks.ts` - see section 7.
- `docs/features/onboarding.md`, `docs/features/notifications.md`, `docs/development-history.md`.

## 7. Risks and failure modes

- Fresh install: page shows; Allow, deny and Not now each leave the correct ask state and preferences.
- Existing install with permission granted: marked `accepted` on launch, so no page.
- Existing install, undecided, ask state `not-now-1` or `not-now-2`: no page (existing rule).
- Re-run from settings: same eligibility rule as today's tutorial ask.
- Small screens (below 570px height): the new pages must fit without scrolling, like the existing pages.
- Flag combinations: NLC, repeats, settings menu, Lists, notifications and reminders on and off, giving 6 to 9 pages.
- Signed-off pages 0-4 are unchanged; they only move position in the sequence.

## 8. Verification

- Unit tests: extend `tutorial-pages.test.ts` for page sequences across flag and eligibility combinations.
- Self Check: notification checks for the ask state after Allow and Not now from the page, and no ask on tutorial close.
- Device (simulator and iPhone): fresh install (Allow, deny, Not now), existing install, re-run from settings, NLC on and off, small screen.
- Build, then deploy to simulator and iPhone for John's review.

## 9. Decisions

1. Type it naturally page shown on the flag plus the user's NLC setting (recommended), or the flag alone (John).
2. Permission page keeps the existing navigation, with Allow in the page body (follows John's no-navigation-change instruction).
3. CTO: approve the scope.
