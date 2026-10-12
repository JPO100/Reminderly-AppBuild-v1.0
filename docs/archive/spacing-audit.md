# Reminderly panel padding and content spacing audit

## Section 1 - Panel architecture

### Root layout hierarchy

```
Root container (App.tsx:3396)
  ├── Persistence error bar (conditional) (App.tsx:3405)
  ├── Header area (App.tsx:3411)
  │     ├── Logo/title row (App.tsx:3413)
  │     └── Filter pills [non-lists mode only] (App.tsx:3533)
  ├── Tab bar [lists mode only] (App.tsx:3663)
  │     ├── Reminders tab (App.tsx:3666)
  │     └── Lists tab (App.tsx:3690)
  ├── White panel container (App.tsx:3717)
  │     ├── Filter pills [lists mode only] (App.tsx:3326/4326)
  │     ├── Scrollable content area (App.tsx:4454/4023)
  │     │     ├── List cards wrapper (App.tsx:4621/4024)
  │     │     │     └── Individual rows
  │     │     └── Empty state (App.tsx:4749/3836)
  │     └── New button (App.tsx:4832)
  ├── New reminder overlay (App.tsx:4854)
  ├── Lists overlay (App.tsx:4919+)
  ├── Settings overlay
  ├── Repeats overlay
  ├── Reminder info overlay
  ├── Tutorial overlay
  └── Dev tools overlay
```

### Rendering modes

The white panel renders different content based on mode:

1. Reminders active view (`viewMode !== "done-deleted"`, `activeMainTab === 'reminders'`)
2. Reminders done/deleted view (`viewMode === "done-deleted"`, `activeMainTab === 'reminders'`)
3. Lists active view (`activeMainTab === 'lists'`, `viewMode !== 'lists-done'`)
4. Lists done/deleted view (`activeMainTab === 'lists'`, `viewMode === 'lists-done'`)
5. Saved lists panel (`savedListsPanelOpen === true`)

### Filter pills location

- When `isListsEnabled === false`: filter pills render inside the header area (App.tsx:3533), outside the white panel
- When `isListsEnabled === true`: filter pills render inside the white panel container (App.tsx:3326/4326)

---

## Section 2 - White panel spacing implementation

### 2.1 Root container

**Component:** Root div
**File:** `src/app/App.tsx:3396`
**Classes:** `content-stretch flex flex-col items-center h-screen w-full overflow-hidden`
**Inline styles:** `backgroundColor` (dynamic)

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| align-items | center |
| height | 100vh (`h-screen`) |
| width | 100% (`w-full`) |
| overflow | hidden |
| padding | none |
| margin | none |
| gap | none |

### 2.2 Persistence error bar (conditional)

**Component:** Error bar div
**File:** `src/app/App.tsx:3406`
**Classes:** none (inline only)
**Inline styles:** `{ backgroundColor: '#b45309', color: '#fff', textAlign: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: 500, flexShrink: 0, width: '100%' }`

| Property | Value |
|----------|-------|
| padding | 6px 12px |
| flex-shrink | 0 |
| width | 100% |

### 2.3 Header area

**Component:** Header wrapper div
**File:** `src/app/App.tsx:3411`
**Classes:** `app-header relative shrink-0 w-full p-[20px]`

| Property | Value |
|----------|-------|
| padding | 20px (all sides) |
| flex-shrink | 0 |
| width | 100% |
| position | relative |

### 2.4 Header inner content

**Component:** Inner flex column
**File:** `src/app/App.tsx:3412`
**Classes:** `content-stretch flex flex-col gap-[17px] items-start relative w-full max-w-[768px] mx-auto`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| gap | 17px |
| align-items | flex-start |
| width | 100% |
| max-width | 768px |
| margin-left | auto |
| margin-right | auto |

### 2.5 Logo row

**Component:** Logo container
**File:** `src/app/App.tsx:3413`
**Classes:** `content-stretch flex items-center justify-center pb-[20px] pt-[50px] relative shrink-0 w-full`

| Property | Value |
|----------|-------|
| padding-top | 50px |
| padding-bottom | 20px |
| padding-left | 0 |
| padding-right | 0 |
| flex-shrink | 0 |
| width | 100% |

### 2.6 Filter pills container (non-lists mode, in header)

**Component:** Filters menu div
**File:** `src/app/App.tsx:3533`
**Classes:** `filters-menu flex items-center justify-between relative shrink-0 w-full`
**Inline styles:** `{ marginTop: 2 }`
**Condition:** Renders only when `!isListsEnabled`

| Property | Value |
|----------|-------|
| display | flex |
| align-items | center |
| justify-content | space-between |
| flex-shrink | 0 |
| width | 100% |
| margin-top | 2px |

### 2.7 Tab bar (lists mode only)

