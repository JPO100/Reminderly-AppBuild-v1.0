import { describe, it, expect, vi, beforeEach } from 'vitest';

// Phase 3 C1: with Reminders off, every pending and delivered Reminderly notification is cleared, by identifier.
const calls: string[] = [];
const plugin = {
  requestPermissions: vi.fn(async () => { calls.push('requestPermissions'); return { display: 'granted' }; }),
  getPending: vi.fn(async () => { calls.push('getPending'); return { notifications: [{ id: 11 }, { id: 2147483647 }] }; }),
  cancel: vi.fn(async (_: unknown) => { calls.push('cancel'); }),
  getDeliveredNotifications: vi.fn(async () => { calls.push('getDelivered'); return { notifications: [{ id: 7, title: 'Due' }] }; }),
  removeDeliveredNotifications: vi.fn(async (_: unknown) => { calls.push('removeDelivered'); }),
};
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));

const { clearReminderNotifications } = await import('../notifications');

describe('clearReminderNotifications', () => {
  beforeEach(() => { calls.length = 0; vi.clearAllMocks(); });

  it('cancels pending first, then removes delivered, by identifier, without asking for permission', async () => {
    const result = await clearReminderNotifications();
    expect(calls).toEqual(['getPending', 'cancel', 'getDelivered', 'removeDelivered']);
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: 11 }, { id: 2147483647 }] });
    expect(plugin.removeDeliveredNotifications).toHaveBeenCalledWith({ notifications: [{ id: 7, title: 'Due' }] });
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    expect(result).toEqual({ pending: 2, delivered: 1 });
  });

  it('makes no cancel or remove call when nothing is pending or delivered', async () => {
    plugin.getPending.mockResolvedValueOnce({ notifications: [] });
    plugin.getDeliveredNotifications.mockResolvedValueOnce({ notifications: [] });
    await clearReminderNotifications();
    expect(plugin.cancel).not.toHaveBeenCalled();
    expect(plugin.removeDeliveredNotifications).not.toHaveBeenCalled();
  });
});
