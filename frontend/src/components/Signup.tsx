import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService, { SignupFanData, SignupOrganizerData } from '../services/api/auth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Link,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';

type UserType = 'fan' | 'organizer';

type FormData = (SignupFanData | SignupOrganizerData) & {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>('fan');
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    ...(userType === 'fan' 
      ? { username: '', preferredGenre: '', phoneNumber: '' }
      : { organizationName: '', contactInfo: '' }
    )
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: UserType | null,
  ) => {
    if (newType !== null) {
      setUserType(newType);
      setFormData({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        ...(newType === 'fan'
          ? { username: '', preferredGenre: '', phoneNumber: '' }
          : { organizationName: '', contactInfo: '' }
        )
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await (userType === 'fan'
        ? authService.signupFan(formData as SignupFanData)
        : authService.signupOrganizer(formData as SignupOrganizerData)
      );
      
      login(response.token, response.user);
      
      if (response.user.userType === 'fan') {
        navigate('/dashboard');
      } else if (response.user.userType === 'organizer') {
        navigate('/organizers');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const commonTextFieldProps = {
    variant: 'outlined' as const,
    fullWidth: true,
    required: true,
    disabled: isLoading,
    InputLabelProps: { sx: { color: '#a0a0a0' } },
    sx: {
      '& .MuiOutlinedInput-root': {
        color: '#f0f0f0',
        '& fieldset': { borderColor: '#444' },
        '&:hover fieldset': { borderColor: '#555' },
        '&.Mui-focused fieldset': { borderColor: '#007bff' },
      },
    },
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
        <Typography variant="h4" component="h2" sx={{ textAlign: 'center', color: '#f0f0f0', mb: 2, fontWeight: 700 }}>
          Create Account
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <ToggleButtonGroup
          value={userType}
          exclusive
          onChange={handleUserTypeChange}
          fullWidth
          sx={{ mb: 2,
            '& .MuiToggleButton-root': { 
              color: '#a0a0a0', 
              borderColor: '#444',
              '&.Mui-selected': {
                backgroundColor: '#007bff',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#0056b3',
                }
              },
            }
          }}
        >
          <ToggleButton value="fan">Fan</ToggleButton>
          <ToggleButton value="organizer">Organizer</ToggleButton>
        </ToggleButtonGroup>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            {...commonTextFieldProps}
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            {...commonTextFieldProps}
          />
          <TextField
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            {...commonTextFieldProps}
          />
          <TextField
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            {...commonTextFieldProps}
          />

          {userType === 'fan' ? (
            <>
              <TextField
                label="Username"
                name="username"
                value={(formData as SignupFanData).username || ''}
                onChange={handleChange}
                {...commonTextFieldProps}
              />
              <TextField
                label="Preferred Genre"
                name="preferredGenre"
                value={(formData as SignupFanData).preferredGenre || ''}
                onChange={handleChange}
                {...commonTextFieldProps}
                required={false}
              />
              <TextField
                label="Phone Number"
                type="tel"
                name="phoneNumber"
                value={(formData as SignupFanData).phoneNumber || ''}
                onChange={handleChange}
                {...commonTextFieldProps}
                required={false}
              />
            </>
          ) : (
            <>
              <TextField
                label="Organization Name"
                name="organizationName"
                value={(formData as SignupOrganizerData).organizationName || ''}
                onChange={handleChange}
                {...commonTextFieldProps}
              />
              <TextField
                label="Contact Information"
                name="contactInfo"
                value={(formData as SignupOrganizerData).contactInfo || ''}
                onChange={handleChange}
                {...commonTextFieldProps}
              />
            </>
          )}

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
            {isLoading ? <CircularProgress size={24} sx={{color: 'white'}}/> : 'Create Account'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography color="#a0a0a0">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" sx={{ color: '#007bff', fontWeight: 500 }}>
              Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
} 