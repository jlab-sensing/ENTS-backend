import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateEquationOnServer } from './equation';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('validateEquationOnServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts expression and cell_ids to the validate endpoint', async () => {
    axios.post.mockResolvedValue({
      data: { ok: true, refs: ['1:vwc', '1:temp'] },
    });

    const result = await validateEquationOnServer('1:vwc / 1:temp', [1]);

    expect(axios.post).toHaveBeenCalledWith(`${process.env.PUBLIC_URL}/api/equations/validate`, {
      expression: '1:vwc / 1:temp',
      cell_ids: [1],
    });
    expect(result.ok).toBe(true);
  });

  it('returns server error message without throwing', async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: 'Reference 2:vwc uses cell 2 which is not selected' } },
    });

    const result = await validateEquationOnServer('2:vwc', [1]);
    expect(result.error).toMatch(/not selected/);
  });

  it('omits cell_ids when none are provided', async () => {
    axios.post.mockResolvedValue({ data: { ok: true, refs: [] } });

    await validateEquationOnServer('1 + 2', []);

    expect(axios.post).toHaveBeenCalledWith(`${process.env.PUBLIC_URL}/api/equations/validate`, {
      expression: '1 + 2',
    });
  });
});
