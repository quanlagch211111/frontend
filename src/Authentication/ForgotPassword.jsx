import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../services/AuthProvider';
import {
  Box,
  Button,
  TextField,
  Link,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const { forgotPassword, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      console.error('Forgot password error:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
      <Typography component="h1" variant="h5" align="center" gutterBottom>
        Forgot Password
      </Typography>
      
      {success ? (
        <Alert severity="success" sx={{ my: 2 }}>
          Password reset instructions have been sent to your email address.
        </Alert>
      ) : (
        <>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading || !email}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
        </>
      )}

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Link component={RouterLink} to="/login" variant="body2">
          Return to Sign In
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPassword;