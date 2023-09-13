import { React, useCallback, useMemo } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import useControlled from '@mui/utils/useControlled';
import HorizontalRuleRoundedIcon from '@mui/icons-material/HorizontalRuleRounded';
import PropTypes from 'prop-types';

function DateRangeSel({ startDate, endDate, setStartDate, setEndDate }) {
  // debounce function
  function debounce(func, wait = 500) {
    let timeout;
    function debounced(...args) {
      const later = () => {
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    }

    debounced.clear = () => {
      clearTimeout(timeout);
    };

    return debounced;
  }

  /** Added debounce to select (call api on completetion of date rather then on change) */
  function DateTimePickerWithAccept(props) {
    const { value: valueProp, onAccept } = props;

    const [value, setValue] = useControlled({
      name: 'FieldAcceptValue',
      state: 'value',
      controlled: valueProp,
      default: null,
    });

    // Debounced function needs to be memoized to keep the same timeout beween each render.
    // For the same reason, the `onAccept` needs to be wrapped in useCallback.
    const deboucedOnAccept = useMemo(() => debounce(onAccept, 1000), [onAccept]);
    return (
      <DateTimePicker
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
          deboucedOnAccept(newValue);
        }}
      />
    );
  }
  DateTimePickerWithAccept.propTypes = {
    value: PropTypes.any,
    onAccept: PropTypes.func.isRequired,
  };

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePickerWithAccept
          label='Start Date'
          value={startDate}
          onAccept={useCallback(
            (newStartDate) => {
              setStartDate(newStartDate);
            },
            [setStartDate],
          )}
          views={['year', 'month', 'day', 'hours']}
        />
      </LocalizationProvider>
      <HorizontalRuleRoundedIcon sx={{ mr: 1, ml: 1 }} />
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label='End Date'
          value={endDate}
          onAccept={useCallback(
            (newEndDate) => {
              setEndDate(newEndDate);
            },
            [setEndDate],
          )}
          views={['year', 'month', 'day', 'hours']}
        />
      </LocalizationProvider>
    </>
  );
}

DateRangeSel.propTypes = {
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  setStartDate: PropTypes.func.isRequired,
  setEndDate: PropTypes.func.isRequired,
};

export default DateRangeSel;
