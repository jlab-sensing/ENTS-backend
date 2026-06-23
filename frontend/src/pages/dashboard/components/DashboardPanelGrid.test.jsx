import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardPanelGrid from './DashboardPanelGrid';

vi.mock('./PowerCharts', () => ({
  default: () => <div>Power chart panel</div>,
}));

vi.mock('./TerosCharts', () => ({
  default: () => <div>TEROS chart panel</div>,
}));

vi.mock('./UnifiedChart', () => ({
  default: () => <div>Unified chart panel</div>,
}));

describe('DashboardPanelGrid', () => {
  const chartProps = {
    cells: [{ id: 1, name: 'Cell A' }],
    startDate: null,
    endDate: null,
    stream: false,
    liveData: [],
    processedPower: {},
    processedTeros: {},
    processedSensors: {},
    cellSensorsById: {},
    historicalLoading: false,
    centralHistoricalActive: { power: true, teros: false, sensors: false },
    onPowerDataStatusChange: vi.fn(),
    onTerosDataStatusChange: vi.fn(),
  };

  it('renders panels for known panel ids', () => {
    render(
      <DashboardPanelGrid
        panelOrder={['power-vi', 'u:co2']}
        onPanelOrderChange={vi.fn()}
        onRemovePanel={vi.fn()}
        panelColumns={2}
        chartProps={chartProps}
        canRemove
      />,
    );

    expect(screen.getByText('Power chart panel')).toBeInTheDocument();
    expect(screen.getByText('Unified chart panel')).toBeInTheDocument();
  });

  it('returns null when panel order is empty', () => {
    const { container } = render(
      <DashboardPanelGrid
        panelOrder={[]}
        onPanelOrderChange={vi.fn()}
        onRemovePanel={vi.fn()}
        panelColumns={2}
        chartProps={chartProps}
        canRemove
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
