import { Filesystem, Directory } from "@capacitor/filesystem";
import type { ReminderAttachment } from "../reminder-utils";

// Attachment storage directory within the app's data sandbox
const ATTACHMENT_DIR = "reminderly-attachments";

// Maximum attachment file size in bytes (25 MB)
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

// Supported MIME types for V1
export const SUPPORTED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/webp",
  // Documents
  "application/pdf",
  "text/plain",
  "application/rtf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

// Extension-to-MIME-type fallback for missing/generic MIME types
const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  rtf: "application/rtf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export type AttachmentValidationResult =
  | { valid: true }
  | { valid: false; reason: "too-large" | "unsupported-type" };

/**
 * Extract the lowercase file extension from a filename.
 * Returns empty string if no extension found.
 */
function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * Resolve MIME type: use provided MIME if it's a known supported type,
 * fall back to extension lookup for missing/generic MIME types,
 * or return the original MIME type for explicit rejection.
 */
export function resolveMimeType(fileName: string, mimeType: string): string {
  // If the MIME type is a known supported type, use it directly
  if (SUPPORTED_MIME_TYPES.has(mimeType)) return mimeType;

  // For missing or generic MIME types, try extension fallback
  const isGeneric =
    !mimeType ||
    mimeType === "application/octet-stream" ||
    mimeType === "binary/octet-stream";

  if (isGeneric) {
    const ext = getExtension(fileName);
    const resolved = EXTENSION_TO_MIME[ext];
    if (resolved) return resolved;
  }

  // Return the original unsupported MIME type so the caller can reject it
  return mimeType;
}

/**
 * Validate an attachment before saving.
 * Checks MIME type (with extension fallback for generic types) then file size.
 */
export function validateAttachment(
  fileName: string,
  mimeType: string,
  size: number,
): AttachmentValidationResult {
  const resolved = resolveMimeType(fileName, mimeType);
  if (!SUPPORTED_MIME_TYPES.has(resolved)) {
    return { valid: false, reason: "unsupported-type" };
  }

  if (size > MAX_ATTACHMENT_SIZE) {
    return { valid: false, reason: "too-large" };
  }

  return { valid: true };
}

/**
 * Build the deterministic storage path for a reminder's attachment.
 */
function buildStoragePath(reminderId: string, fileName: string): string {
  const ext = getExtension(fileName);
  const suffix = ext ? `.${ext}` : "";
  return `${ATTACHMENT_DIR}/${reminderId}${suffix}`;
}

/**
 * Save an attachment file to the app's filesystem sandbox.
 * Returns the attachment metadata to store on the reminder.
 */
export async function saveAttachment(
  reminderId: string,
  fileName: string,
  mimeType: string,
  dataBase64: string,
): Promise<ReminderAttachment> {
  const resolved = resolveMimeType(fileName, mimeType);
  const storagePath = buildStoragePath(reminderId, fileName);

  await Filesystem.writeFile({
    path: storagePath,
    data: dataBase64,
    directory: Directory.Data,
    recursive: true,
  });

  return {
    fileName,
    mimeType: resolved,
    storagePath,
  };
}

/**
 * Delete an attachment file from the filesystem.
 * Best-effort: failures are silently caught.
 */
export async function deleteAttachment(storagePath: string): Promise<void> {
  try {
    await Filesystem.deleteFile({
      path: storagePath,
      directory: Directory.Data,
    });
  } catch {
    // Best-effort: file may already be missing
  }
}
