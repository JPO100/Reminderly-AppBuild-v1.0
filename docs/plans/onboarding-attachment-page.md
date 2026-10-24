# Onboarding tutorial: Add an attachment page, filters page hidden - plan

Status: plan approved by Kai (2026-10-24) with John's decisions; implemented on feature/onboarding-tutorial-updates; John's iPhone check passed (2026-10-24, build 0a13bb6); awaiting final Type C review. Not merged.

Branch `feature/onboarding-tutorial-updates` from main 59b33db.

## 0. Decision record

- 2026-10-24, John: add a reminders tutorial page "Add an attachment" after Create a reminder. It circles the attachment button, opens the Add an attachment overlay (overlay size and styling to match the app closely), picks an image and shows it attaching.
- 2026-10-24, John: hide the Filter your reminders page for now. The reminders tutorial is getting long and the filters are intuitive. It may come back.

## 1. Classification

- Filters page hidden: Type B. One line in `getTutorialPageIds` (page 1 dropped from the reminders sequence; its content and code are kept) plus the sequence tests and onboarding.md. Done.
- Attachment page: Type C. A new tutorial component and a new page in the sequence, gated on an existing flag. Tutorial only: no change to the live attachment feature.

## 2. Proposed page

Page id 10 (`TUTORIAL_PAGE_ATTACHMENT`). Visible order becomes: 0, 6, 10, 9 (Siri), 7 (NLC), 2, 3, 4, 5, 8.

Shown only while reminder attachments are available (`reminderly-ff-reminder-attachments` and the Reminders module on, `isReminderAttachmentsEnabled` in App.tsx), so the tutorial never shows a button the user does not have.

Title "Add an attachment". Proposed subtitle: "Tap the paperclip to add / a photo or file to your reminder".

Animation, in the usual tutorial phone (top slice, as on Natural Language Capture), repeating:

1. The New reminder sheet slides up with the reminder text already in it ("Print the holiday photo"), 1000ms.
2. The paperclip button in the text field is circled with the standard 35px target circle and three-pulse throb (2750ms).
3. The Add an attachment overlay appears over a 50% black dim of the phone screen.
4. "Choose a photo" gets the standard pill throb ring (2750ms).
5. The overlay closes and the image thumbnail appears in the text field, with the text wrapping clear of it, as in the app.
6. 2000ms pause, then repeat.

## 3. Matching the live UI (from NewReminderOverlay.tsx)

Paperclip button: 25px circle #E4E4E4 with the #939393 paperclip stroke, 8px from the text field's right and bottom edges.

Overlay card, copied value for value (it differs from the other tutorial overlays, which use 40/30 padding and a 40 gap):

- Width 340, corner radius 32, white.
- Padding 35 top and bottom, 32 sides; gap 25.
- Title "Add an attachment", Lato Bold 20, #1C2C42, centred.
- Button stack 7px below the gap, 30px between buttons: "Choose a photo", "Take a photo", "Choose a file", each 50px high, full width, #4784F8 pill, Lato Bold 17 white.
- Scaled into the tutorial phone with the existing `TutorialMiniOverlayShell` (the live 340pt card on a 393pt screen, scaled 280/393 and centred, as on Manage your reminders and Re-run this tutorial).

Attached thumbnail: 45 x 58 tile, 7px corners, 3px #ECECEC outer border and 3px white inner border, image cover-fitted, with the 20px #BABABA remove X at the top right; text gets 73px right padding, as in the app.

## 4. Implementation

- New `src/app/components/OnboardingAttachmentContent.tsx` (text and phone, same structure as OnboardingSiriContent).
- `OnboardingCreateReminderContent.tsx`: export the mock New reminder sheet and its throb helpers, and give the sheet optional paperclip and thumbnail slots. Off by default, so Create a reminder and Natural Language Capture stay unchanged.
- `tutorial-pages.ts`: `TUTORIAL_PAGE_ATTACHMENT = 10` and an `attachmentsAvailable` config flag.
- `TutorialOnboardingContent.tsx`, `TutorialOverlay.tsx`, `App.tsx`: pass `attachmentsAvailable={isReminderAttachmentsEnabled}` through and render the page.
- Tests: sequence cases for the new page in `tutorial-pages.test.ts`.
- Docs: onboarding.md page table and sequence, development history.

About 250 new lines, mostly the new component. No new patterns.

## 5. Native and dependency review

Web layer only. The page is a static mock: it does not call the Camera, FilePicker or Filesystem plugins, request photo or camera permission, or read or write attachment storage. No persistence, scheduling, notification or badge changes. The image is a small inline SVG illustration (no bundled photo, no licensing, no network).

## 6. Risks and checks

- Small screens: check at 375 x 667 (max-height 570 rule) and 402 x 874; the scaled overlay must sit inside the phone screen.
- Legibility: overlay text at the 0.71 tutorial scale, the same as the existing scaled overlays.
- Sequence: the Siri page note "third, straight after Create a reminder" becomes fourth when attachments are on; comments and docs updated.
- Tutorial consistency: the Create a reminder mock does not show the paperclip today even when attachments are on. Out of scope unless John wants it (decision D4).

## 7. Decisions needed (John)

- D1 Position: straight after Create a reminder, before Siri and Natural Language Capture (recommended, as asked), or after them.
- D2 Gating: show only when attachments are available (recommended), or always.
- D3 Picking the image: tap "Choose a photo" and the thumbnail appears (recommended, keeps the page short), or also mock the iOS photo picker grid.
- D4 Create a reminder consistency: leave its mock without the paperclip (recommended for this branch), or add the paperclip there too when attachments are on.
- D5 Image: a flat-colour illustration in SVG, hard edges and no gradients (recommended), or a bundled photo.

## 8. Verification

- Vitest (tutorial sequence tests) and Self Check.
- Simulator screenshots of each step (paperclip circled, overlay, Choose a photo ring, attached thumbnail), compared side by side with the live overlay at the same scale.
- Navigation: Back, Next, dots and Restart across the new page, with attachments on and off.
- Deploy to the simulator and John's iPhone.

## 9. Approved decisions (Kai, 2026-10-24)

- D1: straight after Create a reminder.
- D2: only when reminder attachments are available.
- D3: a simple mocked photo-selection step (a "Photos" grid), then the attached thumbnail. Not the native picker.
- D4: the paperclip is added to Create a reminder, on the same attachments gate as the new page. The Natural Language Capture page uses the same mock sheet, so it shows the paperclip too, as the live sheet does.
- D5: flat-colour SVG image.

## 10. Implementation notes

- The mock sheet's tick follows the text by default; the attachment page sets it grey, as the live tick is with no date or time.
- 375 x 667: the phone slice (about 161px) is shorter than the sheet's text field at the usual sheet top, so on short phones the attachment page stops the sheet higher (top = screen height minus the field's bottom edge, capped at the usual top). The centred overlay card is taller than the slice at this size and clips top and bottom, as the existing Manage your reminders overlay already does; Choose a photo and its ring stay in view.
