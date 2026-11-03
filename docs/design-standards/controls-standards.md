# Rows and controls standards

Visual conventions as implemented, checked against the code on 2026-10-12. Where they differ, the code is the source of truth and this document should be corrected. Part of the [design standards](./README.md).

- Filter pills: 45px high, fully rounded, 16px side padding (13px below 375px width with the settings menu on), `justify-between`.
- Reminder row circle: 25 x 25.
- Attachment indicator: a reminder with an attachment (attachments feature on) shows a 13 x 15 paperclip, `currentColor`, 8px before its title, in the active, Done and Deleted lists alike. Rows without an attachment show no icon.
- Row three-dot button: with the settings menu on, inset 11.5px from the right (`RowMenuButton` `alignWithSettingsButton`) so the dots centre under the header settings button. Applies to Reminders and Lists rows, done/deleted pages and Templates.
- New reminder / New list button: full width (max 768px), fully rounded, `#4784F8`, 17px white label, 30px side padding, height `clamp(40px, calc(20vh - 73.6px), 60px)`.
- Header logo: 209.653 x 35.653 SVG wordmark with tick.
- Toggle: 56 x 30 track, 3.75px inset, 22.5px white knob; instant, no transition.
- Toggle standard (2026-10-19, docs/plans/toggle-standard.md), for every toggle including the reminder panel, Dev tools and the tutorial:
  - On: text and row icon `#1C2C42`, track `#4784F8`.
  - Off: text and row icon `#1C2C42`, track `#BABABA`.
  - Inactive (unavailable): text, row icon and track `#D9D9D9`, not tappable.
  - Subtitles `#BABABA` on and off. Info icons follow the text: normal on and off, `#D9D9D9` only when inactive.
