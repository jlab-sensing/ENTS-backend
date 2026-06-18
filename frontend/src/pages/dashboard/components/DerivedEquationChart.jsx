import { Box, CircularProgress, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import UniversalChart from '../../../charts/UniversalChart';
import { buildDerivedSeries, derivedSeriesToChartData } from '../equation/equationData';

function DerivedEquationChart({ expression, startDate, endDate, stream }) {
  const [resample, setResample] = useState('hour');
  const [chartData, setChartData] = useState({ datasets: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (stream) return undefined;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    buildDerivedSeries(expression, startDate, endDate, resample)
      .then((series) => {
        if (cancelled) return;
        if (!series || series.timestamps.length === 0) {
          setChartData({ datasets: [] });
          setError('No data for this expression in the selected date range.');
          return;
        }
        setChartData(derivedSeriesToChartData(expression, series.timestamps, series.values));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setChartData({ datasets: [] });
        setError(err.message || 'Could not load derived series.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expression, startDate, endDate, resample, stream]);

  if (stream) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          Derived equations are not available in live stream mode yet.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%" px={2}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!chartData.datasets.length) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <UniversalChart
      data={chartData}
      stream={stream}
      chartId={`derived-${expression.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40)}`}
      measurements={['derived']}
      units={['']}
      axisIds={['y']}
      startDate={startDate}
      endDate={endDate}
      onResampleChange={setResample}
    />
  );
}

DerivedEquationChart.propTypes = {
  expression: PropTypes.string.isRequired,
  startDate: PropTypes.instanceOf(DateTime).isRequired,
  endDate: PropTypes.instanceOf(DateTime).isRequired,
  stream: PropTypes.bool,
};

export default DerivedEquationChart;
