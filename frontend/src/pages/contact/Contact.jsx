import React from 'react'
import { Box, Button, Typography } from '@mui/material';
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
            height: '1000vh',
            backgroundColor: '#C0C5AD'
         }}
      >
         <Box
            component = {'form'}
            sx={{
               maxWidth: '1280px',
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
               height: '80%'
            }}
            onSubmit={onSubmit}
         >
            <Typography
               component = {'h2'}
               sx = {{
                  marginTop: '30px',
                  fontSize: '62px',
                  fontWeight: 'bold',
                  textAlign: {xs: 'left', md: 'start'},
                  color: '#3A5A50',
                  marginLeft: '5%',
               }}   
            >
               Contact jLab
            </Typography>

            <Typography
               component = {'h2'}
               sx = {{
                  fontSize: '21px',
                  fontWeight: 'bold',
                  textAlign: {xs: 'left', md: 'start'},
                  color: '#3A5A50',
                  opacity: '60%',
                  marginLeft: '5%',
               }}   
            >
               What can we help you with?
            </Typography>

            <Box sx={{
               marginTop: '20px',
            }}>
               {/* <label>Full Name</label> */}
               <Typography
                  component = {'h2'}
                  sx = {{
                     fontSize: '18px',
                     textAlign: {xs: 'left', md: 'start'},
                     color: '#1E1E1E',
                     marginLeft: '6%',
                  }}   
               >
                  Name:
                  <Typography
                     component = {'span'}
                     sx={{color: '#FF0000'}}
                     >
                        *
                  </Typography>
               </Typography>

               <Box 
                  component = {'input'}
                  sx={{
                     width: '70%',
                     height: '50px',
                     backgroundColor: '#D9D9D9',
                     border: 'none',
                     paddingLeft: '15px',
                     paddingBottom: '5px',
                     paddingTop: '-5px',
                     marginTop: '7px',
                     marginLeft: '-15%',
                     resize: 'none',
                     fontSize: '18px',
                     fontFamily: 'Inter',
                     fontWeight: '200',
                     boxShadow: '2',
                  }} 
                  type="text"  
                  placeholder="Enter Name" 
                  name="name" 
                  required />
            </Box>

            <Box sx={{
               marginTop: '20px',
            }}>
               <Typography
                  component = {'h2'}
                  sx = {{
                     fontSize: '18px',
                     textAlign: {xs: 'left', md: 'start'},
                     color: '#1E1E1E',
                     marginLeft: '6%',
                  }}   
               >
                  Email:
                  <Typography
                     component = {'span'}
                     sx={{color: '#FF0000'}}
                     >
                        *
                  </Typography>
               </Typography>
               <Box 
                  component = {'input'}
                  sx={{
                     width: '70%',
                     height: '50px',
                     backgroundColor: '#D9D9D9',
                     border: 'none',
                     paddingLeft: '15px',
                     paddingBottom: '5px',
                     paddingTop: '-5px',
                     marginTop: '7px',
                     marginLeft: '-15%',
                     resize: 'none',
                     fontSize: '18px',
                     fontFamily: 'Inter',
                     fontWeight: '200',
                     boxShadow: '2',
                  }} 
                  type="email"  
                  placeholder="user@email.com" 
                  name="email" 
                  required />
            </Box>

            <Box sx={{
               marginTop: '20px',
            }}>
               <Typography
                  component = {'h2'}
                  sx = {{
                     fontSize: '18px',
                     textAlign: {xs: 'left', md: 'start'},
                     color: '#1E1E1E',
                     marginLeft: '6%',
                  }}   
               >
                  Message:
                  <Typography
                     component = {'span'}
                     sx={{color: '#FF0000'}}
                     >
                        *
                  </Typography>
               </Typography>
               <Box 
                  component = {'textarea'}
                  sx={{
                     width: '90%',
                     backgroundColor: '#D9D9D9',
                     border: 'none',
                     paddingLeft: '15px',
                     paddingBottom: '5px',
                     paddingTop: '15px',
                     marginTop: '7px',
                     marginLeft: '5%',
                     resize: 'none',
                     fontSize: '18px',
                     fontFamily: 'Inter',
                     fontWeight: '200',
                     boxShadow: '2',
                     height: '200px',
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