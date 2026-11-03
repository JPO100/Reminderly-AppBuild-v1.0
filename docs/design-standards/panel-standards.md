# Panel standards

Visual conventions as implemented, checked against the code on 2026-10-12. Where they differ, the code is the source of truth and this document should be corrected. Part of the [design standards](./README.md).

Centred overlays are a separate standard: [overlay-standards.md](./overlay-standards.md).

## Panel standard

Applies to the main Reminders and Lists panels and every slide-up panel (Templates, Lists editor, New and edit reminder, Repeats, Dev tools). Centred overlays and the tutorial are excluded.

| Space | Value |
|-------|-------|
| Top padding | 24px |
| Header | 45px high, title left, 45 x 45 button(s) right, 10px apart. Main panels use the filter row as the header |
| Close button | 45 x 45 `#4784F8` circle with a white cross; inactive buttons `#D9D9D9` |
| Header to content | 24px, no separator (Lists editor: 26px below the subtitle, which sits about 40px below the title row) |
| Content to bottom button | 24px |
| Bottom space | 24px to the screen bottom (done/deleted pages: 0px) |
| Top corners | 15px |
| Horizontal padding | 20px main panels and Dev tools; 24px other slide-up panels |
| Content max width | 768px |
| Main panel min height | 350px |
| Panel stop | Sliding panels stop 28px below the bottom of the Reminderly logo |

Where a container gap also spaces other content, header spacing is adjusted with a margin on the header rather than changing the shared gap.

## Bottom sheets

Used by New reminder, Repeats, Lists editor, Templates, Dev tools and the tutorial, all wrapped in `App.tsx`:

```tsx
<motion.div />                 // transparent backdrop, tap to close
<motion.div                    // sheet, slides up
  initial={{ y: "100%", top: getBottomSheetTopPosition() }}
  animate={{ y: 0, top: getBottomSheetTopPosition() }} />
```

- Viewport-aware top position, 768px max width, 15px top corners; drag to close where supported.
- `top` must be set in `initial` as well as `animate`. Without it the sheet's first frame takes its height from its content, so a long list (more than about 23 items) slides from the wrong distance and visibly bounces when `top` applies mid-animation.
