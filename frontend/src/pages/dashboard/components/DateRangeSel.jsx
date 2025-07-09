import { React, useCallback, useMemo, useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import useControlled from '@mui/utils/useControlled';
import HorizontalRuleRoundedIcon from '@mui/icons-material/HorizontalRuleRounded';
import { Box, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PropTypes from 'prop-types';

function DateRangeSel({ startDate, endDate, setStartDate, setEndDate }) {
  const theme = useTheme();
  const showFullPicker = useMediaQuery(theme.breakpoints.up('md'));
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

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
    const { value: valueProp, onAccept, ...otherProps } = props;

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
        {...otherProps}
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

  if (!showFullPicker) {
    // Mobile/Compressed view - Icon only
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant='caption' sx={{ fontSize: '0.7rem' }}>
              Start
            </Typography>
            <DateTimePicker
              value={startDate}
              open={startOpen}
              onOpen={() => setStartOpen(true)}
              onClose={() => setStartOpen(false)}
              onChange={(newValue) => setStartDate(newValue)}
              views={['year', 'month', 'day', 'hours']}
              slots={{
                field: () => (
                  <IconButton
                    onClick={() => setStartOpen(true)}
                    size='small'
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 0.5,
                    }}
                  >
                    <CalendarMonthIcon fontSize='small' />
                  </IconButton>
                ),
              }}
            />
            <Typography variant='caption' sx={{ fontSize: '0.65rem', display: 'block' }}>
              {startDate.toFormat('MM/dd')}
            </Typography>
          </Box>
        </LocalizationProvider>

        <HorizontalRuleRoundedIcon sx={{ fontSize: 'small' }} />

        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant='caption' sx={{ fontSize: '0.7rem' }}>
              End
            </Typography>
            <DateTimePicker
              value={endDate}
              open={endOpen}
              onOpen={() => setEndOpen(true)}
              onClose={() => setEndOpen(false)}
              onChange={(newValue) => setEndDate(newValue)}
              views={['year', 'month', 'day', 'hours']}
              slots={{
                field: () => (
                  <IconButton
                    onClick={() => setEndOpen(true)}
                    size='small'
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 0.5,
                    }}
                  >
                    <CalendarMonthIcon fontSize='small' />
                  </IconButton>
                ),
              }}
            />
            <Typography variant='caption' sx={{ fontSize: '0.65rem', display: 'block' }}>
              {endDate.toFormat('MM/dd')}
            </Typography>
          </Box>
        </LocalizationProvider>
      </Box>
    );
  }

  // Desktop view - Full date pickers
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          format='MM/dd HH:mm'
          slotProps={{
            textField: {
              size: 'small',
              sx: {
                width: '160px',
                '& .MuiInputBase-input': {
                  fontSize: '0.875rem',
                },
              },
            },
          }}
        />
      </LocalizationProvider>

      <HorizontalRuleRoundedIcon />

      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePickerWithAccept
          label='End Date'
          value={endDate}
          onAccept={useCallback(
            (newEndDate) => {
              setEndDate(newEndDate);
            },
            [setEndDate],
          )}
          views={['year', 'month', 'day', 'hours']}
          format='MM/dd HH:mm'
          slotProps={{
            textField: {
              size: 'small',
              sx: {
                width: '160px',
                '& .MuiInputBase-input': {
                  fontSize: '0.875rem',
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
}

DateRangeSel.propTypes = {
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  setStartDate: PropTypes.func.isRequired,
  setEndDate: PropTypes.func.isRequired,
};

export default DateRangeSel;