**Component:** Tab bar container
**File:** `src/app/App.tsx:3664`
**Classes:** `content-stretch flex gap-[10px] items-end justify-center px-[20px] relative w-full`
**Condition:** Renders only when `isListsEnabled === true`

| Property | Value |
|----------|-------|
| display | flex |
| gap | 10px |
| align-items | flex-end |
| justify-content | center |
| padding-left | 20px |
| padding-right | 20px |
| width | 100% |

**Individual tab:**
**Classes:** `flex-[1_0_0] min-h-px min-w-px relative rounded-tl-[12px] rounded-tr-[12px] cursor-pointer h-[52px]`
**Conditional class:** Active: `bg-white`, inactive: `bg-[rgba(255,255,255,0.25)]`

| Property | Value |
|----------|-------|
| flex | 1 0 0 |
| height | 52px |
| border-radius-top-left | 12px |
| border-radius-top-right | 12px |

**Tab inner content:**
**Classes:** `content-stretch flex items-center justify-center px-[30px] relative size-full`

| Property | Value |
|----------|-------|
| padding-left | 30px |
| padding-right | 30px |

### 2.8 White panel container

**Component:** Main white panel
**File:** `src/app/App.tsx:3717`
**Classes:** `bg-white content-stretch flex flex-col gap-[24px] items-center px-[20px] pt-[24px] relative w-full flex-1 min-h-[350px]`
**Conditional classes:**
- Lists enabled: `rounded-tl-[15px] rounded-tr-[15px]`
- Lists disabled: `rounded-tl-[20px] rounded-tr-[20px]`

| Property | Value |
|----------|-------|
| background | #ffffff (`bg-white`) |
| display | flex |
| flex-direction | column |
| gap | 24px |
| align-items | center |
| padding-left | 20px |
| padding-right | 20px |
| padding-top | 24px |
| padding-bottom | 0 (none specified) |
| width | 100% |
| flex | 1 |
| min-height | 350px |
| border-radius-top-left | 15px (lists) / 20px (no lists) |
| border-radius-top-right | 15px (lists) / 20px (no lists) |
| border-radius-bottom | 0 |

### 2.9 Filter pills container (lists mode, inside white panel)

**Component:** Filters menu div
**File:** `src/app/App.tsx:4326` (reminders tab) / `src/app/App.tsx:3721` (lists-done) / `src/app/App.tsx:3919` (lists active)
**Classes:** `filters-menu flex items-center justify-between relative shrink-0 w-full`
**Condition:** Renders only when `isListsEnabled === true`

| Property | Value |
|----------|-------|
| display | flex |
| align-items | center |
| justify-content | space-between |
| flex-shrink | 0 |
| width | 100% |
| margin-top | 0 (no inline margin) |

**Filter pill group wrapper (inside filters-menu):**
**Classes:** `flex items-center gap-[12px]`

| Property | Value |
|----------|-------|
| display | flex |
| align-items | center |
| gap | 12px |

**Individual filter pill button:**
**Classes:** `content-stretch flex items-center justify-center px-[16px] h-[40px] relative rounded-[100px] shrink-0 cursor-pointer`
**Conditional class:** Active: `bg-white`, inactive: `text-[#4784f8]` (lists mode) or `bg-[rgba(255,255,255,0.15)] text-white` (non-lists mode)
**Conditional hidden:** Some pills have `hidden min-[390px]:flex` or `max-[389px]:hidden`

| Property | Value |
|----------|-------|
| padding-left | 16px |
| padding-right | 16px |
| height | 40px |
| border-radius | 100px (pill) |
| flex-shrink | 0 |

**Responsive behaviour:**
- `"sometime"` pill (reminders): `hidden min-[390px]:flex` — hidden below 390px width, flex above
- `"other"` pill (reminders grouped): `hidden min-[390px]:flex`
- `"grouped-todo"` pill (lists grouped): `hidden min-[390px]:flex`
- `"started"` pill (lists): `max-[389px]:hidden`

### 2.10 Scrollable content area (reminders)

**Component:** Scroll container div
**File:** `src/app/App.tsx:4454`
**Classes:** `content-stretch flex flex-col items-center justify-start overflow-x-clip w-full max-w-[768px] rounded-[10px]`
**Inline styles:** `{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto' }`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| align-items | center |
| justify-content | flex-start |
| overflow-x | clip |
| overflow-y | auto |
| width | 100% |
| max-width | 768px |
| border-radius | 10px |
| flex | 1 |
| min-height | 0 |
| position | relative |
| padding | none |

### 2.11 Scrollable content area (lists)

**Component:** Lists scroll wrapper
**File:** `src/app/App.tsx:4021`
**Classes:** `relative w-full max-w-[768px] flex-1 min-h-0`

