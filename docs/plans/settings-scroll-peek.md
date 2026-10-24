# Settings scroll cut: always half a row - plan

Status: plan approved by Kai (2026-10-24); implemented on fix/settings-scroll-peek, awaiting final CTO review. Not merged.

Type C under Working Agreement v1.3 (shared settings component used by every Reminders and Lists settings page and the tutorial pages that show them). Branch `fix/settings-scroll-peek` from main 59752c8. Implementation after `feature/nlc-mode-toggles` is merged, as that branch adds the page that shows the fault.

## 0. Decision record

- 2026-10-23, John: reduced footer standard. On scrolling row pages the scroll area cuts through the middle of a row, as a hard edge, so half a row always shows (docs/design.md, Scrolling settings pages).
- 2026-10-24, John: on the Natural Language Capture page (feature/nlc-mode-toggles, 6 rows) a whole row is hidden below the cut with nothing showing, so users cannot tell the page scrolls. Make the existing standard reliable everywhere (option A). Rejected: a persistent scroll bar (B) and a chevron cue (C). No fades.

## 1. Problem

The cut is meant to run through a row's middle. On the Natural Language Capture page it falls in the 30px gap between two rows, so the next row is completely hidden ("Recognise repeats" after the reorder, "Tap highlighted words" before it).

## 2. Likely cause (to be confirmed by measurement first)

Sub-pages do not measure their own scroll area. `PanelShell` passes `baseHeight` = the main page's scroll area height, adjusted only for the title gap and a version line (`VERSION_LINE_HEIGHT`). It assumes the sub-page title is one line, as on the main page. "Natural Language Capture" wraps to two lines, so the real area is about one title line (about 28px) shorter than `ScrollArea` assumes. The row chosen for the cut and the card growth are then out by that much, roughly half the 60px row pitch, which puts the edge in a gap instead of mid-row.

## 3. Proposed fix

- Measure the sub-page header's actual height in `PanelShell` and use the difference from the main header in `baseHeight`, in place of the version-line constant. This covers wrapped titles and version lines alike.
- `ScrollArea` logic (choose the row whose middle needs the least growth, grow or shrink the card by up to 30px) is unchanged.
- Add a guard: after layout, if the cut is not within a row, measure again once from the rendered sizes. Kept only if Stage 1 shows the header fix alone is not enough.
- Constants (`SCROLL_PEEK` 40, `SUB_PAGE_GLIMPSE_GAP` 24), main pages, text pages and pages that fit are unchanged.

## 4. Native and dependency review

Web layer only (React layout). No plugins, storage, notifications or native code. Risk: card height on sub-pages changes by up to one title line on pages with wrapped titles; the main page and fitting pages do not change.

## 5. Failure modes checked

- Small screens: 375pt wide (the fixed 450px card) and 402pt; titles wrap differently at each width.
- Pages that change length while open (NLC off greys rows but keeps them; repeats row only while repeat reminders are available).
- Repeat visits (the earlier alternating-height defect, 2026-10-22).
- Tutorial Re-run pages that render the live settings content.

## 6. Stages

1. Measure every Reminders and Lists settings page and sub-page at 402x874 and 375 wide in the browser preview: page scrolls or fits, cut position relative to the nearest row middle, footer (24 or 40). Confirm the cause on Natural Language Capture.
2. Fix in `PanelShell` (and the guard if needed).
3. Re-measure every page, including tutorial Re-run pages. Simulator and iPhone check of the Natural Language Capture page.
4. Docs: design.md (state that the cut always lands mid-row, also with wrapped titles), development history.

## 7. Verification

- Measured table for every page before and after (scrolls or fits, cut offset from row middle, footer).
- Pass: every scrolling row page shows part of a row at the cut, middle about 24px above the card edge; footers 24 when scrolling and 40 when fitting; no page height changes on repeat visits.
- Vitest and Self Check unchanged and passing.

## 8. Results

Cause confirmed: on the Natural Language Capture page the header is 48px (title on two lines) against 24px on the main page, so the area was 24px shorter than assumed and the cut fell between rows.

Fix: `ScrollArea` takes the main page's header height and subtracts any extra height of the sub-page's own header from `baseHeight`. `VERSION_LINE_HEIGHT` removed (the measured header covers the version line). Main pages, text pages and the tutorial settings page (main page only) take the unchanged path. No guard needed.

Browser preview, 402x874 (after fix; before in brackets where different):

| Page | Card | Scrolls | Footer | Cut |
|---|---|---|---|---|
| Reminders settings | 474 | no | 40 | fits |
| Siri shortcuts | 474 | no | 40 | fits |
| Notifications | 474 | no | 40 | fits |
| Natural Language Capture | 498 (474) | yes | 24 | row middle 24 above edge (in a gap, no row showing) |
| Sounds and haptics (Reminders) | 474 | yes | 24 | row middle 24 above edge |
| Support (Reminders) | 474 | no | 40 | fits |
| Lists settings | 414 | no | 40 | fits |
| Sounds and haptics (Lists) | 443 | yes | 24 | row middle 24 above edge |
| Support (Lists) | 414 | no | 40 | fits |

Repeat visits (Natural Language Capture and Sounds and haptics, 3 times each): heights stable (498, 474).

375x812 (fixed 450px card): every scrolling page now cuts through a row (Natural Language Capture was in a gap before the fix, now row middle 36 above the edge). Pre-existing and unchanged by this fix: on the fixed card, row middles sit 31 to 60 above the edge rather than 24, and pages that fit show 47 or 76 below the content rather than 40 (the fixed height does not take the growth). Reported for decision, not changed.

Vitest 444 passed.

## 9. Confirmation for final review (2026-10-24, at 0f2399a, NLC title now one line)

Method: browser preview, every Reminders and Lists settings page, two full passes after a fresh load at each width; each scrolling page also scrolled to the end to check the last row is fully visible. Baseline: the same passes with main's SettingsPanelContent.tsx (08e2d27, no fix).

402x874: every scrolling page (Natural Lang. Capture 474, Sounds and haptics 474 and 443) cuts through a row middle 24 above the edge; footers 24 when scrolling and 40 when fitting; the last row is fully visible when scrolled; no change between passes.

375x812 (fixed 450px card): every scrolling page cuts through a row (Reminders settings 31, Notifications, Natural Lang. Capture and Sounds and haptics 60 above the edge); fitting pages 47. Identical with main's component, so pre-existing and unchanged by this branch.

Pre-existing defect found, identical on main: at 375 wide, on the first pass after a fresh load, opening Notifications straight after Siri shortcuts gives footer 47 instead of 60 and the last row ("Include due today") stays partly clipped when scrolled to the end; the next visit is correct. Not caused or changed by this branch. Reported to Kai for a decision.
