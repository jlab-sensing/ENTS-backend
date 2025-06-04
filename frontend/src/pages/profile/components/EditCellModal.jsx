import React, { useState } from 'react';
import { Modal, Box, Typography, Button, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useOutletContext } from 'react-router-dom';
import { updateCell } from '../../../services/cell';
import PropTypes from 'prop-types';

function EditCellModal({ cell }) {
  const data = useOutletContext();
  const refetch = data[3];

  const [isOpen, setOpen] = useState(false);
  const [formData, setFormData] = useState({ ...cell });
  const [response, setResponse] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
    setFormData({ ...cell });
  };

  const handleClose = () => setOpen(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = () => {
    setSubmitting(true);

    // simulate a successful request
    // setTimeout(() => {
    //   const fakeResponse = { success: true, data: formData };
    //   setResponse(fakeResponse);
    //   refetch();
    //   setSubmitting(false);
    // }, 1000);
    
    // backend request implemented - DONE
    updateCell(cell.id, formData)
      .then((res) => {
        setResponse(res);
        refetch();
      })
      .catch((err) => console.error('Edit failed:', err))
      .finally(() => setSubmitting(false));
    
  };

  return (
    <>
      {/* copied account edit profile button styling */}
      <Button variant="contained" onClick={handleOpen} 
        sx={{ backgroundColor: '#588157', 
        '&:hover': { backgroundColor: '#3a5a40' } }}>
        Edit
      </Button>

      <Modal open={isOpen} onClose={handleClose} aria-labelledby="edit-cell-modal-title">
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: '12px',
            boxShadow: 24,
            p: 4,
          }}
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {!response ? (
            <>
              <Typography id="edit-cell-modal-title" variant="h6" component="h2" gutterBottom>
                Edit Cell {cell.id} Info
              </Typography>
              <TextField
                label="Name"
                value={formData.name}
                onChange={handleChange('name')}
                fullWidth
                margin="normal"
                required
                error={formData.name?.length === 0}
              />
              <TextField
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                fullWidth
                margin="normal"
                required
                error={formData.location?.length === 0}
              />
                <TextField
                  label="Longitude"
                  variant="outlined"
                  value={formData.long || ''}
                  onChange={handleChange('long')}
                  fullWidth
                  margin="normal"
                  required
                  error={formData.long?.length === 0 || isNaN(Number(formData.long))}
                  helperText={isNaN(Number(formData.long)) ? 'Please Enter Numbers' : ''}
                />
                <TextField
                  label="Latitude"
                  variant="outlined"
                  value={formData.lat || ''}
                  onChange={handleChange('lat')}
                  fullWidth
                  margin="normal"
                  required
                  error={formData.lat?.length === 0 || isNaN(Number(formData.lat))}
                  helperText={isNaN(Number(formData.lat)) ? 'Please Enter Numbers' : ''}
                />

              {/* following AccountInfo styling */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                <Button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  sx={{
                    color: '#6C757D',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    backgroundColor: '#588157',
                    '&:hover': {
                      backgroundColor: '#3a5a40',
                    },
                  }}
                >
                  Edit Cell
                </Button>
              </Box>
            </>
          ) : (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='close'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
              <h1>Cell Edited</h1>
              <p>The cell with ID {cell.id} has been successfully edited.</p>
              <Button onClick={handleClose}>Done</Button>
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
