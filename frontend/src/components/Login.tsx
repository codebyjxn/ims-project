import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService, { LoginCredentials } from '../services/api/auth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      login(response.token, response.user);
      
      // Navigate based on user type
      if (response.user.userType === 'admin') {
        navigate('/admin');
      } else if (response.user.userType === 'fan') {
        navigate('/dashboard');
      } else if (response.user.userType === 'organizer') {
        navigate('/organizers');
      } else {
        navigate('/'); // Default to landing page for other user types
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: '#1a1c20',
        margin: 0,
        padding: 0,
        position: 'relative',
      }}
    >
      <Link
        component={RouterLink}
        to="/"
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          background: 'rgba(42, 44, 48, 0.8)',
          padding: '10px 15px',
          borderRadius: '20px',
          textDecoration: 'none',
          color: '#f0f0f0',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: '#2a2c30',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        }}
      >
        ← Back to Home
      </Link>
      <Box
        sx={{
          background: 'rgba(30, 32, 36, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          width: '100%',
          maxWidth: '420px',
          margin: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h4" component="h2" sx={{ textAlign: 'center', color: '#f0f0f0', mb: 3, fontWeight: 700 }}>
          Welcome Back!
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextField
            label="Email"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            disabled={isLoading}
            variant="outlined"
            InputLabelProps={{ sx: { color: '#a0a0a0' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f0f0f0',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#555' },
                '&.Mui-focused fieldset': { borderColor: '#007bff' },
              },
            }}
          />

          <TextField
            label="Password"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            disabled={isLoading}
            variant="outlined"
            InputLabelProps={{ sx: { color: '#a0a0a0' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f0f0f0',
                '& fieldset': { borderColor: '#444' },
                '&:hover fieldset': { borderColor: '#555' },
                '&.Mui-focused fieldset': { borderColor: '#007bff' },
              },
            }}
          />

          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoading}
            sx={{
              background: '#007bff',
              color: 'white',
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: 600,
              mt: '1rem',
              '&:hover': { background: '#0056b3' },
              '&:disabled': { backgroundColor: '#ccc' },
            }}
          >
            {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Login'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography color="#a0a0a0">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/signup" sx={{ color: '#007bff', fontWeight: 500 }}>
              Sign up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
} 