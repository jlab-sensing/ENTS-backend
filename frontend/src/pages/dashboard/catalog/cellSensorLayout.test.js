import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDefaultPanelOrder,
  panelIdsFromCellSensors,
  sortPanelIds,
  panelsMissingForCells,
  availablePanelIdsForCells,
} from './cellSensorLayout';

vi.mock('../../../services/cell', () => ({
  getCellSensors: vi.fn(),
}));

vi.mock('../../../services/catalog', () => ({
  getSensorCatalog: vi.fn(),
}));

import { getCellSensors } from '../../../services/cell';
import { getSensorCatalog } from '../../../services/catalog';

describe('panelIdsFromCellSensors', () => {
  it('maps bme280 sensor rows to unified panel ids and s:{id} panels', () => {
    const cellSensorsById = {
      '1': [{ id: 12, name: 'co2', measurement: 'co2' }],
    };
    const ids = panelIdsFromCellSensors(cellSensorsById, [1]);
    expect(ids.has('u:co2')).toBe(true);
    expect(ids.has('s:12')).toBe(true);
  });
});

describe('sortPanelIds', () => {
  it('puts power-vi first then builtins then unified', () => {
    const ordered = sortPanelIds(new Set(['u:co2', 'teros', 'power-vi', 'power-p']));
    expect(ordered[0]).toBe('power-vi');
    expect(ordered).toContain('power-p');
    expect(ordered.indexOf('power-vi')).toBeLessThan(ordered.indexOf('u:co2'));
  });

  it('appends s: panels after builtins and unified, sorted numerically', () => {
    const ordered = sortPanelIds(new Set(['s:12', 'u:co2', 's:2', 'power-vi']));
    expect(ordered[0]).toBe('power-vi');
    expect(ordered.indexOf('u:co2')).toBeLessThan(ordered.indexOf('s:2'));
    expect(ordered.indexOf('s:2')).toBeLessThan(ordered.indexOf('s:12'));
  });
});

describe('panelsMissingForCells', () => {
  it('returns panels in layout that are not available for cells', () => {
    const available = new Set(['power-vi', 'teros']);
    expect(panelsMissingForCells(['power-vi', 'u:co2', 'teros'], available)).toEqual(['u:co2']);
  });
});

describe('availablePanelIdsForCells', () => {
  it('unions catalog ids with sensor-derived ids', () => {
    const cellSensorsById = { '1': [{ name: 'co2', measurement: 'co2' }] };
    const available = availablePanelIdsForCells(cellSensorsById, [1], ['power-vi']);
    expect(available.has('power-vi')).toBe(true);
    expect(available.has('u:co2')).toBe(true);
  });
});

describe('buildDefaultPanelOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges catalog and sensor-derived panels with power-vi first', async () => {
    getCellSensors.mockResolvedValue([{ id: 5, name: 'co2', measurement: 'co2' }]);
    getSensorCatalog.mockResolvedValue([
      { panel_id: 'power-vi', label: 'Voltage & Current' },
      { panel_id: 'teros', label: 'VWC & EC' },
      {
        panel_id: 's:5',
        kind: 'sensor',
        sensor_id: 5,
        sensor_name: 'co2',
        measurement: 'co2',
      },
    ]);

    const { panelOrder, cellSensorsById } = await buildDefaultPanelOrder([1]);

    expect(panelOrder[0]).toBe('power-vi');
    expect(panelOrder).toContain('teros');
    expect(panelOrder).toContain('u:co2');
    expect(panelOrder).toContain('s:5');
    expect(cellSensorsById['1']).toHaveLength(1);
  });
});