| Property | Value |
|----------|-------|
| position | relative |
| width | 100% |
| max-width | 768px |
| flex | 1 |
| min-height | 0 |

**Inner scroll container:**
**File:** `src/app/App.tsx:4023`
**Classes:** `content-stretch flex flex-col items-center justify-start overflow-x-clip w-full rounded-[10px]`
**Inline styles:** `{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', height: '100%' }`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| overflow-x | clip |
| overflow-y | auto |
| width | 100% |
| border-radius | 10px |
| flex | 1 |
| min-height | 0 |
| height | 100% |
| padding | none |

### 2.12 Scrollable content area (done/deleted lists)

**Component:** Done/deleted lists scroll container
**File:** `src/app/App.tsx:3845`
**Classes:** `flex flex-col gap-[23px] w-full flex-1 min-h-0 overflow-y-auto`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| gap | 23px |
| width | 100% |
| flex | 1 |
| min-height | 0 |
| overflow-y | auto |
| padding | none |

### 2.13 New reminder/list button container

**Component:** Button wrapper div
**File:** `src/app/App.tsx:4832`
**Classes:** `content-stretch flex items-center justify-center w-full max-w-[768px] pb-[34px] shrink-0`
**Condition:** Hidden when `viewMode === "done-deleted"`

| Property | Value |
|----------|-------|
| display | flex |
| align-items | center |
| justify-content | center |
| width | 100% |
| max-width | 768px |
| padding-bottom | 34px |
| flex-shrink | 0 |

**Button element:**
**Classes:** `bg-[#4784f8] content-stretch flex gap-[16px] items-center justify-center px-[30px] relative rounded-[100px] w-full transition-colors`
**Inline styles:** `{ height: 'clamp(40px, calc(20vh - 73.6px), 60px)' }`

| Property | Value |
|----------|-------|
| padding-left | 30px |
| padding-right | 30px |
| gap | 16px |
| height | clamp(40px, calc(20vh - 73.6px), 60px) |
| border-radius | 100px |
| width | 100% |

---

## Section 3 - List spacing implementation

### 3.1 List cards wrapper (reminders)

**Component:** Reminder cards container
**File:** `src/app/App.tsx:4621`
**Classes:** `flex flex-col gap-[23px] w-full`
**Inline styles:** `{ position: 'relative', zIndex: 1 }`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| gap | 23px |
| width | 100% |

### 3.2 List cards wrapper (lists)

**Component:** List cards container
**File:** `src/app/App.tsx:4024`
**Classes:** `flex flex-col gap-[23px] w-full`
**Inline styles:** `{ position: 'relative', zIndex: 1 }`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| gap | 23px |
| width | 100% |

### 3.3 List cards wrapper (done/deleted reminders)

**Component:** Done/deleted cards container
**File:** `src/app/App.tsx:4488`
**Classes:** `flex flex-col gap-[23px] w-full`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| gap | 23px |
| width | 100% |

### 3.4 Individual reminder row

**Component:** Reminder row outer div
**File:** `src/app/App.tsx:4652`
**Classes:** `content-stretch flex items-start justify-between px-px relative w-full`

| Property | Value |
|----------|-------|
| display | flex |
| align-items | flex-start |
| justify-content | space-between |
| padding-left | 1px (`px-px`) |
| padding-right | 1px (`px-px`) |
| width | 100% |

**Row content wrapper:**
**File:** `src/app/App.tsx:4653`
**Classes:** `flex-[1_0_0] min-h-px min-w-px relative`

| Property | Value |
|----------|-------|
| flex | 1 0 0 |
| min-height | 1px |
| min-width | 1px |

**Inner flex row:**
**File:** `src/app/App.tsx:4654`
**Classes:** `flex flex-row items-start size-full`

**Checkbox + text container:**
**File:** `src/app/App.tsx:4655`
**Classes:** `content-stretch flex gap-[16px] items-start pr-[16px] relative w-full`

| Property | Value |
|----------|-------|
| display | flex |
| gap | 16px |
| align-items | flex-start |
| padding-right | 16px |
| width | 100% |

### 3.5 Checkbox button

**Component:** Circle/tick button
**File:** `src/app/App.tsx:4657`
**Classes:** `relative shrink-0 size-[25px] cursor-pointer flex items-center justify-center`
**Inline styles:** `{ padding: 0, background: 'none', border: 'none', lineHeight: 0, marginTop: '3px' }`

| Property | Value |
|----------|-------|
| width | 25px |
| height | 25px |
| flex-shrink | 0 |
| margin-top | 3px |
| padding | 0 |

### 3.6 Title and subtitle container

**Component:** Text content div
**File:** `src/app/App.tsx:4672`
**Classes:** `flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative cursor-pointer`
**Inline styles:** `{ transition: 'color 300ms', gap: '9px', minHeight: '38px' }`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| flex | 1 0 0 |
| gap | 9px |
| min-height | 38px |
| min-width | 0 |

