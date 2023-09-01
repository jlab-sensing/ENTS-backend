import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// Mocking structured clone b/c jsdom doesn't support it yet
global.structuredClone = vi.fn((val) => {
  return JSON.parse(JSON.stringify(val));
});

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
