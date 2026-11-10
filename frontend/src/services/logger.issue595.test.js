import { describe, expect, it, vi } from 'vitest';
import { addLogger } from './logger';

describe('issue595 addLogger payload behavior', () => {
  it('omits TTN fields when there is no Device EUI', async () => {
    const axiosPrivate = {
      post: vi.fn().mockResolvedValue({ data: { ok: true } }),
    };

    await addLogger('Logger A', 'ents', undefined, 'desc', 'test@example.com', axiosPrivate);

    const payload = axiosPrivate.post.mock.calls[0][1];
    expect(payload.device_eui).toBeUndefined();
    expect(payload.dev_eui).toBeUndefined();
  });

  it('sends the Device EUI for TTN registration without Join EUI or App Key', async () => {
    const axiosPrivate = {
      post: vi.fn().mockResolvedValue({ data: { ok: true } }),
    };

    await addLogger('Logger B', 'ents', '0080E1150546D093', 'desc', 'test@example.com', axiosPrivate);

    const payload = axiosPrivate.post.mock.calls[0][1];
    expect(payload.device_eui).toBe('0080E1150546D093');
    expect(payload.dev_eui).toBe('0080E1150546D093');
    expect(payload).not.toHaveProperty('join_eui');
    expect(payload).not.toHaveProperty('app_key');
  });
});