### 3.7 Title line

**Component:** Title div
**File:** `src/app/App.tsx:4680`
**Classes:** `overflow-hidden whitespace-nowrap` (conditional: `line-through` when pending)
**Inline styles:** `{ color: dynamic, textDecorationColor: dynamic, height: '17px', maxWidth: '100%', minWidth: 0 }`

| Property | Value |
|----------|-------|
| height | 17px |
| max-width | 100% |
| min-width | 0 |
| overflow | hidden |
| white-space | nowrap |

**Title p element:**
**Inline styles:** `{ display: 'block', width: '100%', minWidth: 0, fontSize: '17px', fontWeight: 700, lineHeight: '17px', transform: 'translateY(-1px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '2px', boxSizing: 'content-box' }`

| Property | Value |
|----------|-------|
| font-size | 17px |
| line-height | 17px |
| padding-bottom | 2px |
| transform | translateY(-1px) |

### 3.8 Subtitle line

**Component:** Subtitle div
**File:** `src/app/App.tsx:4684`
**Classes:** `flex items-center overflow-visible` (conditional: `line-through` when pending)
**Condition:** Renders only when `showSubtitles === true`

**Subtitle p element:**
**Classes:** `overflow-hidden text-ellipsis whitespace-nowrap`
**Inline styles:** `{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: dynamic }`

| Property | Value |
|----------|-------|
| font-size | 14px |
| font-weight | 700 |
| line-height | 1 |

### 3.9 Effective rendered spacing chain (panel edge to reminder text)

Tracing from left panel edge to reminder title text (reminders view):

```
White panel left edge
  + 20px (white panel px-[20px])
    Scroll container (no left padding)
      List cards wrapper (no left padding)
        Reminder row (1px left padding from px-px)
          Row content wrapper (no left padding)
            Checkbox + text container (no left padding)
              Checkbox: 25px wide, shrink-0
              + 16px gap
              Title text begins
```

**Total left inset from white panel edge to title text:** 20px + 1px + 25px + 16px = **62px**
**Total left inset from viewport edge to title text:** 20px (panel padding) + 1px + 25px + 16px = **62px** (panel itself is full width)

Tracing from right panel edge to reminder row end:

```
White panel right edge
  - 20px (white panel px-[20px])
    Scroll container (no right padding)
      List cards wrapper (no right padding)
        Reminder row (1px right padding from px-px)
          Checkbox + text container: pr-[16px]
            [menu button sits in justify-between space]
```

**Total right inset from white panel edge:** 20px + 1px = **21px** (to row edge), then 16px additional padding before menu button

---

## Section 4 - Search area spacing implementation

### 4.1 Header component (input/search area)

**Component:** Header
**File:** `src/imports/Header.tsx`

**Root container:**
**Classes:** `flex flex-col relative w-full gap-[7px]`

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| gap | 7px |
| width | 100% |

**Input row:**
**Classes:** `flex items-center justify-between relative w-full min-h-[35px] gap-[12px]`

| Property | Value |
|----------|-------|
| display | flex |
| align-items | center |
| justify-content | space-between |
| min-height | 35px |
| gap | 12px |
| width | 100% |

**Input wrapper:**
**Classes:** `flex flex-1 min-w-0 h-[35px] items-center`

| Property | Value |
|----------|-------|
| flex | 1 |
| min-width | 0 |
| height | 35px |

**Input element:**
**Inline styles:** `{ padding: 0, margin: 0, fontWeight: 700, transition: 'color 300ms' }`
**Classes:** `font-['Lato',sans-serif] text-[20px] leading-[23px]`

| Property | Value |
|----------|-------|
| padding | 0 |
| margin | 0 |
| font-size | 20px |
| line-height | 23px |

**Button group (right side):**
**Classes:** `flex items-center h-[35px] gap-[20px] shrink-0`

| Property | Value |
|----------|-------|
| gap | 20px |
| height | 35px |
| flex-shrink | 0 |

**Subtitle row:**
**Classes:** `flex items-center gap-[8px] min-w-0 pr-[36px]`

| Property | Value |
|----------|-------|
| gap | 8px |
| padding-right | 36px |

**Note:** The Header component renders inside the NewReminderOverlay, not inside the main white panel. The main white panel does not have a separate search bar. The Header component is used as the text input header in the new reminder overlay.

---

## Section 5 - Overlay spacing implementation

### 5.1 New reminder overlay

**Component:** NewReminderOverlay bottom sheet
**File:** `src/app/App.tsx:4868` (shell), `src/imports/NewReminderOverlay.tsx` (content)

