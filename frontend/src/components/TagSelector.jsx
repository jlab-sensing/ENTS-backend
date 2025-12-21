import React, { useState } from 'react';
import {
  Box,
  Chip,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PropTypes from 'prop-types';
import { useTags, useCreateTag } from '../services/tag';
import useAuth from '../auth/hooks/useAuth';

function TagSelector({ selectedTags, onTagsChange }) {
  const { auth } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');

  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const createTagMutation = useCreateTag();

  const handleTagChange = (event, newValue) => {
    onTagsChange(newValue);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const tagData = {
        name: newTagName.trim(),
        description: newTagDescription || null,
      };

      await createTagMutation.mutateAsync({ tagData, accessToken: auth?.accessToken });

      setCreateDialogOpen(false);
      setNewTagName('');
      setNewTagDescription('');
    } catch (error) {
      console.error('Error creating tag:', error.response?.data?.message || error.message);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewTagName('');
    setNewTagDescription('');
  };

  if (tagsLoading) {
    return <Typography>Loading tags...</Typography>;
  }

  return (
    <Box>
      <Autocomplete
        multiple
        options={tags}
        getOptionLabel={(option) => option.name}
        value={selectedTags}
        onChange={handleTagChange}
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
            label='Tags'
            placeholder='Select or search tags'
            variant='outlined'
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {params.InputProps.endAdornment}
                  <Button
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{
                      ml: 1,
                      minWidth: 'auto',
                      color: '#588157',
                      '&:hover': {
                        backgroundColor: '#e8f5e8',
                      },
                    }}
                  >
                    New
                  </Button>
                </Box>
              ),
            }}
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(options, { inputValue }) => {
          const filtered = options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()));
          return filtered;
        }}
      />

      {/* Create New Tag Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Create New Tag</DialogTitle>
        <DialogContent>
          <TextField
            // autoFocus removed for accessibility
            margin='dense'
            label='Tag Name'
            fullWidth
            variant='outlined'
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            margin='dense'
            label='Description (Optional)'
            fullWidth
            variant='outlined'
            multiline
            rows={3}
            value={newTagDescription}
            onChange={(e) => setNewTagDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} color='inherit'>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTag}
            variant='contained'
            disabled={!newTagName.trim() || createTagMutation.isLoading}
            sx={{
              backgroundColor: '#588157',
              '&:hover': {
                backgroundColor: '#3a5a40',
              },
            }}
          >
            {createTagMutation.isLoading ? 'Creating...' : 'Create Tag'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

TagSelector.propTypes = {
  selectedTags: PropTypes.array.isRequired,
  onTagsChange: PropTypes.func.isRequired,
};

export default TagSelector;
