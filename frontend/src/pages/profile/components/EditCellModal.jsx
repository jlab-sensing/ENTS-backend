import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useOutletContext } from 'react-router-dom';
import { updateCell } from '../../../services/cell';
import { useCellTags, useAssignCellTags } from '../../../services/tag';
import TagSelector from '../../../components/TagSelector';
import PropTypes from 'prop-types';
import useAuth from '../../../auth/hooks/useAuth';

function EditCellModal({ cell }) {
  const data = useOutletContext();
  const refetch = data[3];
  const axiosPrivate = data[6];
  const { auth } = useAuth();

  const [isOpen, setOpen] = useState(false);
  const [formData, setFormData] = useState({ ...cell });
  const [selectedTags, setSelectedTags] = useState([]);
  const [response, setResponse] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const { data: cellTags = [] } = useCellTags(cell.id);
  const assignCellTagsMutation = useAssignCellTags();

  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
    setFormData({ ...cell });
    setSelectedTags(cellTags);
  };

  useEffect(() => {
    if (cellTags.length > 0) {
      setSelectedTags(cellTags);
    }
  }, [cellTags]);

  const handleClose = () => setOpen(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Update cell data
      const cellResponse = await updateCell(cell.id, formData, auth?.accessToken);

      // Update cell tags
      const tagIds = selectedTags.map(tag => tag.id);
      await assignCellTagsMutation.mutateAsync({ cellId: cell.id, tagIds });

      setResponse(cellResponse);
      refetch();
    } catch (err) {
      console.error('Edit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* copied account edit profile button styling */}
      <Button
        variant='contained'
        onClick={handleOpen}
        sx={{ backgroundColor: '#588157', '&:hover': { backgroundColor: '#3a5a40' } }}
      >
        Edit
      </Button>

      <Modal open={isOpen} onClose={handleClose} aria-labelledby='edit-cell-modal-title'>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 450,
            bgcolor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: 'none',
            overflow: 'hidden',
          }}
          component='form'
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {!response ? (
            <>
              {/* Header Section */}
              <Box sx={{ 
                backgroundColor: '#588157', 
                padding: '1.5rem 2rem',
                position: 'relative',
                mb: 0
              }}>
                <IconButton
                  sx={{ 
                    position: 'absolute', 
                    top: '0.75rem', 
                    right: '0.75rem',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                  aria-label='close'
                  size='small'
                  onClick={handleClose}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
                <Typography 
                  variant='h5' 
                  component='h2'
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.5rem'
                  }}
                >
                  Edit Cell
                </Typography>
                <Typography 
                  variant='body2' 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5
                  }}
                >
                  Update your environmental monitoring cell settings
                </Typography>
              </Box>

              {/* Form Section */}
              <Box sx={{ padding: '2rem' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <TextField
                    label="Cell Name"
                    value={formData.name || ''}
                    onChange={handleChange('name')}
                    fullWidth
                    required
                    error={!formData.name?.trim()}
                    helperText={!formData.name?.trim() ? 'Cell name is required' : ''}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label="Location"
                    value={formData.location || ''}
                    onChange={handleChange('location')}
                    fullWidth
                    required
                    error={!formData.location?.trim()}
                    helperText={!formData.location?.trim() ? 'Location is required' : ''}
                    placeholder='e.g., North Campus Field'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label="Latitude"
                    value={formData.lat || ''}
                    onChange={handleChange('lat')}
                    fullWidth
                    required
                    error={!formData.lat?.toString().trim() || isNaN(Number(formData.lat))}
                    helperText={!formData.lat?.toString().trim() ? 'Latitude is required' : isNaN(Number(formData.lat)) ? 'Please enter a valid number' : ''}
                    placeholder='e.g., 36.9741'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label="Longitude"
                    value={formData.long || ''}
                    onChange={handleChange('long')}
                    fullWidth
                    required
                    error={!formData.long?.toString().trim() || isNaN(Number(formData.long))}
                    helperText={!formData.long?.toString().trim() ? 'Longitude is required' : isNaN(Number(formData.long)) ? 'Please enter a valid number' : ''}
                    placeholder='e.g., -122.0308'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    axiosPrivate={axiosPrivate}
                  />
                </Box>

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end',
                  mt: '2rem',
                  pt: '1.5rem',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Button
                    variant='outlined'
                    onClick={handleClose}
                    disabled={isSubmitting}
                    sx={{
                      borderColor: '#ddd',
                      color: '#666',
                      '&:hover': {
                        borderColor: '#bbb',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant='contained'
                    disabled={isSubmitting || !formData.name?.trim() || !formData.location?.trim() || !formData.lat?.toString().trim() || !formData.long?.toString().trim() || isNaN(Number(formData.lat)) || isNaN(Number(formData.long))}
                    sx={{
                      backgroundColor: '#588157',
                      '&:hover': { backgroundColor: '#3a5a40' },
                      '&:disabled': { 
                        backgroundColor: '#ccc',
                        color: '#888'
                      },
                      borderRadius: '8px',
                      px: '1.5rem'
                    }}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Cell'}
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <>
              {/* Success Header */}
              <Box sx={{ 
                backgroundColor: '#2e7d32', 
                padding: '1.5rem 2rem',
                position: 'relative',
                mb: 0
              }}>
                <Typography 
                  variant='h5' 
                  component='h2'
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.5rem'
                  }}
                >
                  Cell Updated Successfully!
                </Typography>
                <Typography 
                  variant='body2' 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5
                  }}
                >
                  Your cell settings have been saved
                </Typography>
              </Box>

              {/* Success Content */}
              <Box sx={{ padding: '2rem' }}>
                <Button
                  variant='contained'
                  onClick={handleClose}
                  sx={{
                    backgroundColor: '#2e7d32',
                    '&:hover': { backgroundColor: '#1b5e20' },
                    borderRadius: '8px',
                    width: '100%',
                    py: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                >
                  Done
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default EditCellModal;

// expected prop types for EditCellModal - prop validation
EditCellModal.propTypes = {
  cell: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    long: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};