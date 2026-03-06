import PropTypes from 'prop-types';
import { React } from 'react';
import UniversalChart from '../UniversalChart';

export default function TempChart({ data, stream, startDate, endDate, onResampleChange }) {
  return (
    <UniversalChart
      data={data} stream={stream}
      chartId='temp'
      measurements={['Temperature']}
      units={['°C']}
      axisIds={['y']}
      startDate={startDate}
      endDate={endDate}
      onResampleChange={onResampleChange}
    />
  );
}

TempChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  onResampleChange: PropTypes.func,
};
