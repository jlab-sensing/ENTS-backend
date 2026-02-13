import { describe, expect, it, vi } from 'vitest';
import { addLogger } from './logger';

describe('issue595 addLogger payload behavior', () => {
  it('sends device_eui and omits TTN fields when LoRaWAN credentials are incomplete', async () => {
    const axiosPrivate = {
      post: vi.fn().mockResolvedValue({ data: { ok: true } }),
    };

    await addLogger(
      'Logger A',
      'ents',
      '0080E1150546D093',
      undefined,
      undefined,
      'desc',
      'test@example.com',
      axiosPrivate,
    );

    const payload = axiosPrivate.post.mock.calls[0][1];
    expect(payload.device_eui).toBe('0080E1150546D093');
    expect(payload.dev_eui).toBeUndefined();
    expect(payload.join_eui).toBeUndefined();
    expect(payload.app_key).toBeUndefined();
  });

  it('sends TTN registration fields only when all credentials are present', async () => {
    const axiosPrivate = {
      post: vi.fn().mockResolvedValue({ data: { ok: true } }),
    };

    await addLogger(
      'Logger B',
      'ents',
      '0080E1150546D093',
      '0101010101010101',
      'CEC24E6A258B2B20A5A7C05ABD2C1724',
      'desc',
      'test@example.com',
      axiosPrivate,
    );

    const payload = axiosPrivate.post.mock.calls[0][1];
    expect(payload.device_eui).toBe('0080E1150546D093');
    expect(payload.dev_eui).toBe('0080E1150546D093');
    expect(payload.join_eui).toBe('0101010101010101');
    expect(payload.app_key).toBe('CEC24E6A258B2B20A5A7C05ABD2C1724');
  });
});
