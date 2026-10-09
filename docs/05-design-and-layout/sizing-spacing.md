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

### Panel standards

Applies to the main Reminders and Lists panels and every slide-up panel (Reminders and Lists settings, Templates, Lists editor, New and edit reminder, Repeats, Dev tools). Centred popup dialogs and the onboarding tutorial are excluded.

- **Top padding**: 26px
- **Header**: 45px high, title left, 45 x 45 button(s) right. Main panels use the filters row as the header
- **Close button**: 45 x 45 blue (#4784F8) circle with a white cross
- **Header to content**: 26px. No separator line below the header
- **Content to bottom button**: 24px (New reminder, New list, Templates)
- **Bottom space**: 24px from the last element (button or content) to the bottom of the screen. Exception: Reminders and Lists done/deleted pages have 0px
- **Top corners**: 15px (top left and top right) on every panel
- **Horizontal padding**: 20px on the main panels and Dev tools, 24px on the other slide-up panels
- **Content max-width**: 768px
- **Main panel min-height**: 350px

Where a container gap also spaces other content (for example the list above a bottom button, or Dev tools sections), header spacing is adjusted with a margin on the header instead of changing the shared gap.

Known exception: the Lists editor content sits 30px below the header subtitle (about 44px below the 45px title row). Not yet standardised.

### Row menu (3-dot) button

- When the settings menu is on, row 3-dot buttons are inset 11.5px from the right (`RowMenuButton` `alignWithSettingsButton`) so the dots centre under the 45px button at the top right of the panel
- Applies to Reminders and Lists rows, both done/deleted pages and Templates
- Unchanged when the settings menu is off

### Settings panels

- Toggle rows first, then click-through rows. System settings section last, after a separator

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
