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
  Divider,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PropTypes from 'prop-types';
import { React, useMemo, useState, useEffect } from 'react';
import { useCells } from '../../../services/cell';
import { useTags, getCellsByTag } from '../../../services/tag';

function CellSelect({ selectedCells, setSelectedCells }) {

  const cells = useCells();

  const { data: tags = [] } = useTags();

  const [selectedTags, setSelectedTags] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [taggedCellIds, setTaggedCellIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state

  // Create a master lookup map for all cells by ID
  const cellsById = useMemo(() => {
    const map = new Map();
    if (cells.data && Array.isArray(cells.data)) {
      cells.data.forEach((cell) => {
        if (cell && cell.id) {
          map.set(cell.id, cell);
        }
      });
    }
    return map;
  }, [cells.data]);

  // Fetch cells for selected tags
  useEffect(() => {
    if (selectedTags.length === 0) {
      setTaggedCellIds([]);
      return;
    }

    const fetchTaggedCells = async () => {
      try {
        const allTaggedCells = new Set();

        for (const tag of selectedTags) {
          if (tag && tag.id) {
            // MOCK: For testing
            if (tag.name === 'Production') {
              ['112', '113'].forEach(id => allTaggedCells.add(id));
            } else if (tag.name === 'Testing') {
              ['110', '111', '102'].forEach(id => allTaggedCells.add(id));
            } else if (tag.name === 'Demo') {
              ['101', '109'].forEach(id => allTaggedCells.add(id));
            } else {
              ['105', '106', '107', '108'].forEach(id => allTaggedCells.add(id));
            }

            // Uncomment for production:
            /*
            const response = await getCellsByTag(tag.id);
            if (response.cells && Array.isArray(response.cells)) {
              response.cells.forEach((cell) => {
                if (cell && cell.id) {
                  allTaggedCells.add(cell.id);
                }
              });
            }
            */
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

    return cells.data.filter((cell) => {
      return cell && cell.id && taggedCellIds.includes(cell.id);
    });
  }, [cells.data, selectedTags, taggedCellIds]);

  // NEW: Further filter by search query
  const searchableCells = useMemo(() => {
    if (!Array.isArray(filteredCells)) return [];

    let result = filteredCells.filter((cell) => cell && cell.id && !cell.archive);

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((cell) => {
        const name = (cell.name || '').toLowerCase();
        const idStr = String(cell.id || '');
        return name.includes(query) || idStr.includes(query);
      });
    }

    return result.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [filteredCells, searchQuery]);

  if (cells.isLoading) {
    return <span>Loading...</span>;
  }

  if (cells.isError) {
    return <span>Error: {cells.error?.message || 'Failed to load cells'}</span>;
  }

  // Normalize selectedCells
  const safeSelectedCells = useMemo(() => {
    if (!Array.isArray(selectedCells)) return [];
    const normalized = [];
    const seenIds = new Set();

    selectedCells.forEach((cell) => {
      if (cell && cell.id && !seenIds.has(cell.id)) {
        const masterCell = cellsById.get(cell.id);
        if (masterCell) {
          normalized.push(masterCell);
          seenIds.add(cell.id);
        }
      }
    });

    return normalized;
  }, [selectedCells, cellsById]);

  // Create a Set of selected cell IDs for quick lookup
  const selectedCellIds = useMemo(() => {
    return new Set(safeSelectedCells.map((cell) => cell.id));
  }, [safeSelectedCells]);

  return (
    <FormControl sx={{ width: 1, maxWidth: 600 }}>
      <InputLabel id="cell-select">Cell</InputLabel>
      <Select
        labelId="cell-select-label"
        id="cell-select"
        value={safeSelectedCells}
        multiple
        label="Cell"
        open={dropdownOpen}
        onOpen={() => setDropdownOpen(true)}
        onClose={() => {
          setDropdownOpen(false);
          setSearchQuery(''); // Clear search when closing
        }}
        onChange={(e) => {
          const newValue = Array.isArray(e.target.value)
            ? e.target.value.filter((cell) => cell && cell.id)
            : [];

          const uniqueMap = new Map();
          newValue.forEach((cell) => {
            if (cell && cell.id) {
              uniqueMap.set(cell.id, cell);
            }
          });
          setSelectedCells(Array.from(uniqueMap.values()));
        }}
        renderValue={(selected) => {
          if (!selected || selected.length === 0) return '';
          return selected.map((cell) => cell.name || 'Unnamed').join(', ');
        }}
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: 450, width: 400 },
          },
          // Prevent menu from closing when clicking inside
          autoFocus: false,
        }}
      >
        {/* Tag Filter Section - Inside dropdown */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
            Filter by Tags
          </Typography>
          <Autocomplete
            multiple
            size="small"
            options={Array.isArray(tags) ? tags.filter((tag) => tag && tag.id) : []}
            getOptionLabel={(option) => option?.name || 'Unknown'}
            value={selectedTags}
            onChange={(event, newValue) => {
              setSelectedTags(newValue);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
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
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  selectedTags.length === 0 ? 'Select tags to filter' : ''
                }
                variant="outlined"
                size="small"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            )}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            sx={{ width: '100%' }}
          />
          {selectedTags.length > 0 && (
            <Typography
              variant="caption"
              sx={{ mt: 1, display: 'block', color: '#666' }}
            >
              Showing {filteredCells.filter((cell) => cell && !cell.archive).length} cells with selected tags
            </Typography>
          )}
        </Box>

        <Divider />

        {/* NEW: Search box - Inside dropdown, below tags */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
            Search by Cell
          </Typography>
          <TextField
            fullWidth
            placeholder="Type to search by name or ID..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus={dropdownOpen}
          />
        </Box>

        <Divider />

        {/* Cell list - Filtered by tags AND search */}
        {Array.isArray(searchableCells) && searchableCells.length > 0
          ? searchableCells.map((cell) => {
            const isSelected = selectedCellIds.has(cell.id);

            // Highlight matching text
            const label = cell.name || 'Unnamed Cell';
            const parts = searchQuery
              ? label.split(new RegExp(`(${searchQuery})`, 'gi'))
              : [label];

            return (
              <MenuItem
                value={cell}
                key={cell.id}
                sx={{
                  py: 1,
                  backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? 'rgba(25, 118, 210, 0.12)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                  {isSelected && (
                    <CheckIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {parts.map((part, index) => (
                      <span
                        key={index}
                        style={{
                          fontWeight:
                            searchQuery &&
                              part.toLowerCase() === searchQuery.toLowerCase()
                              ? 700
                              : 'inherit',
                        }}
                      >
                        {part}
                      </span>
                    ))}
                  </Typography>
                </Box>
              </MenuItem>
            );
          })
          : (
            <MenuItem disabled>
              <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                {searchQuery ? 'No cells match your search' : 'No cells available'}
              </Typography>
            </MenuItem>
          )}

        <Divider />
        <MenuItem
          value="all"
          disabled
          sx={{
            color: '#999',
            fontStyle: 'italic',
            py: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {safeSelectedCells.length > 0
            ? `${safeSelectedCells.length} cell${safeSelectedCells.length !== 1 ? 's' : ''} selected`
            : 'Select cells from the list above'}
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