**Sheet outer motion.div:**
**Classes:** `fixed left-0 right-0 z-50 mx-auto w-full`
**Inline styles:** `{ bottom: 0 }`

**Sheet inner motion.div:**
**Classes:** `bg-white relative rounded-tl-[15px] rounded-tr-[15px] size-full`

| Property | Value |
|----------|-------|
| border-radius-top-left | 15px |
| border-radius-top-right | 15px |

**Drag handle:**
**File:** `src/app/App.tsx:4893`
**Classes:** `absolute left-0 right-0 top-0 h-[24px] z-[2] touch-pan-y`

| Property | Value |
|----------|-------|
| height | 24px |
| position | absolute top: 0 |

**Overlay root (content):**
**File:** `src/imports/NewReminderOverlay.tsx`
**Classes:** `bg-white content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full`

| Property | Value |
|----------|-------|
| border-radius-top-left | 15px |
| border-radius-top-right | 15px |

**Content max-width wrapper:**
**Classes:** `relative shrink-0 w-full max-w-[768px] h-full flex flex-col`

| Property | Value |
|----------|-------|
| max-width | 768px |
| width | 100% |
| height | 100% |

**Header section (text field area):**
**Classes:** `content-stretch flex flex-col gap-[22px] items-start pt-[30px] px-[24px] relative w-full shrink-0`

| Property | Value |
|----------|-------|
| gap | 22px |
| padding-top | 30px |
| padding-left | 24px |
| padding-right | 24px |
| padding-bottom | 0 |
| flex-shrink | 0 |

**Textarea container:**
**Classes:** `relative bg-[#f7f7f7] rounded-[10px] shrink-0 w-full`

| Property | Value |
|----------|-------|
| border-radius | 10px |

**Textarea element:**
**Classes:** `w-full h-full p-[12px] font-['Lato',sans-serif] text-[17px] resize-none border-none outline-none bg-transparent relative z-10`

| Property | Value |
|----------|-------|
| padding | 12px (all sides) |

**Options section:**
**Classes:** `flex-1 min-h-0 flex flex-col px-[24px] pt-[24px] pb-[24px]`

| Property | Value |
|----------|-------|
| padding-left | 24px |
| padding-right | 24px |
| padding-top | 24px |
| padding-bottom | 24px |
| flex | 1 |
| min-height | 0 |

**Reminder options container (inside options):**
**Classes:** `content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full flex-1 min-h-0 overflow-y-auto`

| Property | Value |
|----------|-------|
| gap | 24px |
| overflow-y | auto |

**Date/time/repeats section row:**
**Classes:** `content-stretch flex items-center justify-between gap-[16px] relative shrink-0 w-full`

| Property | Value |
|----------|-------|
| gap | 16px |

**Date picker container:**
**Classes:** `content-stretch flex flex-col items-center pb-[20px] relative w-full`

| Property | Value |
|----------|-------|
| padding-bottom | 20px |

**Date picker top (month/year controls):**
**Classes:** `relative shrink-0 w-full max-w-[340px] min-w-[280px] pt-[20px] pb-[16px] px-[4px]`

| Property | Value |
|----------|-------|
| padding-top | 20px |
| padding-bottom | 16px |
| padding-left | 4px |
| padding-right | 4px |
| max-width | 340px |
| min-width | 280px |

**Calendar grid:**
**Classes:** `gap-[8px] grid grid-cols-7 pt-[9px] relative shrink-0 w-full max-w-[340px] min-w-[280px]`

| Property | Value |
|----------|-------|
| gap | 8px |
| padding-top | 9px |
| grid-template-columns | 7 equal columns |

### 5.2 Settings overlay

**Component:** SettingsOverlay
**File:** `src/app/components/SettingsOverlay.tsx`

**Root container:**
**Classes:** `bg-white content-stretch flex flex-col items-center relative rounded-tl-[20px] rounded-tr-[20px] size-full`

| Property | Value |
|----------|-------|
| border-radius-top-left | 20px |
| border-radius-top-right | 20px |

**Content wrapper:**
**Classes:** `flex flex-col h-full relative w-full max-w-[768px]`

| Property | Value |
|----------|-------|
| max-width | 768px |

**Main content area:**
**Classes:** `flex flex-col gap-[32px] [@media(max-height:667px)]:gap-[20px] items-start pt-[30px] px-[20px] pb-0 relative w-full flex-1 min-h-0 overflow-hidden`

| Property | Value | Responsive (max-height: 667px) |
|----------|-------|-------------------------------|
| gap | 32px | 20px |
| padding-top | 30px | 30px |
| padding-left | 20px | 20px |
| padding-right | 20px | 20px |
| padding-bottom | 0 | 0 |
| flex | 1 | 1 |
| min-height | 0 | 0 |
| overflow | hidden | hidden |

