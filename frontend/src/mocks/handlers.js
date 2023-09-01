import { rest } from 'msw';

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
];
