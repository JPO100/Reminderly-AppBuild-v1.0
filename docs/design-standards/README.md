# Design standards

One document per standard. Each rule lives in exactly one document; nothing is restated elsewhere. Owned and updated in Reminderly, shared with other NeatlyMade apps by copying a document unchanged. Each shareable document carries a version and a change log so another app can tell when its copy is stale.

UI changes follow these standards and any visual specification John supplies for the task. `Claude.md` is only a loader for `project-rules.md` and holds no visual specification.

Colours and sizes are mostly applied inline in component code; there is no single theme map. The documents split out of the former `design.md` were checked against the code on 2026-10-12; where they differ, the code is the source of truth and the document should be corrected. They were moved without changes to their content and are due a review.

**Applies to** says who the rules bind. *All apps*: the rule is shared (colour values are always per app; see each document). *Reminderly only*: another app does not adopt it. *Mixed*: the document says which parts are which.

| Document | Covers | Applies to | Status |
|----------|--------|------------|--------|
| [overlay-standards.md](./overlay-standards.md) | Centred overlays: two-zone principle, geometry, spacing, buttons, scrolling, toggles, accessibility, tutorials, screen sizes, checklist; Reminderly appendix | All apps (sections 1 to 11); Reminderly only (appendix) | v1.1, 2026-11-03, reviewed |
| [colour-standards.md](./colour-standards.md) | Core, reminder category, list category, state and grey colours | Mixed: roles shared, values per app; category colours Reminderly only | Moved, review due |
| [typography-standards.md](./typography-standards.md) | Lato styles, sizes and colours | Mixed: Lato styles shared where adopted; colours per app | Moved, review due |
| [layout-and-spacing-standards.md](./layout-and-spacing-standards.md) | Common spacing values, layout and responsiveness | Mixed: spacing values shared; pill and tutorial heights Reminderly only | Moved, review due |
| [panel-standards.md](./panel-standards.md) | Main and slide-up panel spacing, bottom sheets | Mixed: to be classified in the review | Moved, review due |
| [controls-standards.md](./controls-standards.md) | Pills, rows, buttons, toggles | Mixed: toggle standard shared; pills and rows Reminderly only | Moved, review due |
| [tutorial-phone-standards.md](./tutorial-phone-standards.md) | Tutorial phone sizing and ownership | Reminderly only | Moved, review due |
| [motion-standards.md](./motion-standards.md) | Sheet and list motion | Mixed: to be classified in the review | Moved, review due |

Record new UI standards here, as a new document or in the document that owns the topic.
