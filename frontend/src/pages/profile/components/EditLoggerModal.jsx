import React, { useState } from 'react';
import { Modal, Box, Typography, Button, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useOutletContext } from 'react-router-dom';
import { updateLogger } from '../../../services/logger';
import PropTypes from 'prop-types';

function EditLoggerModal({ logger }) {
  const data = useOutletContext();
  const refetch = data[9]; // Logger refetch function from outlet context

  const [isOpen, setOpen] = useState(false);
  const [formData, setFormData] = useState({ ...logger });
  const [appKey, setAppKey] = useState(''); // App Key field for UI only
  const [response, setResponse] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
    setFormData({ ...logger });
    setAppKey(''); // Reset app key
  };

  const handleClose = () => setOpen(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = () => {
    setSubmitting(true);

    // Note: App Key is not sent to backend - saved for future API integration
    const updateData = {
      name: formData.name,
      type: formData.type,
      device_eui: formData.device_eui,
      description: formData.description,
    };

    updateLogger(logger.id, updateData)
      .then((res) => {
        setResponse(res);
        refetch();
      })
      .catch((err) => console.error('Edit failed:', err))
      .finally(() => setSubmitting(false));
  };

  return (
    <>
      <Button 
        variant="contained" 
        onClick={handleOpen} 
        sx={{ 
          backgroundColor: '#588157', 
          '&:hover': { backgroundColor: '#3a5a40' },
          textTransform: 'none'
        }}
      >
        Edit
      </Button>

      <Modal open={isOpen} onClose={handleClose}>
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
                  Edit Logger
                </Typography>
                <Typography 
                  variant='body2' 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5
                  }}
                >
                  Update your environmental sensor logger settings
                </Typography>
              </Box>

              {/* Form Section */}
              <Box sx={{ padding: '2rem' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <TextField
                    label='Logger Name'
                    value={formData.name || ''}
                    onChange={handleChange('name')}
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label='Type'
                    value={formData.type || ''}
                    onChange={handleChange('type')}
                    fullWidth
                    placeholder='e.g., Multi-Sensor Device, IoT Device'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label='Device EUI'
                    value={formData.device_eui || ''}
                    onChange={handleChange('device_eui')}
                    fullWidth
                    placeholder='e.g., AA-11-BB-22-CC-33'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label='Description'
                    value={formData.description || ''}
                    onChange={handleChange('description')}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder='Describe the logger location and purpose'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label='App Key'
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    fullWidth
                    helperText='App Key for future API integration (optional)'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
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
                    variant='contained'
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.name?.trim()}
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
                    {isSubmitting ? 'Updating...' : 'Update Logger'}
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
                  Logger Updated Successfully!
                </Typography>
                <Typography 
                  variant='body2' 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5
                  }}
                >
                  Your logger settings have been saved
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

EditLoggerModal.propTypes = {
  logger: PropTypes.object.isRequired,
};

export default EditLoggerModal;