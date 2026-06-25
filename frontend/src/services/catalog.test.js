import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSensorCatalog } from './catalog';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('getSensorCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches catalog entries for a cell', async () => {
    axios.get.mockResolvedValue({
      data: {
        entries: [{ panel_id: 'power-vi', label: 'Voltage & Current' }],
      },
    });

    const entries = await getSensorCatalog(1);
    expect(axios.get).toHaveBeenCalledWith(`${process.env.PUBLIC_URL}/api/catalog/sensors`, {
      params: { cell_id: 1 },
    });
    expect(entries).toEqual([{ panel_id: 'power-vi', label: 'Voltage & Current' }]);
  });

  it('returns empty array when response has no entries', async () => {
    axios.get.mockResolvedValue({ data: {} });
    expect(await getSensorCatalog(2)).toEqual([]);
  });
});
