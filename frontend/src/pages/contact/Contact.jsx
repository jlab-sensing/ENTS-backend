import React from 'react'
import { Box, Button } from '@mui/material';
import Swal from 'sweetalert2'
import Nav from '../../components/Nav';

const Contact = () => {
   const onSubmit = async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);

      formData.append("access_key", "986e8fd0-f41f-4630-bbf7-637265ee3b52");

      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      const res = await fetch("https://api.web3forms.com/submit", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
         },
         body: json
      }).then((res) => res.json());

      if (res.success) {
         Swal.fire({
            title: "Success!",
            text: "Message sent successfully!",
            icon: "success"
         });
      }
   };
  
   const styles = {
      leafletContainer: {
         width: '100%',
         height: '100vh',
      },
   };

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
      <Nav />
      <Box
         component = {'section'}
         sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#C0C5AD'
         }}
      >
         <Box
            component = {'form'}
            sx={{
               marginTop: '20px',
               maxWidth: '600px',
               width: '100%',
               backgroundColor: '#DAD7CD',
               padding: '25px 25px 30px',
               borderRadius: '8px',
               boxShadow: '0 0 10px rgba(0, 0, 0, .1)',
               color: '#333',
               margin: '25px',
               fontSize: '30px',
               textAlign: 'center'
            }}
            onSubmit={onSubmit}
         >
            <Box
               component = {'h2'}
               sx = {{
                  fontSize: '62px',
                  textAlign: 'center',
                  color: '#3A5A50'
               }}   
            >
               Contact jLab
            </Box>

            <Box
               component = {'h2'}
               sx = {{
                  fontSize: '21px',
                  textAlign: 'left',
                  color: '#3A5A50'
               }}   
            >
               Want to see new features? Give us your suggestions here
            </Box>


            <Box sx={{
               marginTop: '20px',
            }}>
               <label>Full Name</label>
               <Box 
                  component = {'input'}
                  sx={{
                     width: '95%',
                     height: '50px',
                     background: 'transparent',
                     border: '2px solid #ddd',
                     outline: 'none',
                     borderRadius: '6px',
                     padding: '15px',
                     fontSize: '16px',
                     color: '#333',
                     marginTop: '8px',
                  }} 
                  type="text"  
                  placeholder="Enter Name" 
                  name="name" 
                  required />
            </Box>

            <Box sx={{
               marginTop: '20px',
            }}>
               <label>Email Address</label>
               <Box 
                  component = {'input'}
                  sx={{
                     width: '95%',
                     height: '50px',
                     background: 'transparent',
                     border: '2px solid #ddd',
                     outline: 'none',
                     borderRadius: '6px',
                     padding: '15px',
                     fontSize: '16px',
                     color: '#333',
                     marginTop: '8px',
                  }} 
                  type="email"  
                  placeholder="user@email.com" 
                  name="email" 
                  required />
            </Box>

            <Box sx={{
               marginTop: '20px',
            }}>
               <label>Your Message</label>
               <Box 
                  component = {'textarea'}
                  sx={{
                     width: '95%',
                     height: '50px',
                     backgroundColor: '#D9D9D9',
                     border: 'none',
                     padding: '15px',
                     marginTop: '8px',
                     height: '200px',
                     resize: 'none',
                     fontSize: '18px',
                     fontFamily: 'Inter',
                     fontWeight: '200',
                     boxShadow: '2'
                  }} 
                  type="email"  
                  placeholder="Message Text" 
                  name="message" 
                  required />
            </Box>

            <Button
               sx={{
                  backgroundColor: '#B3C297',
                  '&:hover': { backgroundColor: '#A3B18A' },
                  color: '#364F42',
                  px: '10px',
                  width: { xs: '100%', sm: 'auto' },
               }}
               type="submit">
                  Send Message
            </Button>
         </Box>
      </Box>
   </Box>
  );
}

export default Contact