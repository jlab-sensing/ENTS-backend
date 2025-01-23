import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import 'vitest-canvas-mock';
import { server } from './__mocks__/server';

// Mocking structured clone b/c jsdom doesn't support it yet
global.structuredClone = vi.fn((val) => {
  return JSON.parse(JSON.stringify(val));
});

// Mock the ResizeObserver for charts
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

beforeAll(() => {
  // Enable the mocking in tests.
  server.listen();
});

afterEach(() => {
  // Reset any runtime handlers tests may use.
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  // Clean up once the tests are done.
  server.close();
});
