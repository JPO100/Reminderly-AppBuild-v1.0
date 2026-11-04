# Layout and spacing standards

Visual conventions as implemented, checked against the code on 2026-10-12. Where they differ, the code is the source of truth and this document should be corrected. Part of the [design standards](./README.md).

## Spacing and sizing

Common values: 4px (title to subtitle), 10px (list gaps), 16px (pill padding, row gaps), 20px (panel side padding), 24px (panel top and bottom spacing), 30px and 40px (see the overlay standard), 45px (header, pill and button height), 60px (CTA height). Panel values: see [panel-standards.md](./panel-standards.md).

## Layout and responsiveness

- Mobile-first, designed at 402 x 874 (iPhone 16 Pro). The iOS app is portrait only.
- Content is centred with a 768px maximum width.
- Width: below 390px the Sometime pill hides (settings menu off); below 375px pill padding reduces.
- Height: below about 667px some tutorial spacing reduces; below 570px the tutorial switches to auto height and hides its dots. The calendar view needs at least 852pt.
- Centred overlay clearances and screen-size behaviour: see [design-standards/overlay-standards.md](./overlay-standards.md).
