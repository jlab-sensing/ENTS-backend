import React, { useState } from 'react';
import {
  Box,
  Chip,
  TextField,
  Autocomplete,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useTags } from '../services/tag';

function TagFilter({ selectedTags, onTagsChange, disabled = false, axiosPrivate }) {
  const { data: allTags = [], isLoading: tagsLoading } = useTags();

  const handleTagChange = (event, newValue) => {
    onTagsChange(newValue);
  };


  if (tagsLoading) {
    return <Typography>Loading tags...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Tag Selection */}
      <Autocomplete
        multiple
        options={allTags}
        getOptionLabel={(option) => option.name}
        value={selectedTags}
        onChange={handleTagChange}
        disabled={disabled}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              key={option.id}
              label={option.name}
              {...getTagProps({ index })}
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
            label="Filter by Tags"
            placeholder={selectedTags.length === 0 ? "Select tags to filter cells" : ""}
            variant="outlined"
            size="small"
            helperText={selectedTags.length === 0 ? "No tags selected - showing all cells" : `Filtering by ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`}
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(options, { inputValue }) => {
          const filtered = options.filter((option) =>
            option.name.toLowerCase().includes(inputValue.toLowerCase())
          );
          return filtered;
        }}
        sx={{ minWidth: 300 }}
      />
    </Box>
  );
}

TagFilter.propTypes = {
  selectedTags: PropTypes.array.isRequired,
  onTagsChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  axiosPrivate: PropTypes.object,
};

export default TagFilter;