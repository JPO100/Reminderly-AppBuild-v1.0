# Templates panel to page - implementation plan

Status: draft for CTO approval on `feature/templates-page` (2026-10-17). Product decisions P1-P4 follow the CTO recommendations and are awaiting John's confirmation. No code changed.

## 1. Summary

The List templates bottom sheet becomes a page on the Lists tab. Tapping the 45px templates button switches the Lists content to the templates page straight away. The x button returns to the Lists page.

Classification: Type C (existing navigation and state logic on the Lists screen, plus the onboarding mirror). CTO agreed. No protected areas touched.

## 2. Product decisions (CTO recommendations, awaiting John)

- P1. The "..." button keeps its current behaviour (opens Lists settings).
- P2. The Lists tab label stays "Lists" on the templates page (today it changes to "List templates").
- P3. Immediate view switch, no transition.
- P4. Onboarding tutorial page 5 is updated in this task, limited to reflecting the new page.

## 3. Page layout

- Same white container and padding as the Lists page (sits under the tabs, no sheet).
- Header row 45px: title "List templates" (Lato Bold 20, #1C2C42) left; x button (supplied 45px SVG) then the existing "..." button right, 10px gap, matching the Lists filter row.
- Filter pills hidden.
- Template rows, empty state and "Create new template" button unchanged in style and layout.

## 4. Implementation

Reuse existing state. `savedListsPanelOpen` stays the source of truth (it now means "templates page shown"); `restoreSavedListsPanelAfterOverlayClose` keeps its role so the page stays visible under the template editor and is restored when the editor closes.

App.tsx:
1. Lists content branch: when `savedListsPanelOpen || (isSavedListsOverlayOpen && restoreSavedListsPanelAfterOverlayClose)`, render the templates header and the existing templates list content in place of the filter row and lists content. Otherwise render the Lists page as now.
2. Move the existing templates row, empty state and create button markup from the overlay into that branch unchanged.
3. Remove the bottom-sheet wrapper: AnimatePresence, backdrop, slide motion, drag handle, `templatesSheetDragControls` and the `useDragControls` import if unused. Remove the overlay's own "Templates" title row.
4. x button: `setSavedListsPanelOpen(false)`.
5. Lists tab label: drop the "List templates" case (P2).
6. Logo tick (Done lists) is now reachable while templates are shown; it was previously covered by the sheet backdrop. Closing templates when switching to Done lists keeps the two views exclusive.

Entry, exit and re-entry flows kept as they are (only the target changes from sheet to page):
- Templates button opens the page.
- Reminders tab, Lists tab and the saved lists feature flag turning off all close it (existing code).
- Template row tap opens the editor; closing or saving returns to the page (restore flag).
- Create new template opens the editor; closing returns to the page.
- Template editor delete returns to the page.
- Use as list closes the page and opens the new list (existing code).
- Created-template feedback from list info and list settings opens the page, then the editor.

TutorialOnboardingContent.tsx (P4):
- Page 5 already renders the templates view in the container. Update its title row only: 45px height, blue 45px x button in place of the grey 15px cross. The tutorial Lists row has no "..." button, so none is added. Phases, timing and throb targets unchanged.

## 5. Native and dependency review

No Capacitor plugins, native code, persistence or settings keys are touched. Removing the sheet drops one framer-motion drag control; no other dependency change. Template data (`reminderly-saved-lists`) is read and written by the same code as now.

## 6. Risks and failure modes

- Re-entry flows could leave the page hidden or stuck open. Mitigated by keeping the existing state flags and checking each flow.
- Done lists and templates shown together via the logo tick. Mitigated by step 6.
- Scroll: the templates list keeps its own scroll container; the create button stays pinned at the bottom on small screens.
- Tutorial page 5 throb positions depend on the title row height. Check the row throb still lands on the target template.
- Fresh install and empty template list: empty state shows on the page.

## 7. Verification

- Vitest and Self Check (Node run), repo guard and web build.
- Web preview and simulator: every flow in section 4, the empty state, delete and undo, many templates (scroll), the "..." menu from the templates page, and the logo tick while on templates.
- Screen sizes: iPhone SE width (375pt), iPhone 15 Pro (393pt) and iPhone 17 Pro.
- Tutorial page 5 runs through every phase.
- Deploy to the simulator and John's iPhone.
