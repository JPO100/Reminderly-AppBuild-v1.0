# Toggle standard - plan for CTO review

Status: plan, awaiting CTO review. Type C (shared styling across several screens, including the reminder panel and the tutorial).
Branch: fix/toggle-standard, from feature/list-template-haptics-sounds (1d45a29), which is awaiting merge approval. Rollback is redeploying that branch.
Requested by John, 2026-10-19.

## Standard (agreed by John)

Named colours: reminderly blue #4784F8, reminderly dark blue #1C2C42, medium grey #BABABA, inactive grey #D9D9D9.

| State | Text (and row icon) | Switch | Tappable |
|---|---|---|---|
| On | Dark blue | Reminderly blue | Yes |
| Off | Dark blue | Medium grey | Yes |
| Inactive (unavailable) | Inactive grey | Inactive grey | No |

- Subtitles are medium grey in the on and off states, inactive grey when inactive.
- Info icons follow the text: normal colour on and off, inactive grey only when inactive (John decision 1).

Why: today "off" (#C9C9C9 text) and "inactive" (#D9D9D9 text) are nearly identical, so an available setting that is off looks unavailable. Dark text with the switch carrying the state matches iOS Settings.

## Scope

Live app:
1. Shared settings `ToggleRow` (`src/app/components/DevToolsOverlay.tsx`): all Reminders, Notifications, Natural Language Capture, Haptic feedback, Sounds and Lists settings toggles (about 25). Off changes from #C9C9C9 text and switch to dark blue text and medium grey switch; info icon no longer greys when off. Inactive unchanged.
2. Smart reminder toggle in list settings (`src/imports/InfoOverlay.tsx`) and 3. list info (`src/imports/list-info-overlay.tsx`): off changes from everything #D9D9D9 (looks unavailable, though tappable) to dark blue icon and title, medium grey subtitle and switch. Both files carry identical copies of the row; both change.
4. Date, Time and Repeats toggles in the new and edit reminder panel (`src/imports/NewReminderOverlay.tsx`): off changes from #B7B7B7 icon and text with a #D9D9D9 switch to dark blue icon and text with a medium grey switch. Repeats while unavailable (no date or time) changes from 30% opacity to inactive grey icon, text and switch, still not tappable (John decision 3). This matches how smart reminder mode already shows Repeats (#D9D9D9 at full opacity).

Tutorial (same branch, per the tutorial consistency principle):
5. Tutorial smart reminder toggle (`TutorialOverlayToggleRow`, `src/app/components/OnboardingPage3Content.tsx`): match 2. Also corrects the on-state title from reminderly blue to dark blue, matching the live row.
6. Tutorial Date, Time and Repeats rows (`SmartReminderOptionRow`, same file): match 4. Also corrects on-state text from reminderly blue to dark blue.
- Tutorial page 6 draws the real `RemindersSettingsContent`, so it follows 1 automatically.

Dev tools (John decision 4: include):
7. `DevToggle` and `DevToggleRow` (about 25 feature flags): as 1.
8. `DevNavToggleRow` (Dev tools home feature rows): off text and chevron change from #D9D9D9 to dark blue and the normal chevron, since these rows stay tappable.
9. Dummy lists (3) and dummy reminders (1) toggles (`src/imports/DummyLists.tsx`, `src/imports/DummyReminders.tsx`): off switch to medium grey; label and info icon per the standard.

Docs: `docs/design.md` toggle entries (colour table and the toggle spec, which today says #D9D9D9 off) updated to the standard.

Not in scope: nine unused Figma exports (`src/imports/Frame*.tsx`) and the unused `src/app/components/ui/switch.tsx`. No change to any toggle's behaviour, tap targets, sizes or when rows are inactive.

## Native and dependency review

Colour and opacity only, in React components. No Capacitor plugins, native code, persistence, permissions, lifecycle or timing touched.

## Risks

- Reminder panel visibility: Date, Time and Repeats appear on every reminder, so this is the most visible change. Off rows will read darker; the switch carries the state.
- Repeating reminders and date and time handling are protected areas. Only the rows' colours and the unavailable look of Repeats change; the rules for when Repeats is unavailable, and all date, time and repeat logic, are unchanged.
- Smart reminder subtitle when off: turning the toggle off keeps the saved due date, so the subtitle still shows "Due by ..." (or "No completion date set" when none). Under the standard it is medium grey on and off, so on and off differ only by the switch. Consistent with the standard; flagged for John to confirm on device.
- Tutorial: rows 5 and 6 are hand-built copies; they must be checked side by side with the live rows.

## Verification

- Simulator screenshots, on, off and inactive where they exist:
  - Reminders settings, Notifications (Sound and Include today inactive), Natural Language Capture, Haptic feedback and Sounds (Reminders and Lists), Lists settings
  - list settings and list info smart reminder toggle
  - new reminder panel Date, Time and Repeats (including Repeats unavailable with no date or time, and in smart reminder mode)
  - tutorial pages 3 and 6
  - Dev tools home, a feature flag page, dummy lists and dummy reminders
- Vitest and Self Check (Node run). Build. Deploy to the simulator and iPhone for John.

## Rollback

Redeploy feature/list-template-haptics-sounds (1d45a29). No data or settings are affected.
