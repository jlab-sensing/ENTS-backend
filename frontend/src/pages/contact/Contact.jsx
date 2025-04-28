import { Box, Button, TextField, Typography } from '@mui/material';
import React from 'react';
import Swal from 'sweetalert2';
import useAuth from '../../auth/hooks/useAuth';
import Nav from '../../components/Nav';

const Contact = () => {
  const { user, setUser, loggedIn, setLoggedIn } = useAuth();
  const onSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    formData.append('access_key', '047f6953-649d-41b9-b286-941f9f54b62b');

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: json,
    }).then((res) => res.json());

    if (res.success) {
      Swal.fire({
        title: 'Success!',
        text: 'Message sent successfully!',
        icon: 'success',
      });
    }
  };

  var marginSize = '16px';
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#DAD7CD',
      }}
    >
      <Nav user={user} setUser={setUser} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <Box
        component={'section'}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '1000vh',
          backgroundColor: '#C0C5AD',
        }}
      >
        <Box
          component={'form'}
          sx={{
            maxWidth: '720px',
            width: '100%',
            backgroundColor: '#DAD7CD',
            padding: '25px 25px 30px',
            borderRadius: '15px',
            boxShadow: '0 0 10px rgba(0, 0, 0, .1)',
            color: '#333',
            margin: '25px',
            marginTop: '500-5%',
            fontSize: '30px',
            textAlign: 'center',
            maxHeight: '720px',
          }}
          onSubmit={onSubmit}
        >
          <Typography
            component={'h2'}
            sx={{
              marginTop: '15px',
              fontSize: '50px',
              fontWeight: '600',
              textAlign: { xs: 'left', md: 'start' },
              color: '#3A5A50',
              marginLeft: '6%',
            }}
          >
            Contact jLab
          </Typography>

          <Typography
            component={'h2'}
            sx={{
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: { xs: 'left', md: 'start' },
              color: '#3A5A50',
              opacity: '60%',
              marginLeft: '6%',
            }}
          >
            Want to reach out? Leave your questions, concerns, or comments below.
          </Typography>

          <Box
            sx={{
              marginTop: '12px',
            }}
          >
            <Typography
              component={'h2'}
              sx={{
                fontSize: '16px',
                textAlign: { xs: 'left', md: 'start' },
                color: '#1E1E1E',
                marginLeft: '6%',
              }}
            >
              Name:
              <Typography component={'span'} sx={{ color: '#FF0000' }}>
                *
              </Typography>
            </Typography>
            <TextField
              fullWidth
              required
              name='name'
              placeholder='Enter Name'
              variant='outlined'
              sx={{
                width: '70%',
                marginLeft: '-15%',
                marginTop: '7px',
                backgroundColor: '#D9D9D9',
              }}
            />
          </Box>

          <Box
            sx={{
              marginTop: marginSize,
            }}
          >
            <Typography
              component={'h2'}
              sx={{
                fontSize: '16px',
                textAlign: { xs: 'left', md: 'start' },
                color: '#1E1E1E',
                marginLeft: '6%',
              }}
            >
              Email:
              <Typography component={'span'} sx={{ color: '#FF0000' }}>
                *
              </Typography>
            </Typography>
            <TextField
              fullWidth
              required
              name='email'
              type='email'
              placeholder='user@email.com'
              variant='outlined'
              sx={{
                width: '70%',
                marginLeft: '-15%',
                marginTop: '7px',
                backgroundColor: '#D9D9D9',
              }}
            />
          </Box>

          <Box
            sx={{
              marginTop: marginSize,
            }}
          >
            <Typography
              component={'h2'}
              sx={{
                fontSize: '16px',
                textAlign: { xs: 'left', md: 'start' },
                color: '#1E1E1E',
                marginLeft: '6%',
              }}
            >
              Message:
              <Typography component={'span'} sx={{ color: '#FF0000' }}>
                *
              </Typography>
            </Typography>
            <TextField
              fullWidth
              required
              name='message'
              placeholder='Message Text'
              variant='outlined'
              multiline
              minRows={5}
              maxRows={8}
              sx={{
                width: '85%',
                marginLeft: '0%',
                marginTop: '7px',
                backgroundColor: '#D9D9D9',
                overflow: 'auto',
              }}
            />
          </Box>

          {/* Add spacing between message field and button */}
          <Box sx={{ mt: 4, mb: 3 }} />

          <Button
            sx={{
              backgroundColor: '#B3C297',
              '&:hover': { backgroundColor: '#A3B18A' },
              color: '#364F42',
              px: '10px',
              py: '8px',
              width: { xs: '100%', sm: 'auto' },
              fontSize: '16px',
              fontWeight: 'medium',
              marginTop: '8px',
            }}
            type='submit'
          >
            SEND MESSAGE
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Contact;
