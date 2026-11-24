import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import { shareLogger } from './logger';

describe('shareLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the email to the logger share endpoint with the access token', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValueOnce({ data: { message: 'Logger shared successfully' } });

    const data = await shareLogger(7, 'friend@example.com', 'token');

    expect(data).toEqual({ message: 'Logger shared successfully' });
    expect(post).toHaveBeenCalledWith(
      `${process.env.PUBLIC_URL}/api/logger/7/share`,
      { email: 'friend@example.com' },
      { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' } },
    );
  });

  it('logs and rethrows when the request fails', async () => {
    const error = { response: { data: { message: 'Logger not found' } } };
    vi.spyOn(axios, 'post').mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(shareLogger(7, 'friend@example.com', 'token')).rejects.toBe(error);
    expect(consoleSpy).toHaveBeenCalledWith('Error sharing logger:', { message: 'Logger not found' });
  });

  it('logs the error message when there is no response', async () => {
    const error = new Error('Network Error');
    vi.spyOn(axios, 'post').mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(shareLogger(7, 'friend@example.com', 'token')).rejects.toBe(error);
    expect(consoleSpy).toHaveBeenCalledWith('Error sharing logger:', 'Network Error');
  });
});
