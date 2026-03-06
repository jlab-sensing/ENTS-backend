/**
 * Tests that teros.js correctly re-exports getTerosData and streamTerosData
 * from sensor.js — ensuring backward compatibility after the service consolidation.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('axios');

import { getTerosData as getTerosFromTeros, streamTerosData as streamTerosFromTeros } from './teros';
import { getTerosData as getTerosFromSensor, streamTerosData as streamTerosFromSensor } from './sensor';

describe('teros.js re-exports', () => {
    it('getTerosData exported from teros.js is the same function as from sensor.js', () => {
        expect(getTerosFromTeros).toBe(getTerosFromSensor);
    });

    it('streamTerosData exported from teros.js is the same function as from sensor.js', () => {
        expect(streamTerosFromTeros).toBe(streamTerosFromSensor);
    });

    it('getTerosData is a function', () => {
        expect(typeof getTerosFromTeros).toBe('function');
    });

    it('streamTerosData is a function', () => {
        expect(typeof streamTerosFromTeros).toBe('function');
    });
});
