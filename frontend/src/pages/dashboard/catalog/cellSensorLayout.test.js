import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDefaultPanelOrder,
  chartIdentityForCatalogEntry,
  chartIdentityForPanel,
  dedupeEquivalentPanels,
  isCompleteCellSwap,
  isInteractiveCellAdd,
  mergePanelsForAddedCells,
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

describe('mergePanelsForAddedCells', () => {
  it('appends panels from the new cell that are not yet in prevOrder', () => {
    const prev = ['power-vi', 'teros'];
    const newAvailable = new Set(['power-vi', 'teros', 'temp']);
    const result = mergePanelsForAddedCells(prev, newAvailable, {});
    expect(result).toContain('temp');
    expect(result.indexOf('power-vi')).toBeLessThan(result.indexOf('temp'));
  });

  it('does not duplicate panels already in prevOrder', () => {
    const prev = ['power-vi', 'teros'];
    const newAvailable = new Set(['power-vi', 'teros']);
    const result = mergePanelsForAddedCells(prev, newAvailable, {});
    expect(result.filter((p) => p === 'power-vi')).toHaveLength(1);
    expect(result.filter((p) => p === 'teros')).toHaveLength(1);
  });

  it('preserves original panel order before appended panels', () => {
    const prev = ['teros', 'power-vi'];
    const newAvailable = new Set(['teros', 'power-vi', 'temp']);
    const result = mergePanelsForAddedCells(prev, newAvailable, {});
    expect(result[0]).toBe('teros');
    expect(result[1]).toBe('power-vi');
  });

  it('returns only new panels when prevOrder is empty', () => {
    const result = mergePanelsForAddedCells([], new Set(['power-vi', 'teros']), {});
    expect(result).toContain('power-vi');
    expect(result).toContain('teros');
  });
});

describe('isCompleteCellSwap', () => {
  it('returns false on initial load (prevCellIds is null)', () => {
    expect(isCompleteCellSwap(null, ['3'])).toBe(false);
  });

  it('returns false when prev is empty', () => {
    expect(isCompleteCellSwap(new Set(), ['3'])).toBe(false);
  });

  it('returns true when all previous cells are replaced with entirely new cells', () => {
    expect(isCompleteCellSwap(new Set(['1']), ['3'])).toBe(true);
  });

  it('returns true when multi-cell selection is fully replaced', () => {
    expect(isCompleteCellSwap(new Set(['1', '2']), ['3', '4'])).toBe(true);
  });

  it('returns false when any cell overlaps (add case)', () => {
    expect(isCompleteCellSwap(new Set(['1']), ['1', '3'])).toBe(false);
  });

  it('returns false when any cell overlaps (partial swap)', () => {
    expect(isCompleteCellSwap(new Set(['1', '2']), ['1', '3'])).toBe(false);
  });

  it('returns false when next set is empty', () => {
    expect(isCompleteCellSwap(new Set(['1']), [])).toBe(false);
  });

  it('handles numeric and string IDs consistently', () => {
    expect(isCompleteCellSwap(new Set(['1']), [3])).toBe(true);
  });
});

describe('isInteractiveCellAdd', () => {
  it('returns false on initial load (prevCellIds is null)', () => {
    expect(isInteractiveCellAdd(null, ['1', '2'])).toBe(false);
  });

  it('returns false when prev is empty', () => {
    expect(isInteractiveCellAdd(new Set(), ['1'])).toBe(false);
  });

  it('returns true when new cell is added to existing selection', () => {
    expect(isInteractiveCellAdd(new Set(['1']), ['1', '3'])).toBe(true);
  });

  it('returns false when cell is removed (shrinking selection)', () => {
    expect(isInteractiveCellAdd(new Set(['1', '3']), ['1'])).toBe(false);
  });

  it('returns false when cells are swapped (different set)', () => {
    expect(isInteractiveCellAdd(new Set(['1']), ['3'])).toBe(false);
  });

  it('returns false when same cells re-selected (no change in size)', () => {
    expect(isInteractiveCellAdd(new Set(['1', '3']), ['1', '3'])).toBe(false);
  });

  it('handles numeric and string cell IDs consistently', () => {
    expect(isInteractiveCellAdd(new Set(['1']), [1, 3])).toBe(true);
  });
});

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
    expect(panelOrder).not.toContain('s:5');
    expect(cellSensorsById['1']).toHaveLength(1);
  });
});

describe('chart identity / equivalent panel dedupe', () => {
  const soilTension = (id, cellId) => ({
    id,
    name: 'watermark',
    measurement: 'soil_tension',
    cellId,
  });

  it('groups per-cell s: panels of the same sensor type', () => {
    const cellSensorsById = {
      407: [soilTension(2029, 407)],
      408: [soilTension(2030, 408)],
      2578: [soilTension(2028, 2578)],
    };

    expect(chartIdentityForPanel('s:2029', cellSensorsById)).toBe('sensor:watermark:soil_tension');
    expect(chartIdentityForPanel('s:2030', cellSensorsById)).toBe(
      chartIdentityForPanel('s:2029', cellSensorsById),
    );
    expect(
      dedupeEquivalentPanels(['s:2029', 's:2030', 's:2028', 's:118'], cellSensorsById),
    ).toEqual(['s:2029', 's:118']);
  });

  it('collapses a db sensor panel onto its unified catalog counterpart', () => {
    const cellSensorsById = {
      1: [{ id: 12, name: 'co2', measurement: 'co2' }],
    };
    expect(chartIdentityForPanel('s:12', cellSensorsById)).toBe('u:co2');
    expect(dedupeEquivalentPanels(['u:co2', 's:12'], cellSensorsById)).toEqual(['u:co2']);
  });

  it('does not collapse generic POWER_VOLTAGE onto builtin power-vi', () => {
    const cellSensorsById = {
      1: [
        { id: 7, name: 'POWER_VOLTAGE', measurement: 'Voltage' },
        { id: 8, name: 'BME280_TEMP', measurement: 'Temperature' },
      ],
    };

    expect(chartIdentityForPanel('s:7', cellSensorsById)).toBe('sensor:power_voltage:voltage');
    expect(panelIdsFromCellSensors(cellSensorsById, [1]).has('power-vi')).toBe(false);
    expect(
      dedupeEquivalentPanels(['power-vi', 's:7', 's:8'], cellSensorsById),
    ).toEqual(['power-vi', 's:7', 's:8']);
  });

  it('treats a catalog row for another cell as the same chart', () => {
    expect(
      chartIdentityForCatalogEntry({
        panelId: 's:2030',
        kind: 'sensor',
        sensorName: 'watermark',
        measurement: 'soil_tension',
      }),
    ).toBe('sensor:watermark:soil_tension');
  });
});
