import { describe, expect, it } from 'vitest';
import {
  CSV_MISSING,
  buildDashboardCsv,
  buildDashboardCsvExports,
  collectExportColumns,
  csvFilenameForCell,
  defaultCsvFilename,
  escapeCsvField,
  seriesToValueMap,
  timestampsToMillis,
} from './dashboardCsv';

describe('dashboardCsv helpers', () => {
  it('parses HTTP, naive ISO, and SQL timestamps to the same UTC instant', () => {
    const expected = Date.UTC(2026, 0, 1, 16, 0, 0);
    const [http, naiveIso, zonedIso, sql] = timestampsToMillis([
      'Thu, 01 Jan 2026 16:00:00 GMT',
      '2026-01-01T16:00:00',
      '2026-01-01T16:00:00Z',
      '2026-01-01 16:00:00',
    ]);
    // Naive strings must be treated as UTC; parsing them in the browser's
    // local zone would shift series apart and fill rows with NAN.
    expect(http).toBe(expected);
    expect(naiveIso).toBe(expected);
    expect(zonedIso).toBe(expected);
    expect(sql).toBe(expected);
  });

  it('marks unparseable timestamps as NaN so their rows are dropped', () => {
    const [bad, num] = timestampsToMillis(['not-a-date', 1234]);
    expect(Number.isNaN(bad)).toBe(true);
    expect(num).toBe(1234);
  });

  it('escapes csv fields that contain commas or quotes', () => {
    expect(escapeCsvField('plain')).toBe('plain');
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('maps series values by timestamp and treats empty as null', () => {
    const map = seriesToValueMap([1000, 2000, 3000], [1.5, '', null]);
    expect(map.get(1000)).toBe(1.5);
    expect(map.get(2000)).toBeNull();
    expect(map.get(3000)).toBeNull();
  });

  it('builds default filenames from selected cells', () => {
    expect(csvFilenameForCell({ id: 1, name: 'Cell A' })).toBe('Cell_A.csv');
    expect(csvFilenameForCell({ id: 2 })).toBe('cell_2.csv');
    expect(defaultCsvFilename([{ id: 1, name: 'Cell A' }])).toBe('Cell_A.csv');
    expect(defaultCsvFilename([{ id: 1 }, { id: 2 }])).toBe('dirtviz-export.csv');
  });
});

describe('buildDashboardCsv', () => {
  const powerTs = ['Thu, 01 Jan 2026 00:00:00 GMT', 'Thu, 01 Jan 2026 01:00:00 GMT'];
  const terosTs = ['Thu, 01 Jan 2026 00:00:00 GMT', 'Thu, 01 Jan 2026 02:00:00 GMT'];

  it('emits a 3-row header and NAN for missing aligned values', () => {
    const csv = buildDashboardCsv({
      cells: [{ id: 1, name: 'Cell A' }],
      panelOrder: ['power-vi', 'teros'],
      historicalPowerByCell: {
        1: {
          name: 'Cell A',
          powerData: {
            timestamp: powerTs,
            v: [0.21, 0.22],
            i: [0.01, 0.02],
            p: [7, 8],
          },
        },
      },
      historicalTerosByCell: {
        1: {
          name: 'Cell A',
          terosData: {
            timestamp: terosTs,
            vwc: [40, 41],
            ec: [100, 110],
            temp: [20, 21],
            vwc_unit: '%',
          },
        },
      },
    });

    const lines = csv.trimEnd().split('\n');
    expect(lines[0]).toBe(
      'timestamp,Voltage,Current,Volumetric Water Content,Electrical Conductivity',
    );
    expect(lines[1]).toBe('s,mV,uA,%,uS/cm');
    expect(lines[2]).toBe('TIME,POWER_VOLTAGE,POWER_CURRENT,TEROS12_VWC,TEROS12_EC');

    // t0: power + teros present
    expect(lines[3]).toContain('0.21');
    expect(lines[3]).toContain('40');

    // t1: power only → teros NAN
    const hour1 = lines.find((line) => line.startsWith('1767229200'));
    expect(hour1).toBeTruthy();
    expect(hour1).toContain(CSV_MISSING);

    // t2: teros only → power NAN
    const hour2 = lines.find((line) => line.startsWith('1767232800'));
    expect(hour2).toBeTruthy();
    expect(hour2.split(',')[1]).toBe(CSV_MISSING);
    expect(hour2.split(',')[2]).toBe(CSV_MISSING);
  });

  it('prefixes column names when multiple cells are selected', () => {
    const columns = collectExportColumns({
      cells: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
      panelOrder: ['power-p'],
      historicalPowerByCell: {
        1: { powerData: { timestamp: powerTs, p: [1, 2] } },
        2: { powerData: { timestamp: powerTs, p: [3, 4] } },
      },
    });

    expect(columns.map((column) => column.name)).toEqual(['A Power', 'B Power']);
  });

  it('builds one csv export file per selected cell', () => {
    const exports = buildDashboardCsvExports({
      cells: [
        { id: 1, name: 'Cell A' },
        { id: 2, name: 'Cell B' },
      ],
      panelOrder: ['power-p'],
      historicalPowerByCell: {
        1: { powerData: { timestamp: powerTs, p: [1, 2] } },
        2: { powerData: { timestamp: powerTs, p: [3, 4] } },
      },
    });

    expect(exports).toHaveLength(2);
    expect(exports[0].filename).toBe('Cell_A.csv');
    expect(exports[1].filename).toBe('Cell_B.csv');
    // Per-cell files omit the cell-name column prefix.
    expect(exports[0].csvText.split('\n')[0]).toBe('timestamp,Power');
    expect(exports[1].csvText.split('\n')[0]).toBe('timestamp,Power');
    expect(exports[0].csvText).toContain('1');
    expect(exports[1].csvText).toContain('3');
    expect(exports[0].csvText).not.toContain('3');
  });

  it('includes unified sensor panels from the historical sensor cache', () => {
    const csv = buildDashboardCsv({
      cells: [{ id: 1, name: 'Cell A' }],
      panelOrder: ['u:co2'],
      historicalSensorByKey: {
        '1:co2:co2': {
          timestamp: powerTs,
          data: [400, 410],
          unit: 'ppm',
        },
      },
    });

    const lines = csv.trimEnd().split('\n');
    expect(lines[0]).toBe('timestamp,co2');
    expect(lines[1]).toBe('s,ppm');
    expect(lines[2]).toBe('TIME,CO2');
    expect(lines[3]).toContain('400');
  });

  it('returns header-only csv when caches are empty', () => {
    const csv = buildDashboardCsv({
      cells: [{ id: 1, name: 'Cell A' }],
      panelOrder: ['power-vi'],
      historicalPowerByCell: {},
    });
    expect(csv).toBe('timestamp\ns\nTIME\n');
  });

  it('exports db sensor panels from #795 s:{id} layout entries', () => {
    const csv = buildDashboardCsv({
      cells: [{ id: 1, name: 'Cell A' }],
      panelOrder: ['s:37'],
      cellSensorsById: {
        1: [{ id: 37, name: 'rocketlogger', measurement: 'soil_moisture', unit: '%' }],
      },
      historicalSensorByKey: {
        '1:rocketlogger:soil_moisture': {
          timestamp: powerTs,
          data: [12.5, 13.1],
          unit: '%',
        },
      },
    });

    const lines = csv.trimEnd().split('\n');
    expect(lines[0]).toBe('timestamp,soil_moisture');
    expect(lines[1]).toBe('s,%');
    expect(lines[2]).toBe('TIME,ROCKETLOGGER');
    expect(lines[3]).toContain('12.5');
  });

  it('fills NAN when power and teros timestamps are intentionally misaligned', () => {
    const csv = buildDashboardCsv({
      cells: [{ id: 1, name: 'Cell A' }],
      panelOrder: ['power-vi', 'teros'],
      historicalPowerByCell: {
        1: {
          powerData: {
            timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'],
            v: [1],
            i: [2],
          },
        },
      },
      historicalTerosByCell: {
        1: {
          terosData: {
            timestamp: ['Thu, 01 Jan 2026 00:30:00 GMT'],
            vwc: [40],
            ec: [100],
            vwc_unit: '%',
          },
        },
      },
    });

    const lines = csv.trimEnd().split('\n');
    expect(lines).toHaveLength(5); // 3 header + 2 data
    const powerOnly = lines[3].split(',');
    const terosOnly = lines[4].split(',');
    expect(powerOnly[1]).toBe('1');
    expect(powerOnly[3]).toBe(CSV_MISSING); // VWC missing on power timestamp
    expect(terosOnly[1]).toBe(CSV_MISSING); // Voltage missing on teros timestamp
    expect(terosOnly[3]).toBe('40');
  });
});

describe('buildDashboardCsv scale', () => {
  it('builds a large aligned export within a reproducible budget', () => {
    const pointCount = 50_000;
    const timestamps = Array.from({ length: pointCount }, (_, i) => i * 1000);
    const values = Array.from({ length: pointCount }, (_, i) => i * 0.01);

    const started = performance.now();
    const csv = buildDashboardCsv({
      cells: [{ id: 1, name: 'Cell A' }],
      panelOrder: ['power-vi', 'power-p'],
      historicalPowerByCell: {
        1: {
          powerData: {
            timestamp: timestamps,
            v: values,
            i: values,
            p: values,
          },
        },
      },
    });
    const elapsedMs = performance.now() - started;

    const lines = csv.trimEnd().split('\n');
    expect(lines).toHaveLength(3 + pointCount);
    expect(lines[0]).toContain('Voltage');
    // Keep this generous so CI flakes are unlikely, but still catches catastrophic regressions.
    expect(elapsedMs).toBeLessThan(15_000);
  });
});
