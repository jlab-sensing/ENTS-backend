/**
 * Tests that power.js correctly re-exports getPowerData and streamPowerData
 * from sensor.js — ensuring backward compatibility after the service consolidation.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('axios');

import { getPowerData as getPowerFromPower, streamPowerData as streamPowerFromPower } from './power';
import { getPowerData as getPowerFromSensor, streamPowerData as streamPowerFromSensor } from './sensor';

describe('power.js re-exports', () => {
    it('getPowerData exported from power.js is the same function as from sensor.js', () => {
        expect(getPowerFromPower).toBe(getPowerFromSensor);
    });

    it('streamPowerData exported from power.js is the same function as from sensor.js', () => {
        expect(streamPowerFromPower).toBe(streamPowerFromSensor);
    });

    it('getPowerData is a function', () => {
        expect(typeof getPowerFromPower).toBe('function');
    });

    it('streamPowerData is a function', () => {
        expect(typeof streamPowerFromPower).toBe('function');
    });
});