**Header section:**
**Classes:** `flex flex-col gap-[40px] [@media(max-height:667px)]:gap-[20px] w-full shrink-0`

| Property | Value | Responsive (max-height: 667px) |
|----------|-------|-------------------------------|
| gap | 40px | 20px |
| flex-shrink | 0 | 0 |

**Settings items gap:** `gap-[10px]`
**Icon-text gap:** `gap-[16px]`
**Label gaps:** `gap-[4px]`

**Premium section:**
**Padding:** `pt-[24px] px-[20px] pb-[32px]`
**Premium title padding-bottom:** `pb-[26px]`

### 5.3 Reminder info overlay (modal)

**Component:** ReminderInfoOverlay
**File:** `src/app/components/ReminderInfoOverlay.tsx`

**Backdrop:**
**Classes:** `fixed inset-0 bg-black/50 z-[60]`

**Modal wrapper:**
**Classes:** `fixed inset-0 z-[60] flex items-center justify-center pointer-events-none`

**Modal panel:**
**Classes:** `bg-white relative flex flex-col gap-[25px] items-center pt-[35px] pb-[35px] px-[32px] rounded-[32px]`
**Inline styles:** `{ width: 340 }`

| Property | Value |
|----------|-------|
| width | 340px |
| padding-top | 35px |
| padding-bottom | 35px |
| padding-left | 32px |
| padding-right | 32px |
| gap | 25px |
| border-radius | 32px |

**Button section gap:** `gap-[30px]`
**Icon-text gap:** `gap-[8px]`
**Button height:** `h-[50px]`
**Button padding:** `px-[18px] py-[15px]`
**Button top margin:** `mt-[7px]`

### 5.4 Repeats overlay

**Component:** RepeatsOverlay
**File:** `src/app/components/RepeatsOverlay.tsx`

**Root container:**
**Classes:** `bg-white content-stretch flex flex-col items-center relative rounded-tl-[15px] rounded-tr-[15px] size-full`

| Property | Value |
|----------|-------|
| border-radius-top-left | 15px |
| border-radius-top-right | 15px |

**Content wrapper:**
**Classes:** `flex flex-col h-full relative w-full max-w-[768px]`

| Property | Value |
|----------|-------|
| max-width | 768px |

**Main content area:**
| Property | Value |
|----------|-------|
| padding-top | 30px |
| padding-left | 24px |
| padding-right | 24px |
| padding-bottom | 24px |

**Scrollable frequency content:**
**Classes:** `mt-[34px] w-full flex flex-col gap-[30px] overflow-y-auto flex-1 min-h-0 pb-[10px]`

| Property | Value |
|----------|-------|
| margin-top | 34px |
| gap | 30px |
| overflow-y | auto |
| flex | 1 |
| min-height | 0 |
| padding-bottom | 10px |

**Custom days gap:** `gap-[25px]`
**Custom days padding:** `py-[40px]`
**Header gap:** `gap-[10px]`
**Button height:** `h-[50px]`
**Frequency button padding:** `px-[18px]`
**Content container padding:** `px-[20px]`

### 5.5 Tutorial overlay

**Component:** TutorialOverlay
**File:** `src/app/components/TutorialOverlay.tsx`

**Root container:**
**Classes:** `absolute inset-0 bg-white content-stretch flex flex-col items-center rounded-tl-[20px] rounded-tr-[20px] overflow-hidden`

| Property | Value |
|----------|-------|
| position | absolute |
| inset | 0 |
| border-radius-top-left | 20px |
| border-radius-top-right | 20px |

**Content wrapper:**
**Classes:** `flex flex-col h-full relative w-full max-w-[768px]`

| Property | Value |
|----------|-------|
| max-width | 768px |

**Main gap:** `gap-[40px]`

### 5.6 DevTools info overlay (modal)

**Component:** DevToolsInfoOverlay
**File:** `src/app/components/DevToolsOverlay.tsx`

**Panel:**
**Classes:** `bg-white flex flex-col gap-[35px] items-center py-[40px] px-[34px] rounded-[32px]`
**Inline styles:** `{ width: 340 }`

| Property | Value |
|----------|-------|
| width | 340px |
| padding-top | 40px |
| padding-bottom | 40px |
| padding-left | 34px |
| padding-right | 34px |
| gap | 35px |
| border-radius | 32px |

### 5.7 Info overlay (list settings)

**Component:** InfoOverlay
**File:** `src/imports/InfoOverlay.tsx`

**Panel:**
**Classes:** `bg-white rounded-[32px]`
**Padding:** `px-[32px] py-[35px]`
**Gap:** `gap-[33px]`
**Inline styles:** `{ width: 340 }`

