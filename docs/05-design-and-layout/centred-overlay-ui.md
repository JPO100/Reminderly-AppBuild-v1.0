# Centred overlay UI specification

## Overview

All centred overlays (user-facing and Dev tools) follow one spacing standard. There is no shared modal wrapper component. Each overlay is built inline using the same CSS structure.

### Overlay standard

| Space | Value |
|---|---|
| Card width | `340px` |
| Card padding top / bottom | `40px` |
| Card padding left / right | `30px` |
| Screen edge to card (minimum) | `20px` (`px-[20px]` on the centring wrapper) |
| Title (if any) to content, or to the first button | `40px` |
| Between content sections (for example content to buttons) | `40px` |
| Between content elements within a section (for example due line and detail lines, toggle rows) | `30px` |
| Above and below a separator line | `30px` |
| Between buttons (stacked or side by side) | `30px` |
| Title wrapping | Titles wrap onto multiple lines (no ellipsis) |

Typical implementation: card `gap-[40px]` when it holds title and sections only. Where content elements sit directly in the card (ReminderInfoOverlay), the card uses `gap-[30px]` with `mb-[10px]` on the title and `mt-[10px]` on the buttons container to give 40px.

---

## 1. Overlay/backdrop (all centred overlays)

| Property | Value |
|---|---|
| Position | `fixed inset-0` |
| z-index | `z-[60]` (60) |
| Background | `bg-black/50` (black at 50% opacity, equivalent to `rgba(0, 0, 0, 0.5)`) |
| Click to dismiss | Yes. Backdrop div has `onClick` handler that closes the overlay |
| Pointer events | Enabled on backdrop (default). Disabled on the centering container via `pointer-events-none`, re-enabled on the modal card via `pointer-events-auto` |

Implementation: two sibling `div` elements at the same z-index.

```
div.fixed.inset-0.bg-black/50.z-[60]  ← backdrop (clickable)
div.fixed.inset-0.z-[60].flex.items-center.justify-center.pointer-events-none  ← centring wrapper
  div.pointer-events-auto  ← modal card
```

Every centring container includes `px-[20px]` so the card stays at least 20px from the screen edge on narrow viewports.

---

## 2. Modal container

| Property | Value |
|---|---|
| Width | `340px` (inline style `{ width: 340 }`) on every centred overlay |
| Corner radius | `rounded-[32px]` |
| Background | `bg-white` |
| Padding | `pt-[40px] pb-[40px] px-[30px]` (or `py-[40px] px-[30px]`) |
| Layout | `flex flex-col items-center` |
| Gap | `40px` between title and sections. ReminderInfoOverlay: `30px` with title `mb-[10px]` and buttons `mt-[10px]` |
| Click propagation | `onClick={(e) => e.stopPropagation()}` |

Used by: ReminderInfoOverlay, DeletedInfoOverlay, saved list menu, template editor menu, InfoOverlay, ListInfoOverlay, DevToolsInfoOverlay and the Dev tools confirmation dialogs (NLC, onboarding, notifications, reminders, lists, Dev tools home).

Dev tools confirmation dialogs keep side-by-side Cancel (`#BABABA`) and Confirm (`#4784F8`) buttons. Body text stays `Lato:SemiBold` 17px `#939393`.

---

## 3. Text styling

### Modal title (all patterns)

| Property | Value |
|---|---|
| Font family | `'Lato:Bold', sans-serif` |
| Font size | `20px` (`text-[20px]`) |
| Font weight | `700` (inline style) |
| Line height | `normal` (`leading-[normal]`) |
| Colour | `#1C2C42` (`text-[#1C2C42]`) |
| Alignment | `text-center` |
| Width | Content-width, shrink-0 |
| Margins | None |
| Padding | None |
| Wrapping | `whitespace-pre-wrap` on every overlay title, including list titles |
| Not italic | `not-italic` |

### Due line / status subtitle (ReminderInfoOverlay only)

