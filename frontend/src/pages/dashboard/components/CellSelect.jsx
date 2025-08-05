import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';
import { React, useMemo } from 'react';
import { useCells } from '../../../services/cell';

function CellSelect({ selectedCells, setSelectedCells, filteredByTags = [], axiosPrivate }) {
  const cells = useCells();
  
  // For now, return all cells (tag filtering temporarily disabled)
  const filteredCells = useMemo(() => {
    return cells.data || [];
  }, [cells.data]);
  
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
        {Array.isArray(filteredCells)
          ? filteredCells
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
          "Can't find cell? Check Archive feature."
        </MenuItem>
      </Select>
    </FormControl>
  );
}

CellSelect.propTypes = {
  selectedCells: PropTypes.array,
  setSelectedCells: PropTypes.func.isRequired,
  filteredByTags: PropTypes.array,
  axiosPrivate: PropTypes.object,
};

export default CellSelect;
