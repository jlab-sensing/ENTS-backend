import PropTypes from 'prop-types';
import { React } from 'react';
import UniversalChart from '../UniversalChart';

export default function VChart({ data, stream, startDate, endDate, onResampleChange }) {
  return (
    <UniversalChart
      data={data}
      stream={stream}
      chartId='v'
      measurements={['Cell Voltage', 'Current']}
      units={['mV', 'µA']}
      axisIds={['vAxis', 'cAxis']}
      streamAutoSkip={false}
      dualAxisTickCount={10}
      dualAxisStepFactor={10}
      primaryAxisGrid={{ drawOnChartArea: false }}
      enableAxisPlugins={false}
      startDate={startDate}
      endDate={endDate}
      onResampleChange={onResampleChange}
    />
  );
}

VChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  onResampleChange: PropTypes.func,
};
