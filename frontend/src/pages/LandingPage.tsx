import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box, Paper, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Paper)(({ theme }: { theme: Theme }) => ({
  backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/images/concert-bg.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  padding: theme.spacing(15, 0),
  textAlign: 'center',
  borderRadius: 0,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}));

const StyledButton = styled(Button)(({ theme }: { theme: Theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  borderRadius: '30px',
  textTransform: 'none',
  fontWeight: 'bold',
}));

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <HeroSection>
      <Container maxWidth="md">
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '3rem', md: '4.5rem' },
            fontWeight: 'bold',
            mb: 4,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          Concert Booking System
        </Typography>
        
        <Typography
          variant="h5"
          sx={{
            mb: 6,
            opacity: 0.9,
            maxWidth: '800px',
            mx: 'auto',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          Book your favorite concerts with ease. Experience live music like never before.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <StyledButton
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/concerts')}
            sx={{
              backgroundColor: '#ff6b35',
              '&:hover': {
                backgroundColor: '#e55a2e',
              },
              mb: 2
            }}
          >
            Browse Concerts
          </StyledButton>
          
          <Box sx={{ display: 'block' }}>
            <StyledButton
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: '#1DB954',
                '&:hover': {
                  backgroundColor: '#1ed760',
                },
              }}
            >
              Login
            </StyledButton>
            
            <StyledButton
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Sign Up
            </StyledButton>
          </Box>
        </Box>
      </Container>
    </HeroSection>
  );
};

export default LandingPage; 