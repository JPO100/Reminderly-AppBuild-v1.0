# Motion standards

Visual conventions as implemented, checked against the code on 2026-10-12. Where they differ, the code is the source of truth and this document should be corrected. Part of the [design standards](./README.md).

- Bottom sheets slide up (`y: "100%"` to 0, about 250ms).
- List rows: `layout` with `exit={{ opacity: 0 }}`; `AnimatePresence` keyed by view and filter.
- Behavioural timings (350ms, 500ms, 1000ms) are listed in [architecture.md](../architecture.md).
