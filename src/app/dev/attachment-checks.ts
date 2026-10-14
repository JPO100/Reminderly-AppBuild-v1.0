/**
 * Reminder Attachments Checks
 *
 * Pure/in-memory checks for attachment validation, MIME resolution,
 * size limits, and loadReminders compatibility.
 *
 * STATELESS: Returns fresh check array on each call - no side effects.
 */

import type { Check } from './check-system';
import { loadReminders, STORAGE_KEY } from '../reminder-utils';
import type { ReminderAttachment } from '../reminder-utils';
import {
  validateAttachment,
  MAX_ATTACHMENT_SIZE,
} from '../utils/attachment-storage';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function withIsolatedKey(key: string, fn: () => void): void {
  const saved = localStorage.getItem(key);
  try {
    fn();
  } finally {
    if (saved === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, saved);
    }
  }
}

export function getAttachmentChecks(): Check[] {
  return [
    {
      id: 'attachment-accept-image',
      name: 'Supported image MIME accepted',
      run: () => {
        const result = validateAttachment('photo.jpg', 'image/jpeg', 1000);
        assert(result.valid === true, 'Expected image/jpeg to be accepted');
      },
    },

    {
      id: 'attachment-accept-document',
      name: 'Supported document MIME accepted',
      run: () => {
        const result = validateAttachment('doc.pdf', 'application/pdf', 1000);
        assert(result.valid === true, 'Expected application/pdf to be accepted');
      },
    },

    {
      id: 'attachment-reject-unsupported',
      name: 'Unsupported MIME rejected',
      run: () => {
        const result = validateAttachment('clip.mp4', 'video/mp4', 1000);
        assert(result.valid === false && result.reason === 'unsupported-type', 'Expected video/mp4 to be rejected as unsupported-type');
      },
    },

    {
      id: 'attachment-fallback-generic-supported-ext',
      name: 'Generic MIME with supported extension accepted via fallback',
      run: () => {
        const result = validateAttachment('photo.jpg', 'application/octet-stream', 1000);
        assert(result.valid === true, 'Expected octet-stream + .jpg to be accepted via extension fallback');
      },
    },

    {
      id: 'attachment-fallback-generic-unsupported-ext',
      name: 'Generic MIME with unsupported extension rejected',
      run: () => {
        const result = validateAttachment('file.xyz', 'application/octet-stream', 1000);
        assert(result.valid === false && result.reason === 'unsupported-type', 'Expected octet-stream + .xyz to be rejected');
      },
    },

    {
      id: 'attachment-no-fallback-for-explicit-unsupported',
      name: 'Explicit unsupported MIME not rescued by supported extension',
      run: () => {
        const result = validateAttachment('fake.jpg', 'video/mp4', 1000);
        assert(result.valid === false && result.reason === 'unsupported-type', 'Expected video/mp4 rejected despite .jpg extension');
      },
    },

    {
      id: 'attachment-size-at-limit',
      name: 'File exactly at 25 MB accepted',
      run: () => {
        const result = validateAttachment('photo.jpg', 'image/jpeg', MAX_ATTACHMENT_SIZE);
        assert(result.valid === true, 'Expected file at exactly 25 MB to be accepted');
      },
    },

    {
      id: 'attachment-size-over-limit',
      name: 'File over 25 MB rejected',
      run: () => {
        const result = validateAttachment('photo.jpg', 'image/jpeg', MAX_ATTACHMENT_SIZE + 1);
        assert(result.valid === false && result.reason === 'too-large', 'Expected file over 25 MB to be rejected as too-large');
      },
    },

    {
      id: 'attachment-unsupported-overrides-size',
      name: 'Unsupported type reported before size limit',
      run: () => {
        const result = validateAttachment('clip.mp4', 'video/mp4', MAX_ATTACHMENT_SIZE + 1);
        assert(result.valid === false && result.reason === 'unsupported-type', 'Expected unsupported-type even when file also exceeds size limit');
      },
    },

    {
      id: 'attachment-load-without-attachment',
      name: 'Existing reminder without attachment loads normally',
      run: () => {
        withIsolatedKey(STORAGE_KEY, () => {
          const reminder = {
            id: 'test-no-att',
            originalText: 'Buy milk',
            displayText: 'Buy milk',
            createdAt: Date.now(),
            schedule: { kind: 'sometime' },
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify([reminder]));
          const loaded = loadReminders();
          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].attachment === undefined, 'Expected no attachment on legacy reminder');
        });
      },
    },

    {
      id: 'attachment-load-valid-attachment',
      name: 'Valid attachment metadata survives loading',
      run: () => {
        withIsolatedKey(STORAGE_KEY, () => {
          const attachment: ReminderAttachment = {
            fileName: 'photo.jpg',
            mimeType: 'image/jpeg',
            storagePath: 'reminderly-attachments/test-att.jpg',
          };
          const reminder = {
            id: 'test-att',
            originalText: 'Notes',
            displayText: 'Notes',
            createdAt: Date.now(),
            schedule: { kind: 'sometime' },
            attachment,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify([reminder]));
          const loaded = loadReminders();
          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].attachment != null, 'Expected attachment to be preserved');
          assert(loaded[0].attachment!.fileName === 'photo.jpg', 'Wrong fileName');
          assert(loaded[0].attachment!.storagePath === 'reminderly-attachments/test-att.jpg', 'Wrong storagePath');
        });
      },
    },

    {
      id: 'attachment-load-malformed-discarded',
      name: 'Malformed attachment discarded without losing reminder',
      run: () => {
        withIsolatedKey(STORAGE_KEY, () => {
          const reminder = {
            id: 'test-bad-att',
            originalText: 'Groceries',
            displayText: 'Groceries',
            createdAt: Date.now(),
            schedule: { kind: 'sometime' },
            attachment: { fileName: '', mimeType: 'image/jpeg', storagePath: 'path.jpg' },
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify([reminder]));
          const loaded = loadReminders();
          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].attachment === undefined, 'Expected malformed attachment to be discarded');
        });
      },
    },

    {
      id: 'attachment-load-explicit-null-cleared',
      name: 'Reminder with attachment explicitly set to null loads without attachment',
      run: () => {
        withIsolatedKey(STORAGE_KEY, () => {
          const reminder = {
            id: 'test-null-att',
            originalText: 'Cleared',
            displayText: 'Cleared',
            createdAt: Date.now(),
            schedule: { kind: 'sometime' },
            attachment: null,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify([reminder]));
          const loaded = loadReminders();
          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].attachment == null, 'Expected null attachment to load as absent');
        });
      },
    },

    {
      id: 'attachment-survives-soft-delete',
      name: 'Soft-deleted reminder preserves attachment metadata',
      run: () => {
        withIsolatedKey(STORAGE_KEY, () => {
          const attachment: ReminderAttachment = {
            fileName: 'receipt.pdf',
            mimeType: 'application/pdf',
            storagePath: 'reminderly-attachments/test-soft.pdf',
          };
          const reminder = {
            id: 'test-soft-del',
            originalText: 'Meeting notes',
            displayText: 'Meeting notes',
            createdAt: Date.now(),
            schedule: { kind: 'sometime' },
            deletedAt: Date.now(),
            attachment,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify([reminder]));
          const loaded = loadReminders();
          assert(loaded.length === 1, `Expected 1 reminder, got ${loaded.length}`);
          assert(loaded[0].deletedAt != null, 'Expected deletedAt to be preserved');
          assert(loaded[0].attachment != null, 'Expected attachment to survive soft-delete');
          assert(loaded[0].attachment!.fileName === 'receipt.pdf', 'Wrong fileName after soft-delete');
          assert(loaded[0].attachment!.storagePath === 'reminderly-attachments/test-soft.pdf', 'Wrong storagePath after soft-delete');
        });
      },
    },
  ];
}
