import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

// Import after mock is set up
import {
    getSensorData,
    streamSensorData,
    getPowerData,
    streamPowerData,
    getTerosData,
    streamTerosData,
} from './sensor';

const START = '2024-01-01T00:00:00.000Z';
const END = '2024-01-15T00:00:00.000Z';

beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: { timestamp: [], data: [] } });
    // Ensure PUBLIC_URL is defined
    process.env.PUBLIC_URL = '';
});

// ─── helpers ───────────────────────────────────────────────────────────────

/** Parse the URL called by axios.get and return params as a plain object */
function getCalledParams() {
    const calledUrl = axios.get.mock.calls[0][0];
    const [path, queryStr] = calledUrl.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryStr));
    return { path, params };
}

// ─── getSensorData ──────────────────────────────────────────────────────────

describe('getSensorData', () => {
    it('calls the correct sensor API path', async () => {
        await getSensorData('bme280', 1, 'temperature', START, END);
        const { path } = getCalledParams();
        expect(path).toBe('/api/sensor/');
    });

    it('includes name, cellId, measurement, startTime, endTime, resample in URL', async () => {
        await getSensorData('bme280', 42, 'humidity', START, END, 'day');
        const { params } = getCalledParams();
        expect(params).toMatchObject({
            name: 'bme280',
            cellId: '42',
            measurement: 'humidity',
            startTime: START,
            endTime: END,
            resample: 'day',
        });
    });

    it('defaults resample to "hour" when not provided', async () => {
        await getSensorData('co2', 1, 'co2', START, END);
        const { params } = getCalledParams();
        expect(params.resample).toBe('hour');
    });

    it('returns res.data (not the full axios response)', async () => {
        const fakeData = { timestamp: ['t1'], data: [42] };
        axios.get.mockResolvedValueOnce({ data: fakeData });
        const result = await getSensorData('bme280', 1, 'temperature', START, END);
        expect(result).toEqual(fakeData);
    });

    it('replaces null param values with empty string (not "null")', async () => {
        await getSensorData('bme280', 1, 'temperature', null, null);
        const { params } = getCalledParams();
        expect(params.startTime).toBe('');
        expect(params.endTime).toBe('');
        expect(params.startTime).not.toBe('null');
    });

    it('replaces undefined param values with empty string (not "undefined")', async () => {
        await getSensorData('bme280', 1, 'temperature', undefined, undefined);
        const { params } = getCalledParams();
        expect(params.startTime).toBe('');
        expect(params.startTime).not.toBe('undefined');
    });

    it('makes exactly one GET request', async () => {
        await getSensorData('bme280', 1, 'temperature', START, END);
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});

// ─── streamSensorData ───────────────────────────────────────────────────────

describe('streamSensorData', () => {
    it('calls the same /api/sensor/ path as getSensorData', async () => {
        await streamSensorData('co2', 1, 'co2', START, END, true);
        const { path } = getCalledParams();
        expect(path).toBe('/api/sensor/');
    });

    it('includes the stream param in the URL', async () => {
        await streamSensorData('bme280', 2, 'temperature', START, END, true);
        const { params } = getCalledParams();
        expect(params.stream).toBe('true');
    });

    it('does NOT include a resample param', async () => {
        await streamSensorData('bme280', 2, 'temperature', START, END, true);
        const { params } = getCalledParams();
        expect(params.resample).toBeUndefined();
    });
});

// ─── getPowerData ────────────────────────────────────────────────────────────

describe('getPowerData', () => {
    it('calls /api/power/{cellId} with the correct cell ID', async () => {
        await getPowerData(99, START, END);
        const { path } = getCalledParams();
        expect(path).toBe('/api/power/99');
    });

    it('includes startTime, endTime, resample in URL', async () => {
        await getPowerData(5, START, END, 'day');
        const { params } = getCalledParams();
        expect(params).toMatchObject({ startTime: START, endTime: END, resample: 'day' });
    });

    it('defaults resample to "hour"', async () => {
        await getPowerData(5, START, END);
        const { params } = getCalledParams();
        expect(params.resample).toBe('hour');
    });

    it('does NOT include name or measurement params', async () => {
        await getPowerData(5, START, END);
        const { params } = getCalledParams();
        expect(params.name).toBeUndefined();
        expect(params.measurement).toBeUndefined();
    });

    it('returns res.data', async () => {
        const fakeData = { timestamp: [], v: [], i: [], p: [] };
        axios.get.mockResolvedValueOnce({ data: fakeData });
        const result = await getPowerData(5, START, END);
        expect(result).toEqual(fakeData);
    });
});

// ─── streamPowerData ─────────────────────────────────────────────────────────

describe('streamPowerData', () => {
    it('calls /api/power/{cellId} path', async () => {
        await streamPowerData(7, START, END, true);
        const { path } = getCalledParams();
        expect(path).toBe('/api/power/7');
    });

    it('includes the stream param', async () => {
        await streamPowerData(7, START, END, true);
        const { params } = getCalledParams();
        expect(params.stream).toBe('true');
    });

    it('does NOT include a resample param', async () => {
        await streamPowerData(7, START, END, true);
        const { params } = getCalledParams();
        expect(params.resample).toBeUndefined();
    });
});

// ─── getTerosData ────────────────────────────────────────────────────────────

describe('getTerosData', () => {
    it('calls /api/teros/{cellId} with correct cell ID', async () => {
        await getTerosData(12, START, END);
        const { path } = getCalledParams();
        expect(path).toBe('/api/teros/12');
    });

    it('includes startTime, endTime, resample', async () => {
        await getTerosData(12, START, END, 'day');
        const { params } = getCalledParams();
        expect(params).toMatchObject({ startTime: START, endTime: END, resample: 'day' });
    });

    it('defaults resample to "hour"', async () => {
        await getTerosData(12, START, END);
        const { params } = getCalledParams();
        expect(params.resample).toBe('hour');
    });

    it('does NOT include name or measurement params', async () => {
        await getTerosData(12, START, END);
        const { params } = getCalledParams();
        expect(params.name).toBeUndefined();
        expect(params.measurement).toBeUndefined();
    });

    it('returns res.data', async () => {
        const fakeData = { timestamp: [], temp: [], vwc: [], ec: [] };
        axios.get.mockResolvedValueOnce({ data: fakeData });
        const result = await getTerosData(12, START, END);
        expect(result).toEqual(fakeData);
    });
});

// ─── streamTerosData ─────────────────────────────────────────────────────────

describe('streamTerosData', () => {
    it('calls /api/teros/{cellId} path', async () => {
        await streamTerosData(3, START, END, true);
        const { path } = getCalledParams();
        expect(path).toBe('/api/teros/3');
    });

    it('includes the stream param', async () => {
        await streamTerosData(3, START, END, true);
        const { params } = getCalledParams();
        expect(params.stream).toBe('true');
    });

    it('does NOT include a resample param', async () => {
        await streamTerosData(3, START, END, true);
        const { params } = getCalledParams();
        expect(params.resample).toBeUndefined();
    });
});
