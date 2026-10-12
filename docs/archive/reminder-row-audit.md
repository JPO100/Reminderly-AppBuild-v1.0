# Reminder row implementation audit

Reference file: `src/app/App.tsx`
Supporting file: `src/app/components/icons/ReminderStateIcons.tsx`

## 1. Row architecture

### List container

Location: App.tsx:4621

```
div.flex.flex-col.gap-[23px].w-full
  style: position: relative, zIndex: 1
```

23px vertical gap between rows. No dividers, no separators, no alternating backgrounds.

### Animation wrapper

Location: App.tsx:4636-4651

Each row is wrapped in a `motion.div` (framer-motion) with:
- `layout` prop for reorder animation
- `initial`: `{ opacity: 0 }` if reinserted, else `false`
- `animate`: `{ opacity: 1 }`
- `exit`: `{ opacity: 0 }`
- Transition: reinserted uses `opacity: { duration: 0.2 }`, normal uses `layout: { duration: 0.25 }`
- `onAnimationComplete`: clears reinsertedId state
- Key: `reminder.id`
- The AnimatePresence is keyed on `${viewMode}-${activeFilter}`

### Row outer structure

Location: App.tsx:4652-4743

```
div.content-stretch.flex.items-start.justify-between.px-px.relative.w-full       ← row outer
  div.flex-[1_0_0].min-h-px.min-w-px.relative                                    ← flex wrapper
    div.flex.flex-row.items-start.size-full                                        ← inner flex
      div.content-stretch.flex.gap-[16px].items-start.pr-[16px].relative.w-full   ← checkbox+text
        button (checkbox)                                                          ← 25x25 circle
        div (text container)                                                       ← title + subtitle
  RowMenuButton                                                                    ← 3-dot menu
```

Key measurements:
- Row outer: `px-px` = 1px horizontal padding each side
- Checkbox-to-text gap: 16px
- Text container right padding: `pr-[16px]` (16px before the menu button)
- No row-level vertical padding
- No hover or active state styling
- No pressed/tap state styling

## 2. Icon implementation

### Pending state circle (completed/deleting)

Source: `src/app/components/icons/ReminderStateIcons.tsx:10-19`

Component: `CompletedCircleIcon`

```tsx
<svg viewBox="0 0 25 25" fill="none" className="absolute block size-full">
  <rect fill={color} height="23" rx="11.5" width="23" x="1" y="1" />
  <rect stroke={color} strokeWidth="2" height="23" rx="11.5" width="23" x="1" y="1" />
  <path d={doneCirclePaths.p1bc11a00} fill="white" />
</svg>
```

- Filled rounded rect with checkmark path in white
- Colour is `pendingColour`:
  - Pending delete: `#939393` (DELETED_GREY)
  - Pending done (lists enabled): `#3F3F3F`
  - Pending done (lists disabled): `#4784F8` (DONE_BLUE)

### Active state circle (not pending)

Source: App.tsx:4666-4668

```tsx
<svg className="absolute block size-full" fill="none" viewBox="0 0 25 25">
  <circle cx="12.5" cy="12.5" fill="white" r="11.5" stroke={circleColour} strokeWidth="2" />
</svg>
```

- White-filled circle with 2px coloured stroke
- No fill animation, no scale animation
- `circleColour` = overdue ? `#FF0000` : `CATEGORY_COLOURS[category]` (fallback `#939393`)

### Checkbox button container

Location: App.tsx:4657-4670

```
button.relative.shrink-0.size-[25px].cursor-pointer.flex.items-center.justify-center
  style: padding: 0, background: none, border: none, lineHeight: 0, marginTop: 3px
```

- Fixed 25x25px
- 3px top margin (aligns circle with first line of text)
- SVG is `absolute block size-full` (fills the 25x25 container)

### Smart reminder indicator

Location: App.tsx:392-408

```
svg width=13 height=14 viewBox="0 0 13 15" className="shrink-0" aria-hidden
```

- Sparkle/wand icon
- Default colour: `#BABABA`
- 13x14px rendered size

### Repeat reminder indicator

Location: App.tsx:410-424

```
svg width=15 height=15 viewBox="0 0 15 15" className="shrink-0" aria-hidden
```

- Circular arrows with clock icon
- Default colour: `#BABABA`
- 15x15px rendered size
- Has stroke in addition to fill: `stroke={color} strokeWidth="0.1"`

### Indicator container

Location: App.tsx:4731

```
div.flex.items-center.gap-[6px].h-0.overflow-visible.shrink-0.self-center.pl-[6px]
```

- `h-0` with `overflow-visible`: indicators render visually but take no vertical space
- 6px gap between smart and repeat icons when both present
- 6px left padding separating from subtitle text
- Only rendered when `isSmartReminder || reminder.repeatRule`

## 3. Title implementation

### Title outer div

Location: App.tsx:4680

```
div.overflow-hidden.whitespace-nowrap
  conditional class: line-through (when isPendingAway)
  style:
    color: isPendingAway ? pendingColour : textColour
    textDecorationColor: isPendingAway ? pendingColour : textColour
    height: 17px
    maxWidth: 100%
    minWidth: 0
```

