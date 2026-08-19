import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddChartModal from './AddChartModal';

vi.mock('../../../services/catalog', () => ({
  getSensorCatalog: vi.fn(),
}));

import { getSensorCatalog } from '../../../services/catalog';

describe('AddChartModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads catalog entries and adds a chart', async () => {
    const user = userEvent.setup();
    const onAddPanel = vi.fn();
    const onClose = vi.fn();

    getSensorCatalog.mockResolvedValue([
      {
        panel_id: 'power-vi',
        label: 'Voltage & Current',
        description: 'power',
        category: 'power',
        kind: 'builtin',
      },
      {
        panel_id: 'u:co2',
        label: 'CO₂',
        description: 'co2',
        category: 'generic',
        kind: 'unified',
        unified_type: 'co2',
      },
    ]);

    render(
      <AddChartModal
        open
        onClose={onClose}
        selectedCells={[{ id: 1, name: 'Cell A' }]}
        panelOrder={['power-vi']}
        onAddPanel={onAddPanel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('CO₂')).toBeInTheDocument();
    });

    expect(screen.queryByText('Voltage & Current')).not.toBeInTheDocument();

    await user.click(screen.getByText('CO₂'));
    expect(onAddPanel).toHaveBeenCalledWith('u:co2');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows cell picker when multiple cells are selected', async () => {
    getSensorCatalog.mockResolvedValue([]);

    render(
      <AddChartModal
        open
        onClose={vi.fn()}
        selectedCells={[
          { id: 1, name: 'Cell A' },
          { id: 2, name: 'Cell B' },
        ]}
        panelOrder={[]}
        onAddPanel={vi.fn()}
      />,
    );

    expect(await screen.findByText('Cell')).toBeInTheDocument();
  });

  it('hides a same-type sensor chart that is already on the dashboard from another cell', async () => {
    getSensorCatalog.mockResolvedValue([
      {
        panel_id: 's:2030',
        kind: 'sensor',
        sensor_id: 2030,
        sensor_name: 'watermark',
        measurement: 'soil_tension',
        label: 'Soil Tension',
      },
    ]);

    render(
      <AddChartModal
        open
        onClose={vi.fn()}
        selectedCells={[
          { id: 407, name: 'Cell A' },
          { id: 408, name: 'Cell B' },
        ]}
        panelOrder={['s:2029']}
        cellSensorsById={{
          407: [{ id: 2029, name: 'watermark', measurement: 'soil_tension' }],
          408: [{ id: 2030, name: 'watermark', measurement: 'soil_tension' }],
        }}
        onAddPanel={vi.fn()}
      />,
    );

    expect(await screen.findByText('All available charts are already on the dashboard.')).toBeInTheDocument();
    expect(screen.queryByText('Soil Tension')).not.toBeInTheDocument();
  });
});
