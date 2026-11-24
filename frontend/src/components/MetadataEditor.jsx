import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { createRowId } from './metadataUtils';

/**
 * Key-value pair editor for arbitrary cell JSONB metadata.
 */
function MetadataEditor({ rows, rowErrors, onRowsChange }) {
  const handleAddRow = () => {
    onRowsChange([...rows, { id: createRowId(), key: '', value: '' }]);
  };

  const handleFieldChange = (rowId, field) => (event) => {
    const { value } = event.target;
    onRowsChange(
      rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }
        const updated = { ...row, [field]: value };
        if (field === 'key') {
          delete updated.isLoaded;
        }
        if (field === 'value') {
          delete updated.hasOriginalValue;
        }
        return updated;
      }),
    );
  };

  const handleRemoveRow = (rowId) => {
    onRowsChange(rows.filter((row) => row.id !== rowId));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant='body2' sx={{ fontWeight: 600, color: '#374151' }}>
          Metadata
        </Typography>
        <Button
          size='small'
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          sx={{
            textTransform: 'none',
            color: '#588157',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'rgba(88, 129, 87, 0.08)' },
          }}
        >
          Add field
        </Button>
      </Box>

      {rows.length === 0 ? (
        <Typography variant='caption' sx={{ color: '#6b7280', display: 'block' }}>
          Optional key-value properties (e.g., sand: 0.4, silt: 0.2).
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rows.map((row, index) => {
            const keyError = rowErrors[row.id];
            return (
              <Box key={row.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label={`Key ${index + 1}`}
                  size='small'
                  value={row.key}
                  onChange={handleFieldChange(row.id, 'key')}
                  placeholder='e.g., sand'
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(keyError)}
                  helperText={keyError || ''}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    },
                  }}
                />
                <TextField
                  label={`Value ${index + 1}`}
                  size='small'
                  value={row.value}
                  onChange={handleFieldChange(row.id, 'value')}
                  placeholder='e.g., 0.4'
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    },
                  }}
                />
                <IconButton
                  size='small'
                  aria-label={`Remove metadata field ${index + 1}`}
                  onClick={() => handleRemoveRow(row.id)}
                  sx={{
                    mt: 0.5,
                    color: '#6b7280',
                    '&:hover': { color: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.08)' },
                  }}
                >
                  <DeleteOutlineIcon fontSize='small' />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

MetadataEditor.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  rowErrors: PropTypes.objectOf(PropTypes.string),
  onRowsChange: PropTypes.func.isRequired,
};

MetadataEditor.defaultProps = {
  rowErrors: {},
};

export default MetadataEditor;
