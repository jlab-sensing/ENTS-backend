import { Box, CircularProgress, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import UniversalChart from '../../../charts/UniversalChart';
import {
  buildDerivedSeries,
  buildDerivedSeriesFromLiveData,
  derivedSeriesToChartData,
} from '../equation/equationData';

function DerivedEquationChart({
  expression,
  startDate,
  endDate,
  stream,
  liveData = [],
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

  // Live mode: evaluate from websocket packets with latest-value semantics.
  useEffect(() => {
    if (!stream) return undefined;

    setIsLoading(false);
    try {
      const series = buildDerivedSeriesFromLiveData(expression, liveData);
      if (!series || series.timestamps.length === 0) {
        setChartData({ datasets: [] });
        setError('Waiting for live data for all equation inputs…');
        return undefined;
      }
      setChartData(derivedSeriesToChartData(expression, series.timestamps, series.values));
      setError(null);
    } catch (err) {
      setChartData({ datasets: [] });
      setError(err.message || 'Could not evaluate live derived series.');
    }
    return undefined;
  }, [stream, expression, liveData]);

  // Historical mode: fetch / use central caches.
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
      {...(!stream && { startDate, endDate })}
      onResampleChange={stream ? undefined : setResample}
    />
  );
}

DerivedEquationChart.propTypes = {
  expression: PropTypes.string.isRequired,
  startDate: PropTypes.instanceOf(DateTime).isRequired,
  endDate: PropTypes.instanceOf(DateTime).isRequired,
  stream: PropTypes.bool,
  liveData: PropTypes.array,
  historicalPowerByCell: PropTypes.object,
  historicalTerosByCell: PropTypes.object,
  historicalSensorByKey: PropTypes.object,
  historicalLoading: PropTypes.bool,
  centralHistoricalActive: PropTypes.bool,
};

export default DerivedEquationChart;
