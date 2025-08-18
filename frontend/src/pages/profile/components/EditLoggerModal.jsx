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
        variant='contained'
        color='primary'
        size='small'
        onClick={handleOpen}
        sx={{ textTransform: 'none' }}
      >
        EDIT
      </Button>

      <Modal open={isOpen} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          {!response ? (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                onClick={handleClose}
              >
                <CloseIcon />
              </IconButton>

              <Typography variant='h6' component='h2' sx={{ mb: 3 }}>
                Edit Logger
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label='Name'
                  value={formData.name || ''}
                  onChange={handleChange('name')}
                  fullWidth
                  required
                />
                <TextField
                  label='Type'
                  value={formData.type || ''}
                  onChange={handleChange('type')}
                  fullWidth
                />
                <TextField
                  label='Device EUI'
                  value={formData.device_eui || ''}
                  onChange={handleChange('device_eui')}
                  fullWidth
                />
                <TextField
                  label='Description'
                  value={formData.description || ''}
                  onChange={handleChange('description')}
                  fullWidth
                  multiline
                  rows={2}
                />
                <TextField
                  label='App Key'
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  fullWidth
                  helperText='App Key for future API integration'
                />
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={handleClose} color='secondary'>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant='contained'
                  color='primary'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Logger'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant='h6' sx={{ color: 'success.main', mb: 2 }}>
                Logger Updated Successfully!
              </Typography>
              <Button
                onClick={handleClose}
                variant='contained'
                color='success'
                fullWidth
                sx={{ mt: 2 }}
              >
                Done
              </Button>
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