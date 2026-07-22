import { describe, expect, it } from 'vitest';
import {
  CSV_MISSING,
  buildDashboardCsv,
  collectExportColumns,
  defaultCsvFilename,
  escapeCsvField,
  seriesToValueMap,
} from './dashboardCsv';

describe('dashboardCsv helpers', () => {
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
});