| Property | Value |
|----------|-------|
| width | 340px |
| padding-top | 35px |
| padding-bottom | 35px |
| padding-left | 32px |
| padding-right | 32px |
| gap | 33px |
| border-radius | 32px |

---

## Section 6 - Safe area implementation

### 6.1 Viewport meta tag

**File:** `index.html:5` (source), `ios/App/App/public/index.html:5` (iOS build)
**Value:** `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`

The viewport meta tag does NOT include `viewport-fit=cover`. The app relies on iOS default safe area handling.

### 6.2 CSS safe area insets

No `env(safe-area-inset-*)` values exist anywhere in the codebase. No CSS files or inline styles reference safe area environment variables.

### 6.3 JavaScript viewport tracking

**File:** `src/app/App.tsx`
**State:** `const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 0);`

**Resize listener (useEffect):**
Tracks viewport height changes via `window.addEventListener('resize')` and updates `viewportHeight` state.

**Overlay positioning function:**
```typescript
const getOverlayTopPosition = () => {
  const THRESHOLD = 570;
  const DEFAULT_TOP = 121.653; // 16px below logo: 20px + 50px + 35.653px + 16px
  const ABOVE_LOGO_TOP = 54; // 16px above logo: 20px + 50px - 16px
  if (viewportHeight <= THRESHOLD) {
    return ABOVE_LOGO_TOP;
  }
  return DEFAULT_TOP;
};
```

**Usage:** Sets `top` value of bottom-sheet overlays.

### 6.4 Capacitor configuration

**File:** `capacitor.config.json`
```json
{
  "appId": "com.reminderly.app",
  "appName": "Reminderly",
  "webDir": "dist",
  "loggingBehavior": "none"
}
```

No safe area, viewport-fit, or status bar configuration.

### 6.5 iOS Info.plist

**File:** `ios/App/App/Info.plist`
- Portrait only: `UIInterfaceOrientationPortrait`
- `UIViewControllerBasedStatusBarAppearance = true`
- No custom safe area configuration.

### 6.6 Root container height

The root container uses `h-screen` (100vh). On iOS, this is the viewport height as managed by iOS/Capacitor, which by default excludes safe area insets since `viewport-fit=cover` is not set.

---

## Section 7 - Complete spacing value inventory

### 7.1 Panel-level spacing

| Element | Property | Value |
|---------|----------|-------|
| Root container | padding | 0 |
| Root container | gap | 0 |
| Header wrapper | padding | 20px all sides |
| Header inner | gap | 17px |
| Logo row | padding-top | 50px |
| Logo row | padding-bottom | 20px |
| Filter pills (non-lists, in header) | margin-top | 2px |
| Filter pills group | gap | 12px |
| Tab bar | padding-left/right | 20px |
| Tab bar | gap | 10px |
| Tab bar tab | height | 52px |
| Tab bar tab inner | padding-left/right | 30px |
| White panel | padding-left | 20px |
| White panel | padding-right | 20px |
| White panel | padding-top | 24px |
| White panel | padding-bottom | 0 |
| White panel | gap | 24px |
| White panel | min-height | 350px |
| White panel | border-radius-top | 15px (lists) / 20px (no lists) |
| Scroll container | padding | 0 |
| Scroll container | max-width | 768px |
| Scroll container | border-radius | 10px |

### 7.2 List-level spacing

| Element | Property | Value |
|---------|----------|-------|
| Cards wrapper | gap | 23px |
| Reminder row | padding-left/right | 1px (px-px) |
| Checkbox-to-text gap | gap | 16px |
| Checkbox-to-text container | padding-right | 16px |
| Checkbox | size | 25px x 25px |
| Checkbox | margin-top | 3px |
| Title-subtitle gap | gap | 9px |
| Title-subtitle container | min-height | 38px |
| Title | height | 17px |
| Title p | padding-bottom | 2px |
| Title p | transform | translateY(-1px) |
| Subtitle | font-size | 14px |
| Subtitle | line-height | 1 |

### 7.3 Filter pill spacing

| Element | Property | Value |
|---------|----------|-------|
| Pill container | gap | 12px |
| Individual pill | padding-left/right | 16px |
| Individual pill | height | 40px |
| Individual pill | border-radius | 100px |
| Clear all button | height | 40px |
| Clear all button | width | 95px |

### 7.4 New button spacing

| Element | Property | Value |
|---------|----------|-------|
| Button container | padding-bottom | 34px |
| Button container | max-width | 768px |
| Button | padding-left/right | 30px |
| Button | height | clamp(40px, calc(20vh - 73.6px), 60px) |
| Button | gap (icon to text) | 16px |
| Button icon | size | 15px x 15px |

### 7.5 New reminder overlay spacing

