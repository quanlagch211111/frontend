import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Box, Paper, Typography } from '@mui/material';

const AuthLayout = () => {
  return (
    <Container component="main" maxWidth="xs" sx={{ pt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
      >
        <Typography 
          component="h1" 
          variant="h4" 
          color="primary" 
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          MERN Services
        </Typography>
        <Outlet />
      </Paper>
      <Box mt={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} MERN Services. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default AuthLayout;