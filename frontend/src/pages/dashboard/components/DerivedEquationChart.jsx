import { Box, CircularProgress, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import UniversalChart from '../../../charts/UniversalChart';
import { buildDerivedSeries, derivedSeriesToChartData } from '../equation/equationData';

function DerivedEquationChart({
  expression,
  startDate,
  endDate,
  stream,
  historicalPowerByCell,
  historicalTerosByCell,
  historicalSensorByKey,
  historicalLoading = false,
  centralHistoricalActive = false,
}) {
  const [resample, setResample] = useState('hour');
  const [chartData, setChartData] = useState({ datasets: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    if (stream) return undefined;

    const useCentralCache = centralHistoricalActive && resample === 'hour';
    if (useCentralCache && historicalLoading) {
      setIsLoading(true);
      setError(null);
      return undefined;
    }

    const fetchGeneration = ++fetchGenerationRef.current;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    buildDerivedSeries(expression, startDate, endDate, resample, {
      useCentralCache,
      historicalCache: {
        historicalPowerByCell,
        historicalTerosByCell,
        historicalSensorByKey,
      },
    })
      .then((series) => {
        if (cancelled || fetchGeneration !== fetchGenerationRef.current) return;
        if (!series || series.timestamps.length === 0) {
          setChartData({ datasets: [] });
          setError('No data for this expression in the selected date range.');
          return;
        }
        setChartData(derivedSeriesToChartData(expression, series.timestamps, series.values));
        setError(null);
      })
      .catch((err) => {
        if (cancelled || fetchGeneration !== fetchGenerationRef.current) return;
        setChartData({ datasets: [] });
        setError(err.message || 'Could not load derived series.');
      })
      .finally(() => {
        if (!cancelled && fetchGeneration === fetchGenerationRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    expression,
    startDate,
    endDate,
    resample,
    stream,
    historicalPowerByCell,
    historicalTerosByCell,
    historicalSensorByKey,
    historicalLoading,
    centralHistoricalActive,
  ]);

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
  historicalPowerByCell: PropTypes.object,
  historicalTerosByCell: PropTypes.object,
  historicalSensorByKey: PropTypes.object,
  historicalLoading: PropTypes.bool,
  centralHistoricalActive: PropTypes.bool,
};

export default DerivedEquationChart;
