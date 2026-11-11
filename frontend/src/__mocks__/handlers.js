import { rest } from 'msw';

export const mockStatistics = {
  total_cells: 14,
  active_cells: 12,
  archived_cells: 2,
  total_loggers: 8,
  total_users: 6,
  total_data_points: 154230,
  latest_timestamp: '2026-10-29T12:00:00Z',
  data_breakdown: {
    power: 85200,
    teros: 45100,
    generic: 23930,
  },
};

export const handlers = [
  rest.get(`${process.env.PUBLIC_URL}/api/cell/id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 20,
          name: 'test_cell_1',
          location: 'jlab',
        },
        {
          id: 21,
          name: 'test_cell_2',
          location: 'out in the farm',
        },
      ]),
    );
  }),
  rest.get(`${process.env.PUBLIC_URL}/api/statistics/`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockStatistics));
  }),
];
