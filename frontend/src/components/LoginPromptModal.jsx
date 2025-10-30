import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { signIn } from '../services/auth';

const LoginPromptModal = ({ open, onClose }) => {
  const handleLogin = () => {
    signIn();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E2D25' }}>
            Authentication Required
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          Please log in to access live streaming data. This feature is available only to authenticated users.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.secondary',
            mr: 2,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLogin}
          variant="contained"
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '999px',
            px: 3,
            py: 1,
            backgroundColor: '#0F172A',
            '&:hover': {
              backgroundColor: '#111827',
            },
          }}
        >
          Sign In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

LoginPromptModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default LoginPromptModal;



