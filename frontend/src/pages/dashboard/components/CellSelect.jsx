import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';
import { React } from 'react';
import { useCells } from '../../../services/cell';

function CellSelect({ selectedCells, setSelectedCells }) {
  const cells = useCells();
  if (cells.isLoading) {
    return <span>Loading...</span>;
  }

  if (cells.isError) {
    return <span>Error: {cells.error.message}</span>;
  }
  return (
    <FormControl sx={{ width: 1 }}>
      <InputLabel id='cell-select'>Cell</InputLabel>
      <Select
        labelId='cell-select-label'
        id='cell-select'
        value={selectedCells}
        multiple
        label='select-cell'
        defaultValue={selectedCells}
        onChange={(e) => {
          setSelectedCells(e.target.value);
        }}
      >
        {Array.isArray(cells.data)
          ? cells.data
              .filter((cell) => !cell.archive)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((cell) => {
                return (
                  <MenuItem value={cell} key={cell.id}>
                    {cell.name}
                  </MenuItem>
                );
              })
          : ''}
        <MenuItem value='all' disabled={true} sx={{ color: 'black' }}>
          Can&apos;t find cell? Check Archive feature.
        </MenuItem>
      </Select>
    </FormControl>
  );
}

CellSelect.propTypes = {
  selectedCells: PropTypes.array,
  setSelectedCells: PropTypes.func.isRequired,
};

export default CellSelect;
