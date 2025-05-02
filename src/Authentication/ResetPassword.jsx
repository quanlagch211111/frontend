import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthProvider';
import {
  Box,
  Button,
  TextField,
  Link,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Function to get URL query parameters
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const { resetPassword, loading, error } = useAuth();

  const query = useQuery();
  const token = query.get('token');

  useEffect(() => {
    if (!token) {
      setTokenError('Reset token is missing. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    
    try {
      await resetPassword(token, password);
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (tokenError) {
    return (
      <Box sx={{ mt: 1, width: '100%' }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Reset Password
        </Typography>
        <Alert severity="error" sx={{ my: 2 }}>
          {tokenError}
        </Alert>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            Request a new password reset
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
      <Typography component="h1" variant="h5" align="center" gutterBottom>
        Reset Password
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 3 }}>
        Enter your new password below.
      </Typography>
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="New Password"
        type={showPassword ? 'text' : 'password'}
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!validationError || !!error}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={togglePasswordVisibility}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm New Password"
        type={showPassword ? 'text' : 'password'}
        id="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={!!validationError || !!error}
      />

      {validationError && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {validationError}
        </Typography>
      )}

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
        disabled={loading || !password || !confirmPassword}
      >
        {loading ? <CircularProgress size={24} /> : 'Reset Password'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Link component={RouterLink} to="/login" variant="body2">
          Return to Sign In
        </Link>
      </Box>
    </Box>
  );
};

export default ResetPassword;