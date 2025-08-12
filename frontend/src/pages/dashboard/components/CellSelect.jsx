import { 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Box, 
  Typography, 
  Chip, 
  Autocomplete, 
  TextField,
  Divider
} from '@mui/material';
import PropTypes from 'prop-types';
import { React, useMemo, useState, useEffect } from 'react';
import { useCells } from '../../../services/cell';
import { useTags, getCellsByTag } from '../../../services/tag';

function CellSelect({ selectedCells, setSelectedCells, axiosPrivate }) {
  const cells = useCells();
  const { data: tags = [] } = useTags();
  const [selectedTags, setSelectedTags] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [taggedCellIds, setTaggedCellIds] = useState([]);
  
  // Fetch cells for selected tags
  useEffect(() => {
    if (selectedTags.length === 0) {
      setTaggedCellIds([]);
      return;
    }

    const fetchTaggedCells = async () => {
      try {
        const allTaggedCells = new Set();
        
        // Get cells for each selected tag
        for (const tag of selectedTags) {
          if (tag && tag.id) {
            const response = await getCellsByTag(tag.id);
            if (response.cells && Array.isArray(response.cells)) {
              response.cells.forEach(cell => {
                if (cell && cell.id) {
                  allTaggedCells.add(cell.id);
                }
              });
            }
          }
        }
        
        setTaggedCellIds(Array.from(allTaggedCells));
      } catch (error) {
        console.error('Error fetching tagged cells:', error);
        setTaggedCellIds([]);
      }
    };

    fetchTaggedCells();
  }, [selectedTags]);

  // Filter cells by selected tags
  const filteredCells = useMemo(() => {
    if (!cells.data || !Array.isArray(cells.data)) return [];
    if (selectedTags.length === 0) return cells.data;
    
    // Filter cells that have at least one of the selected tags
    return cells.data.filter(cell => {
      return cell && cell.id && taggedCellIds.includes(cell.id);
    });
  }, [cells.data, selectedTags, taggedCellIds]);
  
  if (cells.isLoading) {
    return <span>Loading...</span>;
  }

  if (cells.isError) {
    return <span>Error: {cells.error?.message || 'Failed to load cells'}</span>;
  }

  // Ensure selectedCells is always a valid array with valid objects
  const safeSelectedCells = Array.isArray(selectedCells) 
    ? selectedCells.filter(cell => cell && cell.id)
    : [];
  return (
    <FormControl sx={{ width: 1 }}>
      <InputLabel id='cell-select'>Cell</InputLabel>
      <Select
        labelId='cell-select-label'
        id='cell-select'
        value={safeSelectedCells}
        multiple
        label='select-cell'
        defaultValue={safeSelectedCells}
        open={dropdownOpen}
        onOpen={() => setDropdownOpen(true)}
        onClose={() => setDropdownOpen(false)}
        onChange={(e) => {
          const newValue = Array.isArray(e.target.value) 
            ? e.target.value.filter(cell => cell && cell.id)
            : [];
          setSelectedCells(newValue);
        }}
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: 400, width: 350 }
          }
        }}
      >
        {/* Tag Filter Section */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
            Filter by Tags
          </Typography>
          <Autocomplete
            multiple
            size="small"
            options={Array.isArray(tags) ? tags.filter(tag => tag && tag.id) : []}
            getOptionLabel={(option) => option?.name || 'Unknown'}
            value={selectedTags}
            onChange={(event, newValue) => {
              setSelectedTags(newValue);
            }}
            renderTags={(value, getTagProps) =>
              value && Array.isArray(value) ? value.map((option, index) => (
                option && option.id ? (
                  <Chip
                    key={option.id}
                    label={option.name || 'Unknown'}
                    {...getTagProps({ index })}
                    size="small"
                    sx={{
                      backgroundColor: '#e8f5e8',
                      color: '#2e7d32',
                      '& .MuiChip-deleteIcon': {
                        color: '#2e7d32',
                      },
                    }}
                  />
                ) : null
              )).filter(Boolean) : []
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={selectedTags.length === 0 ? "Select tags to filter" : ""}
                variant="outlined"
                size="small"
              />
            )}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            sx={{ width: '100%' }}
          />
          {selectedTags.length > 0 && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#666' }}>
              Showing cells with selected tags ({filteredCells.filter(cell => cell && !cell.archive).length} cells)
            </Typography>
          )}
        </Box>
        
        <Divider />
        
        {Array.isArray(filteredCells)
          ? filteredCells
              .filter((cell) => cell && cell.id && !cell.archive)
              .sort((a, b) => (a?.name || '').localeCompare(b?.name || ''))
              .map((cell) => {
                return (
                  <MenuItem value={cell} key={cell.id} sx={{ py: 1 }}>
                    <Typography variant="body2">{cell.name || 'Unnamed Cell'}</Typography>
                  </MenuItem>
                );
              })
          : ''}
        <Divider />
        <MenuItem value='all' disabled={true} sx={{ color: '#999', fontStyle: 'italic', py: 0.5, fontSize: '0.75rem' }}>
          Select a cell from the list above to view data
        </MenuItem>
      </Select>
    </FormControl>
  );
}

CellSelect.propTypes = {
  selectedCells: PropTypes.array,
  setSelectedCells: PropTypes.func.isRequired,
  axiosPrivate: PropTypes.object,
};

export default CellSelect;
