import { vi } from 'vitest';

global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);
process.env.VITE_API_URL = 'http://localhost:5006';