import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAxiosPrivate from '../../../auth/hooks/useAxiosPrivate';

function AccountInfo() {
  const axiosPrivate = useAxiosPrivate();
  const contextData = useOutletContext();
  const user = contextData?.[4]; // Keeping the same context access pattern as original
  const setUser = contextData?.[5]; // Get the setUser function from context

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState(null);

  if (!user) {
    return <></>;
  }

  /**
   * Handles opening the edit form and initializes form data
   */
  const handleEdit = () => {
    setIsEditing(true);
    // Set form data with current values to avoid race condition
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
    });
    setError(null);
  };

  /**
   * Validates form input before submission
   * @returns {boolean} True if valid, false otherwise
   */
  const validateForm = () => {
    if (!formData.first_name || formData.first_name.trim() === '') {
      setError('First name cannot be empty');
      return false;
    }
    if (!formData.last_name || formData.last_name.trim() === '') {
      setError('Last name cannot be empty');
      return false;
    }
    return true;
  };

  /**
   * Handles saving updated user information
   */
  const handleSave = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosPrivate.put('/user', formData);
      if (response.status === 200 && response.data) {
        // Update the user data in parent context
        if (setUser) {
          setUser({
            ...user,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
          });
        }
        setIsEditing(false);
        setError(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles canceling the edit operation
   */
  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#A0A0A0',
        width: '30vw',
        p: 2,
        borderRadius: '10px',
        position: 'relative',
      }}
    >
      <Fade in={showSuccess} timeout={700}>
        <Alert
          severity='success'
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            left: 16,
            zIndex: 1,
          }}
        >
          Profile updated successfully!
        </Alert>
      </Fade>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h5' sx={{ color: '#588157', fontWeight: 'bold' }}>
          Account Info
        </Typography>
        <Button
          variant='contained'
          onClick={handleEdit}
          sx={{
            backgroundColor: '#588157',
            '&:hover': {
              backgroundColor: '#3a5a40',
            },
          }}
        >
          Edit Profile
        </Button>
      </Box>

      <Box
        sx={{
          backgroundColor: 'Gray',
          mb: 1,
          borderRadius: '8px',
          marginTop: '2%',
        }}
      >
        <Typography variant='h6' sx={{ marginLeft: '5%', p: 1 }}>
          Email: {user.email}
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: 'Gray',
          mb: 1,
          borderRadius: '8px',
          marginTop: '2%',
        }}
      >
        <Typography variant='h6' sx={{ marginLeft: '5%', p: 1 }}>
          Name: {user.first_name} {user.last_name}
        </Typography>
      </Box>

      <Dialog
        open={isEditing}
        onClose={handleCancel}
        PaperProps={{
          sx: {
            width: '400px',
            maxWidth: '90vw',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid #E9ECEF',
            px: 3,
            py: 2,
          }}
        >
          Edit Profile
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            label='First Name'
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            error={error && error.includes('First name')}
            required
          />
          <TextField
            fullWidth
            label='Last Name'
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            error={error && error.includes('Last name')}
            required
          />
          {error && (
            <Typography color='error' sx={{ mt: 2, fontSize: '0.875rem' }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E9ECEF' }}>
          <Button
            onClick={handleCancel}
            sx={{
              color: '#6C757D',
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#588157',
              '&:hover': {
                backgroundColor: '#3a5a40',
              },
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccountInfo;
