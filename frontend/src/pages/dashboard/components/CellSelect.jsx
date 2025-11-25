import {
  FormControl,
  Typography,
  Chip,
  Autocomplete,
  TextField,
} from '@mui/material';
import PropTypes from 'prop-types';
import { React, useMemo } from 'react';
import { useCells } from '../../../services/cell';

function CellSelect({ selectedCells, setSelectedCells }) {
  const cells = useCells();

  const filteredCells = useMemo(() => {
    if (!cells.data || !Array.isArray(cells.data)) return [];
    return cells.data.filter(cell => cell && !cell.archive);
  }, [cells.data]);

  if (cells.isLoading) {
    return <span>Loading...</span>;
  }
  if (cells.isError) {
    return <span>Error: {cells.error?.message || 'Failed to load cells'}</span>;
  }

  return (
    <FormControl sx={{ width: 1 }}>
      <Autocomplete
        multiple
        id="cell-select"
        options={filteredCells.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))}
        getOptionLabel={(option) => option.name || 'Unnamed Cell'}
        value={selectedCells}
        onChange={(event, newValue) => {
          setSelectedCells(newValue);
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              key={option.id}
              label={option.name}
              {...getTagProps({ index })}
              size="small"
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Cell"
            placeholder={selectedCells.length > 0 ? '' : 'Select cells or type to search'}
          />
        )}
        renderOption={(props, option, { inputValue }) => {
          const parts = option.name.split(new RegExp(`(${inputValue})`, 'gi'));
          return (
            <li {...props}>
              <Typography variant="body2">
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.toLowerCase() === inputValue.toLowerCase() ? 700 : 400,
                    }}
                  >
                    {part}
                  </span>
                ))}
              </Typography>
            </li>
          );
        }}
      />
    </FormControl>
  );
}

CellSelect.propTypes = {
  selectedCells: PropTypes.array,
  setSelectedCells: PropTypes.func.isRequired,
};

export default CellSelect;
