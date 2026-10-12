# Reminderly row title descender + truncation - copy reference

Source: `src/app/App.tsx`. Two approaches are used across the app. Both achieve ellipsis truncation without clipping descenders and without increasing visible row height.

## Approach A - padding-bottom + content-box (active reminder/list rows)

Used for active reminder rows (line 4680-4682) and active list rows (line 4108-4119).

### DOM structure

```
<div (parent flex column)>
  <div (title wrapper - owns overflow-hidden)>
    <p (title text - owns textOverflow ellipsis)>Title here</p>
  </div>
  <div (subtitle wrapper)>
    <p>Subtitle here</p>
  </div>
</div>
```

### Parent flex column

```
className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative"
style={{ gap: '9px', minHeight: '38px' }}
```

Key: `overflow-visible` on the parent. This allows the title wrapper's descender padding to visually bleed into the gap space without affecting layout. `min-w-0` allows the flex child to shrink below content width (required for ellipsis). `flex-[1_0_0]` means `flex: 1 0 0`.

### Title wrapper

```
className="overflow-hidden whitespace-nowrap"
style={{ height: '17px', maxWidth: '100%', minWidth: 0 }}
```

This element owns `overflow-hidden` and `whitespace-nowrap`. The `height: 17px` sets the layout height of the row title area. This is the visual height the row allocates. The overflow-hidden clips horizontally for truncation. But the p element inside extends below this 17px boundary via paddingBottom, and that extension is visible because the parent flex column has `overflow-visible`.

### Title text

```
<p style={{
  display: 'block',
  width: '100%',
  minWidth: 0,
  fontSize: '17px',
  fontWeight: 700,
  lineHeight: '17px',
  transform: 'translateY(-1px)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  paddingBottom: '2px',
  boxSizing: 'content-box'
}}>
```

This element owns `textOverflow: 'ellipsis'`, `overflow: 'hidden'`, and `whiteSpace: 'nowrap'`.

The descender trick: `paddingBottom: '2px'` with `boxSizing: 'content-box'` makes the p element 19px tall (17px content + 2px padding) while the title wrapper remains 17px. The extra 2px hangs below the wrapper boundary, giving descenders (g, y, p, q, j) room to render. This works because the parent flex column has `overflow-visible`, so the 2px overshoot is painted rather than clipped.

`transform: 'translateY(-1px)'` shifts the text up 1px for visual alignment within the 17px container.

### How it works together

1. Title wrapper is 17px tall with overflow-hidden - clips horizontally for ellipsis
2. Title p is 17px content + 2px paddingBottom = 19px total, with content-box sizing
3. The 2px overshoot extends below the 17px wrapper
4. Parent flex column has overflow-visible so the overshoot is painted, not clipped
5. The gap-9px between title and subtitle absorbs the visual overshoot so row height does not change
6. Horizontal overflow is hidden (ellipsis). Vertical overflow is allowed downward via the parent's overflow-visible

## Approach B - clipPath inset (done/deleted rows)

Used for done/deleted reminder rows (line 4531-4532) and done/deleted list rows (line 3891-3892).

### Title wrapper

```
className="overflow-hidden text-ellipsis whitespace-nowrap"
style={{ clipPath: 'inset(0 0 -4px 0)' }}
```

No fixed height set. Instead of padding-bottom on the p, the wrapper uses `clipPath: 'inset(0 0 -4px 0)'` which means: clip top 0, right 0, bottom -4px (extend 4px below), left 0. The negative bottom value expands the visible area 4px below the element's box, letting descenders render even though `overflow-hidden` is set.

### Title text

```
<p style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1, overflow: 'visible', transform: 'translateY(-1px)' }}>
```

Note `overflow: 'visible'` on the p here and `lineHeight: 1` (which equals 17px at fontSize 17px). The text overflows the p's box downward and the clipPath on the wrapper determines how much is visible.

### How it works

1. Title wrapper has overflow-hidden (for horizontal ellipsis) but clipPath extends the visible region 4px below
2. Title p has overflow-visible so descenders extend below its line-height box
3. clipPath overrides the vertical clipping from overflow-hidden, allowing the bottom 4px to show
4. This approach is simpler but only used on done/deleted rows (likely added later)

## Parent flex rules preventing menu push-off

The entire row uses this structure:

```
<div (row outer)>
  <div flex-[1_0_0] min-w-0 (text column)>
    <div overflow-hidden (title)>...</div>
    <div (subtitle)>...</div>
  </div>
  <RowMenuButton (3-dot menu) />
</div>
```

The text column has `flex-[1_0_0]` (takes available space) and `min-w-0` (can shrink below content). The menu button has no flex-grow so it stays at its intrinsic width. The text column shrinks to accommodate the menu button. Without `min-w-0` on the text column, the title text would push the menu off screen.

## Which approach Noterly should copy

Approach A (padding-bottom + content-box) is simpler to implement and does not require clipPath. The pattern is:

1. Parent flex column: `overflow-visible`, `min-w-0`, `flex: 1 0 0`
2. Title wrapper div: `overflow-hidden`, `whitespace-nowrap`, `height: 17px`, `minWidth: 0`
3. Title p: `overflow: hidden`, `textOverflow: ellipsis`, `whiteSpace: nowrap`, `lineHeight: 17px`, `paddingBottom: 2px`, `boxSizing: content-box`, `width: 100%`, `minWidth: 0`
4. Ensure there is gap space below the title (gap-9px in Reminderly) to absorb the 2px visual overshoot

Approach B (clipPath) is an alternative if the padding approach causes issues with line-through decoration or other styling. Use `clipPath: 'inset(0 0 -4px 0)'` on the title wrapper and `overflow: visible` on the p element.
