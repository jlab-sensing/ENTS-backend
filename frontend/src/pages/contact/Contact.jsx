import React from 'react'
import './Contact.css'
import { Box } from '@mui/material';
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
            backgroundColor: '#00cc00'
         }}
      >
         <Box
            component = {'form'}
            sx={{marginTop: '20px'}}
            onSubmit={onSubmit}
         >
            <Box
               component = {'h2'}
               sx = {{
                  fontSize: '30px',
                  textAlign: 'center'
               }}   
            >Contact Form</Box>
            <Box s={{marginTop: '20px'}}>
               <label>Full Name</label>
               <input type="text" className="field" placeholder="Enter your name" name="name" required />
            </Box>
            <div className="input-box">
               <label>Email Address</label>
               <input type="email" className="field" placeholder="Enter your email" name="email" required />
            </div>
            <div className="input-box">
               <label>Your Message</label>
               <textarea name="message" type="Your Message" className="field mess" placeholder="Enter your message"  required ></textarea>
            </div>
            <button type="submit">Send Message</button>
         </Box>
      </Box>
   </Box>
  );
}

export default Contact