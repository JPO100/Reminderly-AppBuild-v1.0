# Typography standards

Visual conventions as implemented, checked against the code on 2026-10-12. Where they differ, the code is the source of truth and this document should be corrected. Part of the [design standards](./README.md).

Lato throughout (`src/styles/fonts.css`), bold (700) unless stated.

| Style | Size | Colour |
|-------|------|--------|
| Panel title | 20px | `#1C2C42` |
| Row title, setting label, button label | 17px | `#1C2C42` (buttons white) |
| Description text | 17px Lato Medium (14px for section subtitles) | `#939393` |
| Row subtitle | 14px | `#BABABA` |
| Filter pill | 14px | Category colour |
| Sub-header | 15px | `#BABABA` |
| Empty state | 17px | `#CCCCCC` (`#BABABA` for the calendar empty day) |

Note (2026-11-03): the overlay standard defines a Header subtitle, Lato Medium 15px `#BABABA`, in a centred overlay's header area. This table lists a 15px `#BABABA` Sub-header and, by the rule at the top, treats it as bold. The only other 15px `#BABABA` text found in the code is a Lato Bold line in a settings row, so the Header subtitle and the Sub-header share size and colour and differ in weight and use. They are not reconciled; the typography review decides. The overlay standard governs the Header subtitle.