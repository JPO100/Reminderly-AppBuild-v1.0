# Rows and controls standards

Visual conventions as implemented, checked against the code on 2026-10-12. Where they differ, the code is the source of truth and this document should be corrected. Part of the [design standards](./README.md).

- Filter pills: 45px high, fully rounded, 16px side padding (13px below 375px width with the settings menu on), `justify-between`.
- Reminder row circle: 25 x 25.
- Attachment indicator: a reminder with an attachment (attachments feature on) shows a 13 x 15 paperclip, `currentColor`, 8px before its title, in the active, Done and Deleted lists alike. Rows without an attachment show no icon.
- Row three-dot button: with the settings menu on, inset 11.5px from the right (`RowMenuButton` `alignWithSettingsButton`) so the dots centre under the header settings button. Applies to Reminders and Lists rows, done/deleted pages and Templates.
- New reminder / New list button: full width (max 768px), fully rounded, `#4784F8`, 17px white label, 30px side padding, height `clamp(40px, calc(20vh - 73.6px), 60px)`.
- Header logo: 209.653 x 35.653 SVG wordmark with tick.
- Toggle: 56 x 30 track, 3.75px inset, 22.5px white knob, track radius 37.5px (verified 2026-11-03 in `DevToolsOverlay.tsx` and `InfoOverlay.tsx`). Intended to be instant, with no transition; see the toggle review note below.
- Toggle standard (2026-10-19, docs/plans/toggle-standard.md), for every toggle including the reminder panel, Dev tools and the tutorial:
  - On: text and row icon `#1C2C42`, track `#4784F8`.
  - Off: text and row icon `#1C2C42`, track `#BABABA`.
  - Inactive (unavailable): text, row icon and track `#D9D9D9`, not tappable.
  - Subtitles `#BABABA` on and off. Info icons follow the text: normal on and off, `#D9D9D9` only when inactive. In the code the "normal" info icon colour is medium grey `#BABABA` (`DevToolsOverlay.tsx`, `ToggleRow`).

### Toggle review note (2026-11-03, proposed for approval)

Checked against the code. Confirmed: track size, inset, knob, radius, the on, off and inactive colours of the track (`#4784F8`, `#BABABA`, `#D9D9D9`), and the title colour (`#1C2C42`, or `#D9D9D9` when inactive).

**Text weights and sizes (verified).**
- Settings and Dev tools toggle row title: Lato Bold 17px, 23px line height, 15px before the info icon (`DevToolsOverlay.tsx`, `ToggleRow`).
- Overlay toggle row (the smart reminder row in List settings and List info): title Lato Bold 17px with a 17px line height, `#1C2C42`; subtitle Lato Bold 14px with a 14px line height, `#BABABA`, 9px below the title; the row has a 16px gap between the icon, label and toggle, and the toggle is aligned to the top (`InfoOverlay.tsx`, `list-info-overlay.tsx`). While the due date is highlighted the subtitle turns `#1C2C42` for 300ms.

**Differences from this document, not changed in the code (decisions for John):**
1. **Transition.** This document says toggles are instant with no transition. The Settings and Dev tools toggles carry a `transition-colors` class (`DevToolsOverlay.tsx` lines 128 and 261), so their track colour animates. The smart reminder overlay toggle has no transition.
2. **Inactive state.** The Dev tools and Settings toggles implement the inactive state (`#D9D9D9`, not tappable). The smart reminder overlay toggle component has no inactive style; whether it is ever shown inactive was not checked.
3. **Info icon colour.** "Normal" is `#BABABA` (medium grey) in the code; this document did not say so.
4. **Button label size.** The full-width "New reminder" and "New template" buttons use a 20px white Bold label in `App.tsx`; the "New reminder / New list button" line above says 17px. Recorded only; not changed.

**Not verified:** the New reminder panel's own toggles, the tutorial's toggle replicas, and whether other toggle rows use a different line height.
