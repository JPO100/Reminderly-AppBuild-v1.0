# Siri spoken "Done" - plan

Status: implemented on `feature/siri-done-confirmation` for John's CarPlay and iPhone testing. Not merged.

Type C under Working Agreement v1.3 (native intent behaviour, reminder creation). Branch from `main` at c990dcd.

## 0. Decision record

- 2026-10-22, John: Siri should say "Done" after adding a reminder, mainly for CarPlay, where Reminderly is not seen.
- 2026-10-22, CTO: conditionally approved. "Done" must mean the reminder is saved, not that the intent ran or the URL was handed over. Establish whether CarPlay creates the reminder; if it does not, no misleading confirmation and a separate background-creation proposal.
- 2026-10-22, John: wording changed to "That's done" (friendlier).
- 2026-10-22, John: implement now and test in CarPlay. The design below cannot say "Done" for an unsaved reminder, so the CarPlay test itself establishes the behaviour.

## 1. Design

| # | Area | Change |
|---|---|---|
| 1 | AddReminderIntent.swift | A one-off request id per request, added to `reminderly://add?text=...&id=...`. After the handoff the intent polls the App Group key `siriAddedConfirmation` every 200ms for up to 5 seconds. Matching id: Siri says "That's done". Otherwise Siri says "I couldn't confirm your reminder was added. Please check Reminderly." (`SiriNotConfirmedError`) |
| 2 | AppDelegate.swift | Passes the id (letters, digits and hyphens only) to the web app as `reminderly.pendingSiriId` with the text |
| 3 | App.tsx | Holds the id with the new reminder's id. After the reminders are saved to `localStorage`, confirms only when the saved data includes the reminder (`isReminderSaved`, utils/siri.ts) |
| 4 | WidgetBridgePlugin.swift, utils/widget.ts | `confirmSiriAdd({ id })` writes the id to `siriAddedConfirmation` in the App Group |

Unchanged: the Siri off refusal (iOS 26+), the in-app gate, the phrase and the parsing.

## 2. Native and dependency review

- Same App Group and plugin as the widget and the Siri state. No new permissions.
- The intent stays alive for up to 5 seconds after the handoff while it waits. Siri shows its working state meanwhile.
- If the app cannot be opened (for example a locked iPhone in CarPlay), no confirmation arrives and Siri says it could not confirm.

## 3. Verification

- Vitest: `isReminderSaved` (present, missing, empty, unreadable); `confirmSiriAdd` (sends the id, nothing for an empty id or outside iOS).
- John: CarPlay with the iPhone unlocked and locked; iPhone with Siri on (hears or sees "Done", reminder added) and off (refusal); the confirmation never appears without the reminder.