| Property | Value |
|---|---|
| Font family | `'Lato:Bold', sans-serif` |
| Font size | `17px` (`text-[17px]`) |
| Font weight | `700` (inline style) |
| Line height | `normal` |
| Colour | `#1C2C42` (default) or `#FF0000` (overdue) |
| Alignment | `text-center` |
| Width | Full width container with `min-w-full` |
| Wrapping | `whitespace-nowrap` |

### Metadata lines (smart reminder progress, repeats — ReminderInfoOverlay)

| Property | Value |
|---|---|
| Font family | `'Lato:Bold', sans-serif` |
| Font size | `17px` |
| Font weight | `700` |
| Line height | `normal` |
| Colour | `#BABABA` (`text-[#bababa]`) |
| Alignment | `text-center` |
| Wrapping | `whitespace-pre-wrap` |

### Confirmation body text (dev tools confirmation dialogs)

| Property | Value |
|---|---|
| Font family | `'Lato:SemiBold', sans-serif` |
| Font size | `17px` |
| Font weight | Inherited from SemiBold face (600) |
| Line height | `normal` |
| Colour | `#939393` (`text-[#939393]`) |
| Alignment | `text-center` |
| Wrapping | `whitespace-pre-wrap` |

### DevToolsInfoOverlay body text

| Property | Value |
|---|---|
| Font family | `'Lato:Bold', sans-serif` |
| Font size | `17px` |
| Font weight | `700` |
| Line height | `24px` (inline style) |
| Colour | `#BABABA` (`text-[#BABABA]`) |
| Alignment | `text-center` |
| Wrapping | `whitespace-pre-wrap` |

### Button labels (all buttons)

| Property | Value |
|---|---|
| Font family | `'Lato:Bold', sans-serif` |
| Font size | `17px` |
| Font weight | `700` (inherited from Lato:Bold face) |
| Line height | `normal` |
| Colour | `#FFFFFF` (white) |
| Alignment | Centred (via flex) |
| Wrapping | `whitespace-nowrap` |

---

## 4. Icons (inside centred overlays)

### Smart reminder icon (bell)

| Property | Value |
|---|---|
| SVG viewBox | `0 0 19.5002 21.5002` |
| Container size | `w-[19px] h-[21px]` |
| Fill colour | `#BABABA` |
| Positioning | Flex centred within row, `items-center justify-center` |
| Spacing from text | `8px` (parent has `gap-[8px]`) |

### Repeats icon (clock)

| Property | Value |
|---|---|
| SVG viewBox | `0 0 15 15` |
| Container size | `w-[21px] h-[21px]` |
| Display size | `width="21" height="21"` |
| Fill colour | `#BABABA` |
| Stroke | `#BABABA`, strokeWidth `0.1` |
| Positioning | Flex centred within row |
| Spacing from text | `8px` (parent has `gap-[8px]`) |

### Copy feedback icon (template/list creation confirmation)

| Property | Value |
|---|---|
| SVG size | `width="20" height="20"` |
| Fill colour | `white` |
| Gap from text | `12px` (`gap-[12px]`) |
| Alignment | Centred inline with text |

---

## 5. Button layout

### Stacked full-width buttons (all other overlays)

| Property | Value |
|---|---|
| Button width | `w-full` (100% of modal content width) |
| Button height | `50px` (`h-[50px]`) |
| Border radius | `100px` (`rounded-[100px]`) — fully rounded pill |
| Layout direction | Column (`flex-col`) |
| Gap between buttons | `30px` (`gap-[30px]`) |
| Alignment | `items-start` (container), button content centred |
| Container spacing | 40px from the title or last content section (see overlay standard) |
| Internal padding | `px-[18px] py-[15px]` |
| Button border | `border-none` (on some variants) |

#### Primary button

| Property | Value |
|---|---|
| Background | `#4784F8` (`bg-[#4784f8]`) |
| Text colour | White |

