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
import { useTags, useTagCategories } from '../services/tag';

function TagFilter({ selectedTags, onTagsChange, disabled = false, axiosPrivate }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const { data: allTags = [], isLoading: tagsLoading } = useTags();
  const { data: categories = [], isLoading: categoriesLoading } = useTagCategories();

  const handleTagChange = (event, newValue) => {
    onTagsChange(newValue);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  // Filter tags by selected category
  const filteredTags = selectedCategory 
    ? allTags.filter(tag => tag.category === selectedCategory)
    : allTags;

  if (tagsLoading) {
    return <Typography>Loading tags...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Category Filter */}
      <FormControl sx={{ minWidth: 200 }} size="small">
        <InputLabel>Filter by Category</InputLabel>
        <Select
          value={selectedCategory}
          onChange={handleCategoryChange}
          label="Filter by Category"
          disabled={disabled || categoriesLoading}
        >
          <MenuItem value="">
            <em>All Categories</em>
          </MenuItem>
          {!categoriesLoading && categories.categories?.map((category) => (
            <MenuItem key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Tag Selection */}
      <Autocomplete
        multiple
        options={filteredTags}
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
      
      {/* Show category breakdown of selected tags */}
      {selectedTags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(
            selectedTags.reduce((acc, tag) => {
              const category = tag.category || 'uncategorized';
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            }, {})
          ).map(([category, count]) => (
            <Chip
              key={category}
              label={`${category}: ${count}`}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.75rem',
                color: '#666',
                borderColor: '#ddd',
              }}
            />
          ))}
        </Box>
      )}
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