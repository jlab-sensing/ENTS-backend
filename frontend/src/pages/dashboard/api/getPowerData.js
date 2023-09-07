import { DateTime } from 'luxon';
import { useQuery, useQueries } from '@tanstack/react-query';
import { getPowerData } from '../../../services/power';

export const usePowerData = (cells, startTime = DateTime.now().minus({ months: 1 }), endTime = DateTime.now()) =>
  useQueries({
    queries: [
      cells.map((cell) => {
        return {
          queryKey: [cell.id],
          queryFn: () => getPowerData(cell.id, startTime, endTime),
          // enabled: !!cells,
          refetchOnWindowFocus: false,
        };
      }),
    ],
  });
// useQuery('cell', () => getPowerData(cells[0].id, startTime, endTime));