- Fixed 17px height acts as a clip container
- `overflow-hidden` + `whitespace-nowrap` for single-line display
- Line-through decoration applied at this level (not on the p tag)

### Title text

Location: App.tsx:4681

```
p style:
  display: block
  width: 100%
  minWidth: 0
  fontSize: 17px
  fontWeight: 700
  lineHeight: 17px
  transform: translateY(-1px)
  whiteSpace: nowrap
  overflow: hidden
  textOverflow: ellipsis
  paddingBottom: 2px
  boxSizing: content-box
```

- Font: Lato Bold (set on parent), 17px/17px
- `-1px` vertical translate nudges text up within the 17px clip
- `paddingBottom: 2px` with `content-box` means actual element height is 19px but visible area clipped to 17px by parent
- Text source: `getDisplayTitle(reminder)`

### Title colour logic

Location: App.tsx:4632

```typescript
const textColour = isPendingAway
  ? "#BABABA"
  : (isHighlighted
    ? circleColour
    : (overdue ? OVERDUE_COLOUR : APP_TEXT_DARK_BLUE));
```

Priority order:
1. Pending away (done/delete animation): `#BABABA`
2. Highlighted (just inserted): matches circle colour (category colour)
3. Overdue: `#FF0000`
4. Default: `#1C2C42` (APP_TEXT_DARK_BLUE)

## 4. Subtitle implementation

### Visibility

Location: App.tsx:1774

```typescript
const showSubtitles = !(filtersMenuVariant === 'grouped' && !showDateAndTimeSubtitles);
```

- Hidden only when: grouped filter mode AND date/time subtitles disabled
- In all other modes, subtitles are always shown

### Subtitle outer div

Location: App.tsx:4684

```
div.flex.items-center.overflow-visible
  conditional class: line-through (when isPendingAway)
  style:
    textDecorationColor: isPendingAway ? pendingColour : '#BABABA'
```

- `overflow-visible` allows indicators to render outside bounds
- Line-through applied at this level (matches title pattern)

### Subtitle text

Location: App.tsx:4685

```
p.overflow-hidden.text-ellipsis.whitespace-nowrap
  style:
    fontSize: 14px
    fontWeight: 700
    fontFamily: 'Lato', sans-serif
    lineHeight: 1
    color: isPendingAway ? pendingColour : '#BABABA'
```

- Font: Lato Bold, 14px with lineHeight 1 (= 14px computed)
- Colour: always `#BABABA` unless pending away
- Single-line with ellipsis truncation

### Subtitle content logic

Location: App.tsx:4685-4729

Priority order (first match wins):

1. Smart reminder with linked list and scheduled date:
   - Format: `"{completedCount}/{totalCount} {items}. {dueByLabel}"`
   - Example: `"2/5 items. Due by tomorrow"`

2. Overdue with date, days >= 1:
   - Format: `"{N} {day|days} overdue"` optionally followed by `". {repeatText}"`
   - Example: `"3 days overdue"` or `"1 day overdue. Every week"`

3. Has repeat rule with scheduled date:
   - Format: `"{nextOccurrenceLabel}. {repeatText}"` if both available
   - Fallback: `formatRepeatLabel(...)` output
   - Example: `"Tomorrow. Every week"`

4. Scheduled with date:
   - Format: `"{dateLabel}"` or `"{dateLabel} at {time12h}"`
   - Example: `"Today"` or `"Tomorrow at 3:00 PM"`

5. Default: `"No date / time set"`

## 5. Title/subtitle relationship

### Text container

Location: App.tsx:4672-4673

```
div.flex.flex-[1_0_0].flex-col.font-['Lato:Bold',sans-serif].justify-start.min-h-px.min-w-0.not-italic.overflow-visible.relative.cursor-pointer
  style:
    transition: color 300ms
    gap: 9px
    minHeight: 38px
```

- Vertical flex column
- 9px gap between title and subtitle
- 38px minimum height (accommodates title-only rows: 17px title + enough space for alignment)
- `overflow-visible` allows subtitle indicators to extend beyond bounds
- `min-w-0` enables text truncation within flex layout
- `transition: color 300ms` animates colour changes (e.g. when becoming overdue during live refresh)
- Click handler opens the reminder edit overlay

### Vertical measurement breakdown (with subtitle)

```
Title height:     17px (clipped container)
Gap:               9px
Subtitle height:  14px (lineHeight: 1 at 14px fontSize)
────────────────────
Total text:       40px
```

The 38px minHeight is exceeded when subtitle is visible (40px total), so it has no effect. When subtitle is hidden, minHeight ensures the row doesn't collapse below 38px.

### Vertical measurement breakdown (title only)

```
Title height:     17px
minHeight:        38px
────────────────────
Visual:           38px (title vertically starts at top, 21px empty below)
```

## 6. List spacing

### Row-to-row vertical spacing

- Gap: 23px (set on list container)
- No per-row margin or padding
- Consistent regardless of whether subtitle is shown

### Row horizontal layout

