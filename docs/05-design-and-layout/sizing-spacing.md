# Sizing and Spacing

Content from `/docs/sizing-spacing.md`.

## Spacing System

Reminderly uses a systematic spacing scale based on multiples of 4px and specific design requirements.

## Common Spacing Values

- **4px**: Minimum gap (e.g. title-to-subtitle)
- **10px**: List item gap
- **16px**: Filter button horizontal padding, row element gap
- **20px**: Standard horizontal padding, card padding
- **24px**: Premium section top padding
- **26px**: Overlay header top padding
- **30px**: Premium feature row gap
- **32px**: Card gap, premium section bottom padding
- **40px**: Tutorial navigation gap
- **45px**: Filter button height

## Component Spacing

### Reminder Rows

- **Height**: 51px
- **Padding**: 13px 1px
- **Gap**: 16px between circle, text, and icon
- **Title-to-subtitle gap**: 4px
- **Circle marginTop**: 3px (when subtitles visible)

### Filter Buttons

- **Height**: 40px
- **Horizontal padding**: 16px
- **Border-radius**: 100px (pill shape)
- **Gap**: `justify-between` (auto-calculated)

### Tutorial Phone

- **Owner**: `TutorialPhoneShell.tsx`
- **Phone max-width**: 308px
- **Phone height**: 361px
- **Bezel padding**: 14px top/left/right
- **Shell / bezel colours**: controlled centrally by `TutorialPhoneShell.tsx`
- **Header sizing and logo/menu placement**: controlled centrally by `TutorialPhoneHeader.tsx`
- **Filter row spacing and pill layout**: controlled centrally by `TutorialReminderFilters.tsx`
- **Page files do not own tutorial phone shell sizing or frame spacing**

### Overlays

- **Top padding**: 26px
- **Horizontal padding**: 20px
- **Content max-width**: 768px
- **Border-radius**: 20px (top corners)

### White Card

- **Padding**: 20px
- **Gap**: 32px (between sections)
- **Border-radius**: 20px 20px 0 0 (top corners only)
- **Min-height**: 350px

### List Container

- **Gap**: 10px between reminder rows
- **Border-radius**: 10px
- **Max-width**: 768px

## Typography Sizing

### Reminder Text

- **Title**: 17px Lato Bold
- **Subtitle**: 13.5px Lato SemiBold

### Empty States

- **Message**: 17px Lato

### Buttons

- **Filter buttons**: 14px Lato Bold
- **CTA buttons**: 17px Lato Bold

## Touch Targets

Minimum sizes for interactive elements:

- **Filter buttons**: 45px height
- **Circle checkbox**: 25px × 25px
- **New reminder button**: 40-60px height (viewport-responsive)
- **Status icons**: Varies by icon, all meet minimum

## Responsive Adjustments

### iPhone SE (< 390px Width)

- "Sometime" button hidden (spacing adjusts automatically via `justify-between`)

### iPhone SE (667px Height)

- Premium feature row gap: 24px (reduced from 30px)
- Tutorial navigation spacing adjustments
- Settings row alignment changes (affects vertical spacing)

## Related Documentation

- [Responsive Layout](./responsive-layout.md) - Responsive breakpoints
- [Component Hierarchy](./component-hierarchy.md) - Component structure
- [Content Overlay Responsive](./content-overlay-responsive.md) - Overlay spacing pattern

For full details, see original `/docs/sizing-spacing.md`.
