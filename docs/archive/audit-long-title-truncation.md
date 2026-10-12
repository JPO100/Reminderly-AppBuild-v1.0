# Reminderly long title truncation - copy reference

All row rendering is inline in `src/app/App.tsx`. Single-line, ellipsis-truncated. Title and subtitle truncate independently.

## Parent flex container

The parent flex container that wraps the circle, title column, and menu button:

```
className="flex flex-[1_0_0] flex-col font-['Lato:Bold',sans-serif] justify-start min-h-px min-w-0 not-italic overflow-visible relative cursor-pointer"
style={{ transition: 'color 300ms', gap: '9px', minHeight: '38px' }}
```

`flex-[1_0_0]` means `flex: 1 0 0`. `min-w-0` overrides the default `min-width: auto` so the flex child can shrink below its content width. Without `min-w-0` the ellipsis will not work.

## Title wrapper

```
className="overflow-hidden whitespace-nowrap"
style={{ color: textColour, textDecorationColor: textColour, height: '17px', maxWidth: '100%', minWidth: 0 }}
```

`overflow-hidden` clips the content. `whitespace-nowrap` prevents wrapping. `height: 17px` locks the single line. `minWidth: 0` allows shrinking.

## Title text element

```html
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
}}>{title}</p>
```

`textOverflow: 'ellipsis'` produces the truncation dots. `paddingBottom: '2px'` with `boxSizing: 'content-box'` gives descenders room below the 17px line height. `transform: 'translateY(-1px)'` nudges the text up 1px for visual alignment.

## Subtitle

Separate div below the title, spaced by `gap: '9px'` on the parent. Truncates independently and does not affect title truncation.

```
className="overflow-hidden text-ellipsis whitespace-nowrap"
style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Lato', sans-serif", lineHeight: 1, color: '#BABABA' }}
```

## Critical truncation chain

For ellipsis to work, every level in the flex chain must allow shrinking:

1. Flex parent: `min-w-0` (class) - overrides `min-width: auto`
2. Title wrapper: `overflow-hidden whitespace-nowrap` (class) + `minWidth: 0` (inline)
3. Title `<p>`: `width: '100%'`, `minWidth: 0`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'` (all inline)

If any `min-width: 0` is missing from any level, the row will overflow horizontally instead of truncating.

## List rows

List rows use the identical pattern. Same wrapper classes, same inline styles, same parent flex rules.
