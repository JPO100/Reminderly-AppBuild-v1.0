# Design standards

One document per standard. Each rule lives in exactly one document; nothing is restated elsewhere. Owned and updated in Reminderly, shared with other NeatlyMade apps by copying a document unchanged. Each shareable document carries a version and a change log so another app can tell when its copy is stale.

UI changes follow these standards and any visual specification John supplies for the task. `Claude.md` is only a loader for `project-rules.md` and holds no visual specification.

Colours and sizes are mostly applied inline in component code; there is no single theme map. The documents split out of the former `design.md` were checked against the code on 2026-10-12; where they differ, the code is the source of truth and the document should be corrected. They were moved without changes to their content and are due a review.

**Applies to** says who the rules bind. *All apps*: the rule is shared (colour values are always per app; see each document). *Reminderly only*: another app does not adopt it. *Mixed*: the document says which parts are which.

| Document | Covers | Applies to | Status |
|----------|--------|------------|--------|
| [overlay-standards.md](./overlay-standards.md) | Centred overlays: two-zone principle, geometry, spacing, buttons, scrolling, toggles, accessibility, tutorials, screen sizes, checklist; Reminderly appendix | All apps (sections 1 to 10, and the introduction; section 11 is the version history); Reminderly only (appendix) | v1.4.3, 2026-11-03, reviewed |
| [colour-standards.md](./colour-standards.md) | Every colour as Name = Hex with role and evidence; colour roles shared across apps | Mixed: roles shared, values per app; category and tutorial colours Reminderly only | v1.0, 2026-11-03, reviewed |
| [typography-standards.md](./typography-standards.md) | Lato files and weights as rendered, type scale, font metrics | Mixed: font rules shared where an app adopts Lato; Reminderly's type scale Reminderly only | v1.0, 2026-11-03, reviewed |
| [layout-and-spacing-standards.md](./layout-and-spacing-standards.md) | Common spacing values, layout and responsiveness | Mixed: spacing values shared; pill and tutorial heights Reminderly only | Moved, review due |
| [panel-standards.md](./panel-standards.md) | Main and slide-up panel spacing, bottom sheets | Mixed: to be classified in the review | Moved, review due |
| [controls-standards.md](./controls-standards.md) | Pills, rows, buttons, toggles | Mixed: toggle standard shared; pills and rows Reminderly only | Moved, review due |
| [tutorial-phone-standards.md](./tutorial-phone-standards.md) | Tutorial phone sizing and ownership | Reminderly only | Moved, review due |
| [motion-standards.md](./motion-standards.md) | Sheet and list motion | Mixed: to be classified in the review | Moved, review due |
| [overlay-pilot-reference.md](./overlay-pilot-reference.md) | Measured reference values for one confirmation dialog and one scrolling overlay at the four sizes; pass or fail basis for an app's pilot | All apps (comparison basis) | v1.0, 2026-11-03, approved by John |
| [font-rendering-validation.md](./font-rendering-validation.md) | Procedure to prove another app's Lato files and rendering match Reminderly's, and recalculate if not | All apps | v1.0, 2026-11-03, approved by John |

Record new UI standards here, as a new document or in the document that owns the topic.