#### Destructive/secondary button (delete)

| Property | Value |
|---|---|
| Background | `#939393` (`bg-[#939393]`) |
| Text colour | White |

#### Disabled button

| Property | Value |
|---|---|
| Background | `#D9D9D9` (`bg-[#d9d9d9]`) |
| Cursor | Default (no pointer) |

### Side-by-side buttons (Dev tools confirmation dialogs)

| Property | Value |
|---|---|
| Layout direction | Row (`flex`) |
| Gap between buttons | `30px` (`gap-[30px]`) |
| Justify | `justify-between` |
| Width | Full container width |
| Button width | Auto (content-sized) |
| Button height | `50px` |
| Border radius | `100px` |
| Button padding | `px-[16px]` |

#### Cancel button

| Property | Value |
|---|---|
| Background | `#BABABA` (inline style) |
| Text colour | White |

#### Confirm button

| Property | Value |
|---|---|
| Background | `#4784F8` (inline style) |
| Text colour | White |

---

## 6. Element spacing

| Overlay | Layout |
|---|---|
| ReminderInfoOverlay | Title, 40px, due line, 30px, smart reminder line, 30px, repeats line, 40px, buttons (30px apart) |
| DeletedInfoOverlay | Title, 40px, buttons (30px apart) |
| Saved list menu / template editor menu | Title, 40px, buttons (30px apart) |
| InfoOverlay (list settings) | Title, 40px, toggle rows (30px apart), 40px, buttons (30px apart) |
| ListInfoOverlay | Title, 40px, smart reminder row (when shown), 40px, buttons (30px apart) |
| Reminders and Lists settings | Centred title (back arrow on the left on sub-pages), 40px, setting rows (30px apart): toggle rows first (Reminders: Show calendar, Use Siri shortcuts, 1 minute time increments. Lists: Use Smart Reminders, Use Siri shortcuts. Lists click-through rows: Haptic feedback, Sounds), then click-through rows, then the tutorial row last ("Reminders tutorial" or "Lists tutorial", shown when onboarding is enabled in Dev tools). The tutorial row uses the click-through row chevron (7 x 13px, #939393, 15px right inset) rotated to point up. No separator or subtitle. No close button; tap outside to close. Card scrolls if taller than the screen |
| DevToolsInfoOverlay | Title, 40px, body text, 40px, Close button |
| Dev tools confirmation dialogs | Title, 40px, body text, 40px, Cancel and Confirm side by side (30px apart) |

All overlays: 40px top and bottom padding, 30px side padding, minimum 20px from the screen edge.

---

## 7. Animation behaviour

No entry/exit animation is used on the centred overlay modals themselves. They appear and disappear instantly (no framer-motion, no CSS transition on the container).

The only transitions present are within button content:
- Template "use as list" button text: opacity fade `150ms` / `250ms` ease
- Template button background: `background-color 150ms ease`
- Smart reminder due date highlight: `color 300ms` transition

Background scroll is locked on mount via `document.body.style.overflow = 'hidden'` (ReminderInfoOverlay only).

---

## 8. Implementation locations

| Overlay | File |
|---|---|
| ReminderInfoOverlay | `src/app/components/ReminderInfoOverlay.tsx` |
| DeletedInfoOverlay | `src/imports/deleted-info-overlay.tsx` |
| InfoOverlay (list settings) and wrapper | `src/imports/InfoOverlay.tsx`, wrapper inline in `src/app/App.tsx` |
| ListInfoOverlay and wrapper | `src/imports/list-info-overlay.tsx`, wrapper inline in `src/app/App.tsx` |
| Saved list menu, template editor menu | Inline in `src/app/App.tsx` |
| Reminders and Lists settings | Overlay inline in `src/app/App.tsx`, content in `src/app/components/SettingsPanelContent.tsx` |
| DevToolsInfoOverlay | `src/app/components/DevToolsOverlay.tsx` |
| Dev tools confirmation dialogs | `src/app/components/DevToolsOverlay.tsx` (5), `src/imports/DevTools.tsx` (1) |

---

## 9. Inconsistencies

None known. All centred overlays follow the overlay standard in the overview (standardised 2026-10-10).

---

## 10. Toggle rows inside centred overlays

### Toggle row container

The toggle row is the parent div that wraps icon + label + toggle in a horizontal line.

| Property | Value |
|---|---|
| Width | `w-full` (100% of modal content area) |
| Display | `flex` (row, default direction) |
| Flex direction | Row (default, not explicitly set) |
| Alignment (cross-axis) | `items-start` |
| Justification (main-axis) | `justify-center` |
| Padding | None |
| Margin | None |
| Gap | `16px` (`gap-[16px]`) between icon, label block, and toggle |
| Border/radius | None |
| Background | None (transparent) |
| Cursor | `cursor-pointer` (entire row is clickable) |
| Other | `content-stretch relative shrink-0` |

Implementation reference (InfoOverlay.tsx line 86, line 109, line 124; list-info-overlay.tsx line 54):
```
className="content-stretch flex gap-[16px] items-start justify-center relative shrink-0 w-full cursor-pointer"
```

### Toggle rows wrapper

Multiple toggle rows are grouped in a container with vertical gap:

| Property | Value |
|---|---|
| Display | `flex flex-col` |
| Gap | `30px` (`gap-[30px]`) between rows |
| Width | `w-full` |
| Alignment | `items-start` |
| Other | `content-stretch relative shrink-0` |

Implementation reference (InfoOverlay.tsx line 83, line 108; list-info-overlay.tsx line 53):
```
className="content-stretch flex flex-col gap-[30px] items-start relative shrink-0 w-full"
```

### Toggle label block

The label block sits between the icon and the toggle, taking remaining space via `flex-[1_0_0]`.

Label container:

| Property | Value |
|---|---|
| Display | `flex flex-col` |
| Flex | `flex-[1_0_0]` (fills remaining horizontal space) |
| Font family | `'Lato:Bold', sans-serif` (set on container, inherited) |
| Gap | `9px` (`gap-[9px]`) between title and subtitle |
| Alignment | `items-start justify-start` |
| Line height | `leading-[0]` (container-level reset, overridden per text element) |
| Min dimensions | `min-h-px min-w-px` |
| Not italic | `not-italic` |
| Position | `relative` |

Implementation reference (InfoOverlay.tsx line 8, 21, 34; list-info-overlay.tsx line 8):
```
className="content-stretch flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] gap-[9px]
  items-start justify-start leading-[0] min-h-px min-w-px not-italic relative
  ${active ? '' : 'text-[#d9d9d9]'}"
```

Title text:

| Property | Value |
|---|---|
| Font family | Inherited: `'Lato:Bold', sans-serif` |
| Font size | `17px` (`text-[17px]`) |
| Font weight | `700` (inline style) |
| Line height | `17px` (`leading-[17px]`) |
| Colour (active/on) | `#1C2C42` (`text-[#1C2C42]`) |
| Colour (inactive/off) | `#D9D9D9` (inherited from parent `text-[#d9d9d9]`) |
| Alignment | Left (default, `justify-start`) |
| Wrapping | `whitespace-nowrap` |
| Truncation | `overflow-hidden text-ellipsis` on both container and `<p>` |
| Width | `w-full` |
| Margin/padding | None |

Implementation reference (InfoOverlay.tsx line 9-10):
```
<div className="flex flex-col justify-start overflow-hidden relative shrink-0 text-[17px]
  text-ellipsis w-full whitespace-nowrap ${active ? 'text-[#1C2C42]' : ''}">
  <p className="leading-[17px] overflow-hidden text-ellipsis" style={{ fontWeight: 700 }}>
    ...title...
  </p>
</div>
```

Subtitle text:

| Property | Value |
|---|---|
| Font family | Inherited: `'Lato:Bold', sans-serif` |
| Font size | `14px` (`text-[14px]`) |
| Font weight | `700` (inline style) |
| Line height | `14px` (`leading-[14px]`) |
| Colour (active/on) | `#BABABA` (`text-[#bababa]`) |
| Colour (inactive/off) | `#D9D9D9` (inherited from parent) |
| Alignment | Left (default) |
| Wrapping | Default (wraps naturally) |
| Width | `w-full` |
| Margin/padding | None |
| Spacing from title | `9px` (from parent `gap-[9px]`) |

Implementation reference (InfoOverlay.tsx line 12-13):
```
<div className="flex flex-col justify-start relative shrink-0 text-[14px] w-full
  ${active ? 'text-[#bababa]' : ''}">
  <p className="leading-[14px]" style={{ fontWeight: 700 }}>...subtitle...</p>
</div>
```

Smart reminder subtitle has additional dynamic colour behaviour:
- When highlight active: colour transitions to `#1C2C42`
- Fade-out transition: `color 300ms` (applied via inline style when `animateFadeOut` is true)

### Toggle row spacing

| Between | Value |
|---|---|
| Left edge of modal content to icon | `0px` (icon sits at left edge of content area; modal padding of 30px provides the margin from modal edge) |
| Icon to text block | `16px` (from row `gap-[16px]`) |
| Text block to toggle | `16px` (from row `gap-[16px]`) |
| Toggle to right edge of modal content | `0px` (toggle sits at right edge of content area; modal padding of 30px provides the margin) |
| Between multiple toggle rows | `30px` (from wrapper `gap-[30px]`) |
| Title to subtitle within label | `9px` (from label container `gap-[9px]`) |
| Toggle rows section to modal title | `40px` (from modal `gap-[40px]`) |
| Toggle rows section to buttons section | `40px` (from modal gap) |

No responsive behaviour. Fixed dimensions throughout.

### Toggle control

The `ToggleButton` component is identical in both files.

Dimensions and shape:

| Property | Value |
|---|---|
| Overall width | `56px` (`w-[56px]`) |
| Overall height | `30px` (`h-[30px]`) |
| Border radius | `37.5px` (`rounded-[37.5px]`) — fully rounded pill |
| Padding/inset | `3.75px` (`p-[3.75px]`) — uniform on all sides |
| Border | None |
| Shadow | None |
| Element type | `<button>` |
| Self alignment | `self-start` |
| Shrink | `shrink-0` |

Track colours:

| State | Background |
|---|---|
| Off | `#D9D9D9` (`bg-[#d9d9d9]`) |
| On | `#4784F8` (`bg-[#4784F8]`) |

Knob:

| Property | Value |
|---|---|
| Size | `22.5px x 22.5px` (`size-[22.5px]`) |
| Shape | Circle (SVG `<circle>` with `r="11.25"`) |
| Colour | White (`fill="var(--fill-0, white)"`) |
| Implementation | SVG-based. A `<div>` container holds an `<svg>` with a single `<circle>` element |
| SVG viewBox | `0 0 22.5 22.5` |
| SVG positioning | `absolute block size-full` within the knob container |

Knob positioning mechanism:

| Property | Value |
|---|---|
| Mechanism | Flexbox `justify-end` vs default (justify-start) |
| Container display | `flex` with `items-center` |
| Off position | Default flex start (knob at left, 3.75px from left edge) |
| On position | `justify-end` (knob at right, 3.75px from right edge) |
| Transition | None. No `transition` class or inline style. State change is instant |

Interaction handling:

| Property | Value |
|---|---|
| onClick | Calls `event.stopPropagation()` then invokes the toggle callback |
| Cursor | `cursor-pointer` |

Implementation reference (InfoOverlay.tsx lines 45-54; list-info-overlay.tsx lines 19-28):
```jsx
<button className={`${active ? 'bg-[#4784F8] justify-end' : 'bg-[#d9d9d9]'}
  content-stretch cursor-pointer flex h-[30px] items-center self-start
  p-[3.75px] relative rounded-[37.5px] shrink-0 w-[56px]`}
  onClick={(event) => { event.stopPropagation(); onClick(); }}>
  <div className="relative shrink-0 size-[22.5px]">
    <svg className="absolute block size-full" fill="none"
      preserveAspectRatio="none" viewBox="0 0 22.5 22.5">
      <circle cx="11.25" cy="11.25" fill="var(--fill-0, white)" r="11.25" />
    </svg>
  </div>
</button>
```

### Toggle interaction states

| State | Track colour | Knob position | Knob colour | Text colour (title) | Text colour (subtitle) | Icon colour |
|---|---|---|---|---|---|---|
| On (active) | `#4784F8` | Right (`justify-end`) | White | `#1C2C42` | `#BABABA` | `#1C2C42` |
| Off (inactive) | `#D9D9D9` | Left (default) | White | `#D9D9D9` | `#D9D9D9` | `#D9D9D9` |

No hover, pressed, focus, or disabled states are implemented on the centred overlay toggle. There is no `transition` on the toggle track colour or knob position — state changes are instant.

The entire row is clickable (row div has `cursor-pointer` and an `onClick` handler), but the toggle button's `onClick` calls `event.stopPropagation()` to prevent double-firing.

There is no disabled state for the centred overlay toggle. The dev tools ToggleRow component has a disabled state but that is a separate implementation not used in centred overlays.

### Row icon (left side)

Each toggle row has an icon on the left side. These are SVG icons that change colour based on active state.

| Property | Value |
|---|---|
| Active colour | `#1C2C42` |
| Inactive colour | `#D9D9D9` |
| Positioning | `relative self-start shrink-0` |
| Top offset | `top-[1px]` (smart reminder icon only, for optical alignment) |

Icon sizes vary per row:

| Icon | Width | Height | viewBox |
|---|---|---|---|
| Smart reminder (bell) | `19.5px` | `21.5px` | `0 0 19.5002 21.5002` |
| Insertion order | `20.83px` | `20.824px` | `0 0 20.8301 20.8242` |
| Alphabetical | `22.387px` | `20.814px` | `0 0 22.3867 20.8145` |

### Toggle implementation references

| Component | File | Lines | Role | Canonical? |
|---|---|---|---|---|
| `ToggleButton` | `src/imports/InfoOverlay.tsx` | 45-54 | Toggle control | Yes (canonical) |
| `ToggleButton` | `src/imports/list-info-overlay.tsx` | 19-28 | Toggle control | Yes (identical copy) |
| `SmartRemindersLabel` | `src/imports/InfoOverlay.tsx` | 6-16 | Label with dynamic subtitle | Yes |
| `SmartRemindersLabel` | `src/imports/list-info-overlay.tsx` | 6-16 | Label with dynamic subtitle | Yes (identical copy) |
| `AlphabeticalLabel` | `src/imports/InfoOverlay.tsx` | 19-29 | Static label variant | Yes |
| `InsertionLabel` | `src/imports/InfoOverlay.tsx` | 32-42 | Static label variant | Yes |
| `Frame3` (toggle rows wrapper) | `src/imports/InfoOverlay.tsx` | 57-142 | 3-row layout (smart + 2 sort) | Yes |
| `Frame3` (toggle rows wrapper) | `src/imports/list-info-overlay.tsx` | 31-74 | 1-row layout (smart only) | Yes (subset variant) |

### Toggle inconsistencies

The centred overlay toggle implementation is fully consistent across both files. The only difference is that ListInfoOverlay omits the sort-order rows (alphabetical, insertion) since those are not relevant to the list info context. The toggle control and label components are identical.

---

## 11. Canonical pattern

Use the overlay standard in the overview for every new centred overlay.
