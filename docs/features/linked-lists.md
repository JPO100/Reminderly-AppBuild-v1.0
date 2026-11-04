# Linked lists (Reminderly lists in Noterly notes)

A Reminderly list can be inserted into Noterly notes and ticked in either app. Reminderly is the source of truth: items are added, edited, deleted and reordered only in Reminderly. Local and offline only. Status: Stage 1 (Reminderly side) built on `feature/linked-lists-reminderly`, behind a master flag that is off by default. The full design and the agreed scope are recorded with Noterly in `Noterly-AppBuild-v1.0/docs/linked-lists-v1-proposal.md` and `linked-lists-record.md`.

## Flag and permission

- Master flag `reminderly-ff-linked-lists` (Dev tools > Lists > Linked lists), default off, shared with Noterly through the `linked.enabled` key. Off hides every linked-list control in Reminderly, and Reminderly neither publishes nor consumes. All stored data is kept.
- `CreatedList.linkable` (default false): "Make list linkable" in the list overlays, only with the flag on and only for active lists. Off stops new insertions only; existing links keep working.
- `CreatedList.linkEpoch` (default 0): raised by one to end every link to the list. Noterly turns blocks with a lower epoch into ordinary checklists. It is raised by Unlink / Unlink all (after confirmation) and when a list delete commits (after the pending window), with the flag on or off.

## Shared data (App Group `group.com.reminderly.app`, keys prefixed `linked.`)

| Key | Writer | Content |
|---|---|---|
| `linked.enabled` | Reminderly | the master flag |
| `linked.lists` | Reminderly | lists that are linkable or in the register: id, title, status, linkEpoch, linkable, items in displayed order |
| `linked.links` | Noterly | one entry per linked block: listId, noteId, blockId, epoch, title (null for private notes), private, deleted |
| `linked-ticks/` folder | Noterly writes, Reminderly consumes | one file per list item: listId, itemId, completed, id |

## Flow

- On launch and each return to the foreground (flag on): read the register and tick files, apply the ticks through normal list state (set to a value, never toggle; active lists only), and once the lists are saved publish `linked.lists` from the stored string, then delete each applied tick file only if it still holds the applied id. The first read gates the first paint on a cold launch.
- Status line in the list overlay: none "No note currently linked"; one "Noterly: <title>" (a private note reads "a private note"); several "Noterly: linked to N notes". Recently Deleted notes and links from an earlier epoch are not counted. The Unlink button is hidden with no links, "Unlink from Noterly" with one, "Unlink all from Noterly" with several. A link icon follows "N of M" in the list editor and on Lists rows.
- Deleting a linked list asks first, because the links end for good.
- A tick for a list open in the editor is also applied to the editor's copy, so closing the editor cannot undo it.

- Open in Reminderly: Noterly opens `reminderly://list/<id>`; Reminderly (feature on) goes to the Lists tab and opens that list, on a cold launch or while running (`parseListLink`, App.tsx).

## Code

`utils/linked-lists.ts` (pure logic), `utils/useLinkedLists.ts` (lifecycle), `utils/widget.ts` (bridge functions), `WidgetBridgePlugin.swift` (five methods on the existing plugin), `imports/LinkedListControls.tsx` (row, button, dialog), `App.tsx` (wiring), Dev tools row.

## Known limits

- A Noterly tick reaches Reminderly when Reminderly next opens; smart reminder wording stays at the old progress until then. No background processing.
- A completed (done) list that is still linked keeps its status line (under the title) and Unlink in the completed-list overlay, and never shows Make list linkable. Deleted lists have no links (the epoch was raised at delete). The link icon is drawn on active rows and in the editor, not on archive rows.
- Before release: retire or remove the flag, update the onboarding tutorial and `release-readiness.md`.
