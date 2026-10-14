# Attachment viewing - technical handover

Reference implementation from Reminderly for reproducing in Noterly.

## 1. Final chosen method

Files are opened using the native iOS document viewer via `@capacitor-community/file-opener`. The file is read from the app sandbox as base64, written to a temporary cache location, then its native URI is passed to FileOpener which delegates to the OS default handler (Quick Look on iOS).

## 2. Package dependency

```
@capacitor-community/file-opener: ^8.0.1
```

Supporting packages already likely in your project:
- `@capacitor/filesystem: ^8.1.3` (read/write/URI resolution)
- `@capacitor/share: ^8.0.1` (fallback only, used if FileOpener fails in the new-reminder overlay)

## 3. Attachment types that use this method

All types use the same single FileOpener path. No type-specific viewers.

- Images: JPEG, PNG, GIF, HEIC, HEIF, WebP
- Documents: PDF, TXT, RTF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX

## 4. Complete viewing flow

```
User taps "View attachment"
  |
  +-- Close any open overlay (setInfoReminder(null))
  |
  +-- Filesystem.readFile({
  |       path: attachment.storagePath,    // "reminderly-attachments/{reminderId}.{ext}"
  |       directory: Directory.Data
  |   }) -> { data: base64String }
  |
  +-- Extract extension from attachment.fileName
  |
  +-- Filesystem.writeFile({
  |       path: "reminderly-temp-preview.{ext}",
  |       data: base64String,
  |       directory: Directory.Cache
  |   })
  |
  +-- Filesystem.getUri({
  |       path: "reminderly-temp-preview.{ext}",
  |       directory: Directory.Cache
  |   }) -> { uri: "file:///..." }
  |
  +-- FileOpener.open({
          filePath: uri,
          contentType: attachment.mimeType,   // e.g. "application/pdf"
          openWithDefault: true
      })
```

If FileOpener fails, the error is caught silently in the main info overlay. In the new-reminder overlay, a fallback calls `Share.share({ files: [uri] })` to present the iOS share sheet instead.

## 5. File resolution from Filesystem

Attachments are stored permanently in `Directory.Data` under the path `reminderly-attachments/{reminderId}.{extension}`. The `ReminderAttachment` type stores three fields:

```typescript
type ReminderAttachment = {
  fileName: string;      // Original filename ("report.pdf")
  mimeType: string;      // Resolved MIME ("application/pdf")
  storagePath: string;   // Sandbox path ("reminderly-attachments/abc-123.pdf")
};
```

`readFile` returns base64 data. This is then written to `Directory.Cache` as a temp file so that `getUri` can produce a native file URI for FileOpener.

## 6. URI/path conversion

`Capacitor.convertFileSrc()` is only used during file picking (to fetch a picked file's contents via the Fetch API). It is not used for viewing.

For viewing, the conversion is:
1. Write base64 to `Directory.Cache`
2. Call `Filesystem.getUri()` on that cache path
3. Pass the returned `file://` URI directly to `FileOpener.open()`

No manual path manipulation or `convertFileSrc` call in the viewing path.

## 7. Key files and functions

| File | Function / area | Purpose |
|---|---|---|
| `src/app/utils/attachment-storage.ts` | `saveAttachment()` | Writes base64 to `Directory.Data`, returns metadata |
| `src/app/utils/attachment-storage.ts` | `deleteAttachment()` | Best-effort delete from `Directory.Data` |
| `src/app/utils/attachment-storage.ts` | `validateAttachment()` | Checks MIME type support and 25 MB size limit |
| `src/app/utils/attachment-storage.ts` | `resolveMimeType()` | Falls back to extension mapping for generic MIMEs like `application/octet-stream` |
| `src/app/App.tsx` ~line 4898 | `onViewAttachment` handler | Read -> cache -> getUri -> FileOpener.open |
| `src/imports/NewReminderOverlay.tsx` ~line 1371 | `handleOpenAttachment()` | Same read -> cache -> open flow, with Share fallback |
| `src/imports/NewReminderOverlay.tsx` ~line 1398 | `handleShareAttachment()` | Fallback: writes to cache then calls `Share.share()` |
| `src/app/reminder-utils.ts` ~line 11 | `ReminderAttachment` type | Type definition |
| `src/app/reminder-utils.ts` ~line 122 | `loadReminders()` | Validates attachment fields on load, discards malformed |

## 8. iOS configuration and native setup

The only native requirement is installing the plugin:

```
npm install @capacitor-community/file-opener
npx cap sync ios
```

No native iOS code changes, no Info.plist entries, no Podfile modifications beyond what `cap sync` handles automatically. The plugin registers itself via Capacitor's auto-linking.

## 9. MIME type, filename, temp file and error handling

MIME resolution: if the incoming MIME is generic (`application/octet-stream`, empty, or `binary/octet-stream`), the extension is used to look up the correct MIME from a hardcoded map. If the extension has no mapping, the file is rejected at validation time.

Temp files: written to `Directory.Cache` as `reminderly-temp-preview.{ext}`. The extension is preserved so iOS Quick Look identifies the file type correctly. No explicit cleanup; the OS manages the cache directory.

Filenames: the original `fileName` is stored in metadata for display. The temp preview file uses a fixed name (`reminderly-temp-preview`) so successive opens overwrite the previous temp file.

Errors: FileOpener failures are caught silently in the main overlay. In the new-reminder overlay, failure triggers a fallback to the Share sheet. Picker cancellations are detected by checking for "canceled"/"cancel" in the error message and are ignored.

## 10. Why this approach worked

The critical insight is the three-step cache dance: read base64 from Data, write to Cache, get native URI from Cache. Earlier approaches failed because:

- Base64 data URLs are too large for inter-process communication on iOS
- `Capacitor.convertFileSrc` produces `capacitor://localhost/` URLs that are web-only and not accessible to native file viewers
- Direct `Directory.Data` paths without `getUri()` do not produce valid `file://` URIs that external apps can access

`@capacitor-community/file-opener` with a real `file://` URI from `Filesystem.getUri()` on a cache file works reliably because it hands iOS a standard file path that Quick Look and other native handlers can open directly. The `openWithDefault: true` flag lets iOS choose the appropriate viewer for each file type without any type-specific code.
