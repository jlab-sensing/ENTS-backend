import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Modal, Typography } from '@mui/material';
import { React, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deleteCell } from '../../../services/cell';
import PropTypes from 'prop-types';

function DeleteCellModal({ ids }) {
  let data = useOutletContext();
  const refetch = data[3];
  const user = data[4];
  data = data[0];
  const [isOpen, setOpen] = useState(false);
  const [response, setResponse] = useState(null);
  const [cellIds, setCellIds] = useState([]);

  const handleOpen = () => {
    if (ids && ids.length > 0) {
      setOpen(true);
      setCellIds(ids);
    }
    setResponse(null);
  };

  const handleClose = () => {
    setOpen(false);
    setResponse(null);
    setCellIds([]);
  };

  useEffect(() => {
    console.log(response);
  }, [response]);

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Button sx={{ color: 'black' }} key='delete' onClick={handleOpen}>
        <DeleteIcon />
      </Button>

      <Modal
        open={isOpen}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
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
        >
          {response == null && (
            <>
              {/* Header Section */}
              <Box sx={{ 
                backgroundColor: '#d32f2f', 
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
                  Delete {cellIds.length > 1 ? `${cellIds.length} Cells` : 'Cell'}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5
                  }}
                >
                  This action cannot be undone
                </Typography>
              </Box>

              {/* Content Section */}
              <Box sx={{ padding: '2rem' }}>
                <Typography variant='body1' sx={{ mb: 3, color: '#666', lineHeight: 1.6 }}>
                  Are you sure you want to delete {cellIds.length > 1 ? `these ${cellIds.length} cells` : 'this cell'}? All associated data and configurations will be permanently removed.
                </Typography>

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end',
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
                    onClick={() => {
                      // Delete all selected cells
                      Promise.all(cellIds.map(cellId => deleteCell(cellId)))
                        .then(() => {
                          setResponse({ success: true, count: cellIds.length });
                          refetch();
                        })
                        .catch((error) => console.error(error));
                    }}
                    sx={{
                      backgroundColor: '#d32f2f',
                      '&:hover': { backgroundColor: '#b71c1c' },
                      borderRadius: '8px',
                      px: '1.5rem'
                    }}
                  >
                    Delete {cellIds.length > 1 ? `${cellIds.length} Cells` : 'Cell'}
                  </Button>
                </Box>
              </Box>
            </>
          )}
          {response && (
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
                  {response?.count > 1 ? `${response.count} Cells Deleted Successfully!` : 'Cell Deleted Successfully!'}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5
                  }}
                >
                  {response?.count > 1 ? 'The cells have been removed from your system' : 'The cell has been removed from your system'}
                </Typography>
              </Box>

              {/* Success Content */}
              <Box sx={{ padding: '2rem' }}>
                <Box sx={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  mb: '1.5rem'
                }}>
                  <Typography variant='body1' sx={{ color: '#666', lineHeight: 1.6 }}>
                    {response?.count > 1
                      ? `${response.count} cells have been successfully deleted.`
                      : `The cell with ID ${cellIds[0]} has been successfully deleted.`
                    }
                  </Typography>
                </Box>

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

export default DeleteCellModal;

DeleteCellModal.propTypes = {
  ids: PropTypes.arrayOf(PropTypes.number).isRequired,
};