| Element | Property | Value |
|---------|----------|-------|
| Sheet | border-radius-top | 15px |
| Drag handle | height | 24px |
| Header section | padding-top | 30px |
| Header section | padding-left/right | 24px |
| Header section | gap | 22px |
| Textarea | padding | 12px all sides |
| Options section | padding | 24px all sides |
| Options gap | gap | 24px |
| Date/time/repeats row | gap | 16px |
| Date picker | padding-bottom | 20px |
| Calendar month controls | padding-top | 20px |
| Calendar month controls | padding-bottom | 16px |
| Calendar month controls | padding-left/right | 4px |
| Calendar grid | gap | 8px |
| Calendar grid | padding-top | 9px |
| Calendar day | height | 42px |

### 7.6 Settings overlay spacing

| Element | Property | Value | At max-height:667px |
|---------|----------|-------|---------------------|
| Container | border-radius-top | 20px | 20px |
| Max-width wrapper | max-width | 768px | 768px |
| Main area | padding-top | 30px | 30px |
| Main area | padding-left/right | 20px | 20px |
| Main area | padding-bottom | 0 | 0 |
| Main area | gap | 32px | 20px |
| Header section | gap | 40px | 20px |
| Settings items | gap | 10px | 10px |
| Icon-text | gap | 16px | 16px |
| Label | gap | 4px | 4px |
| Premium section | padding-top | 24px | 24px |
| Premium section | padding-left/right | 20px | 20px |
| Premium section | padding-bottom | 32px | 32px |
| Premium title | padding-bottom | 26px | 26px |

### 7.7 Modal overlay spacing

| Element | Property | ReminderInfo | InfoOverlay | DevToolsInfo |
|---------|----------|-------------|-------------|-------------|
| Width | fixed | 340px | 340px | 340px |
| Border radius | all | 32px | 32px | 32px |
| Padding top | | 35px | 35px | 40px |
| Padding bottom | | 35px | 35px | 40px |
| Padding left | | 32px | 32px | 34px |
| Padding right | | 32px | 32px | 34px |
| Content gap | | 25px | 33px | 35px |

### 7.8 Bottom sheet overlay spacing

| Element | Property | NewReminder | Settings | Repeats | Tutorial |
|---------|----------|------------|----------|---------|----------|
| Border radius TL | | 15px | 20px | 15px | 20px |
| Border radius TR | | 15px | 20px | 15px | 20px |
| Max-width | | 768px | 768px | 768px | 768px |
| Padding top | | 30px | 30px | 30px | — |
| Padding left/right | | 24px | 20px | 24px | — |
| Padding bottom | | 24px | 0 | 24px | — |

### 7.9 Empty state spacing

| Element | Property | Value |
|---------|----------|-------|
| Active reminders empty | positioning | absolute inset-0 |
| Active reminders empty | display | flex, center/center |
| Active reminders empty | z-index | 0 |
| Done/deleted empty | display | flex column |
| Done/deleted empty | gap | 4px |
| Done/deleted empty | alignment | center/center |
| Done/deleted empty | flex | 1 |
| Lists done/deleted empty | min-height | 0 |
| Text styling | font-size | 17px |
| Text styling | color | #CCCCCC |
| Text styling | font-family | 'Lato', sans-serif |

### 7.10 Responsive breakpoints

| Breakpoint | Type | Used in |
|------------|------|---------|
| `@media(max-height:570px)` | Height | Onboarding/tutorial pages |
| `@media(max-height:667px)` | Height | Settings overlay |
| `min-[390px]` | Width | Filter pill visibility |
| `max-[389px]` | Width | Filter pill visibility (lists) |
| `viewportHeight <= 570` | JS | Overlay top position |

### 7.11 Tailwind `content-stretch`

The class `content-stretch` appears throughout the codebase but has no custom definition in the project's CSS files (`index.css`, `theme.css`, `tailwind.css`). In Tailwind CSS v4, `content-stretch` maps to `align-content: stretch`, which is the default behaviour for flex containers. It has no effect on spacing values.

### 7.12 CSS custom properties (spacing-related)

No spacing-related CSS custom properties are defined. The `theme.css` file defines:
- Color variables
- Typography variables (`--font-size: 16px`, `--font-weight-medium`, `--font-weight-normal`)
- Border radius variables (`--radius: 0.625rem`)
- No gap, padding, or margin variables

### 7.13 Global base styles

**File:** `src/styles/theme.css:147-206`

| Selector | Property | Value |
|----------|----------|-------|
| `*` | border-color | var(--border) = rgba(0, 0, 0, 0.1) |
| `html` | font-size | var(--font-size) = 16px |
| `body` | background | var(--background) = #ffffff |
| `button` | font-size | var(--text-base) |
| `button` | font-weight | 500 |
| `input` | font-size | var(--text-base) |
| `input` | font-weight | 400 |

No global padding, margin, or gap overrides.
