import { describe, it, expect } from 'vitest';
import { CHART_CONFIGS, DASHBOARD_UNIFIED_CHART_TYPES } from './chartConfigs';

// ─── CHART_CONFIGS structure ─────────────────────────────────────────────────

describe('CHART_CONFIGS', () => {
    const entries = Object.entries(CHART_CONFIGS);

    it('is a non-empty object', () => {
        expect(typeof CHART_CONFIGS).toBe('object');
        expect(entries.length).toBeGreaterThan(0);
    });

    it.each(entries)('%s — has required keys: sensor_name, measurements, units, axisIds, chartId', (key, config) => {
        expect(config).toHaveProperty('sensor_name');
        expect(config).toHaveProperty('measurements');
        expect(config).toHaveProperty('units');
        expect(config).toHaveProperty('axisIds');
        expect(config).toHaveProperty('chartId');
    });

    it.each(entries)('%s — measurements, units, and axisIds arrays have the same length', (key, config) => {
        expect(config.measurements.length).toBe(config.units.length);
        expect(config.measurements.length).toBe(config.axisIds.length);
    });

    it('all chartId values are unique (no canvas ID collisions)', () => {
        const chartIds = entries.map(([, c]) => c.chartId);
        const uniqueIds = new Set(chartIds);
        expect(uniqueIds.size).toBe(chartIds.length);
    });

    it('all measurements are non-empty arrays', () => {
        entries.forEach(([, config]) => {
            expect(Array.isArray(config.measurements)).toBe(true);
            expect(config.measurements.length).toBeGreaterThan(0);
        });
    });

    // Spot-check specific important entries
    it('power_voltage maps to POWER_VOLTAGE sensor', () => {
        expect(CHART_CONFIGS.power_voltage.sensor_name).toBe('POWER_VOLTAGE');
        expect(CHART_CONFIGS.power_voltage.units).toContain('mV');
    });

    it('power_current maps to POWER_CURRENT sensor', () => {
        expect(CHART_CONFIGS.power_current.sensor_name).toBe('POWER_CURRENT');
        expect(CHART_CONFIGS.power_current.units).toContain('uA');
    });

    it('teros12_vwc_adj has axisPolicy vwcPercent for correct % axis scaling', () => {
        expect(CHART_CONFIGS.teros12_vwc_adj.axisPolicy).toBe('vwcPercent');
    });

    it('presHum has two measurements (pressure + humidity) with two axis IDs', () => {
        expect(CHART_CONFIGS.presHum.measurements.length).toBe(2);
        expect(CHART_CONFIGS.presHum.axisIds.length).toBe(2);
    });

    it('co2 sensor_name is "co2" (lowercase, matches WebSocket measurement type)', () => {
        expect(CHART_CONFIGS.co2.sensor_name).toBe('co2');
    });
});

// ─── DASHBOARD_UNIFIED_CHART_TYPES ───────────────────────────────────────────

describe('DASHBOARD_UNIFIED_CHART_TYPES', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(DASHBOARD_UNIFIED_CHART_TYPES)).toBe(true);
        expect(DASHBOARD_UNIFIED_CHART_TYPES.length).toBeGreaterThan(0);
    });

    it('every entry is a valid key in CHART_CONFIGS (no dangling type)', () => {
        DASHBOARD_UNIFIED_CHART_TYPES.forEach((type) => {
            expect(CHART_CONFIGS).toHaveProperty(type);
        });
    });

    it('does NOT include bme280Temperature (registry-only, excluded by design)', () => {
        expect(DASHBOARD_UNIFIED_CHART_TYPES).not.toContain('bme280Temperature');
    });

    it('does NOT include bme280Pressure (registry-only, excluded by design)', () => {
        expect(DASHBOARD_UNIFIED_CHART_TYPES).not.toContain('bme280Pressure');
    });

    it('does NOT include bme280Humidity (registry-only, excluded by design)', () => {
        expect(DASHBOARD_UNIFIED_CHART_TYPES).not.toContain('bme280Humidity');
    });

    it('includes power_voltage (power charts now in unified loop)', () => {
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('power_voltage');
    });

    it('includes power_current (power charts now in unified loop)', () => {
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('power_current');
    });

    it('includes all four teros12 chart types', () => {
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('teros12_vwc');
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('teros12_vwc_adj');
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('teros12_temp');
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('teros12_ec');
    });

    it('includes environmental sensor types (co2, soilPot, presHum, sensor, soilHum)', () => {
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('co2');
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('soilPot');
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('presHum');
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('sensor');
        expect(DASHBOARD_UNIFIED_CHART_TYPES).toContain('soilHum');
    });

    it('has no duplicate entries', () => {
        const unique = new Set(DASHBOARD_UNIFIED_CHART_TYPES);
        expect(unique.size).toBe(DASHBOARD_UNIFIED_CHART_TYPES.length);
    });
});