```
px-px (1px each side)
  ├── checkbox 25px + marginTop 3px
  ├── gap 16px
  ├── text (flex 1, fills remaining)
  ├── pr-[16px] on checkbox+text container (space before menu)
  └── RowMenuButton 20px wide
```

Total horizontal structure: 1px + 25px + 16px + [text] + 16px + 20px + 1px

### RowMenuButton

Location: App.tsx:272-292

```
button.relative.shrink-0.self-stretch.w-[20px].cursor-pointer.flex.items-center.justify-center
  style: padding: 0, background: none, border: none, lineHeight: 0
  └── div.flex.flex-row.items-center.justify-center.gap-[3px]
        ├── span.block.w-[3.5px].h-[3.5px].rounded-full.bg-[#BABABA]
        ├── span.block.w-[3.5px].h-[3.5px].rounded-full.bg-[#BABABA]
        └── span.block.w-[3.5px].h-[3.5px].rounded-full.bg-[#BABABA]
```

- Fixed 20px wide, self-stretch (full row height)
- Three horizontal dots: 3.5px diameter each, 3px gap between
- Total dot area: (3 x 3.5) + (2 x 3) = 16.5px wide
- Dot colour: `#BABABA` (hardcoded, does not change with state)
- onClick: opens the reminder info/action panel

### Empty state

Location: App.tsx:4749-4757

Rendered when `filtered.length === 0`. Messages per filter:
- all: "No reminders... take it easy!"
- today: "No reminders today... take it easy!"
- this-week: "No reminders this week... take it easy!"
- later/sometime/other: "No reminders... take it easy!"

### Filtering and sorting

- Active reminders only: `completedAt == null && deletedAt == null`, plus items in `pendingDeleteIds`
- Filter "all" shows everything; overdue reminders appear in every filter view
- Filter "other" matches both "later" and "sometime" categories
- Sorted via `sortReminders(filtered, now)`

## 7. Complete measurement inventory

### Sizes (px)

| element | property | value |
|---|---|---|
| list container gap | gap | 23px |
| row outer padding | px-px | 1px each side |
| checkbox size | width/height | 25px |
| checkbox top margin | marginTop | 3px |
| circle SVG stroke | strokeWidth | 2px |
| circle SVG radius | r | 11.5px (23px diameter) |
| completed rect | rx | 11.5px |
| completed rect size | width/height | 23px (at x=1, y=1) |
| checkbox-to-text gap | gap | 16px |
| text container right padding | pr | 16px |
| text container min height | minHeight | 38px |
| title-subtitle gap | gap | 9px |
| title container height | height | 17px |
| title font size | fontSize | 17px |
| title line height | lineHeight | 17px |
| title translateY | transform | -1px |
| title padding bottom | paddingBottom | 2px (content-box) |
| subtitle font size | fontSize | 14px |
| subtitle line height | lineHeight | 1 (14px) |
| menu button width | width | 20px |
| menu dot size | width/height | 3.5px |
| menu dot gap | gap | 3px |
| smart indicator | width/height | 13px / 14px |
| repeat indicator | width/height | 15px / 15px |
| indicator gap | gap | 6px |
| indicator left pad | pl | 6px |

### Colours

| token | hex | usage |
|---|---|---|
| APP_TEXT_DARK_BLUE | #1C2C42 | default title text |
| OVERDUE_COLOUR | #FF0000 | overdue title + circle |
| DONE_BLUE | #4784F8 | pending done circle (lists disabled) |
| DELETED_GREY | #939393 | pending delete circle + text |
| pending done (lists) | #3F3F3F | pending done circle (lists enabled) |
| subtitle text | #BABABA | subtitle default, menu dots, indicators |
| pending away text | #BABABA | title during pending animation |
| category today | #00AFEE | circle stroke |
| category this-week | #E466FD | circle stroke |
| category later | #FDB146 | circle stroke |
| category sometime | #939393 | circle stroke |
| category other | #FDB146 | circle stroke (same as later) |
| circle fill | white | active circle interior |
| completed rect fill | white | checkmark path fill |

### Fonts

| element | family | weight | size | lineHeight |
|---|---|---|---|---|
| title | Lato Bold | 700 | 17px | 17px |
| subtitle | Lato | 700 | 14px | 1 (14px) |

### Animations

| element | property | duration |
|---|---|---|
| text colour | transition | 300ms |
| row layout reorder | layout | 250ms |
| row reinsert fade-in | opacity | 200ms |
| row exit | opacity | (default framer-motion) |

### States

| state | title colour | circle | line-through | subtitle colour |
|---|---|---|---|---|
| default | #1C2C42 | category stroke | no | #BABABA |
| overdue | #FF0000 | #FF0000 stroke | no | #BABABA |
| highlighted (insert) | circleColour | category stroke | no | #BABABA |
| pending done (no lists) | #BABABA | #4784F8 filled | yes | #4784F8 |
| pending done (lists) | #BABABA | #3F3F3F filled | yes | #3F3F3F |
| pending delete | #BABABA | #939393 filled | yes | #939393 |
