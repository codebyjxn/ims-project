import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box, Paper, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

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
  const { user, isAuthenticated, logout } = useAuth();

  // Determine user role
  const userType = user?.userType;

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
          ConcertGo
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

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
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
            }}
          >
            Browse Concerts
          </StyledButton>
          
          {!isAuthenticated && (
            <>
          <StyledButton
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Login
          </StyledButton>
          <StyledButton
            variant="outlined"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Sign Up
          </StyledButton>
            </>
          )}

          {isAuthenticated && userType === 'fan' && (
            <>
              <StyledButton
                variant="outlined"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Fan Panel
              </StyledButton>
              <StyledButton
                variant="outlined"
                size="large"
                onClick={logout}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Logout
              </StyledButton>
            </>
          )}

          {isAuthenticated && userType === 'admin' && (
            <>
              <StyledButton
                variant="outlined"
                size="large"
                onClick={() => navigate('/admin')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Admin Panel
              </StyledButton>
              <StyledButton
                variant="outlined"
                size="large"
                onClick={logout}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Logout
              </StyledButton>
            </>
          )}

          {isAuthenticated && userType === 'organizer' && (
            <>
              <StyledButton
                variant="outlined"
                size="large"
                onClick={() => navigate('/organizers')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Organizer Panel
              </StyledButton>
              <StyledButton
                variant="outlined"
                size="large"
                onClick={logout}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Logout
              </StyledButton>
            </>
          )}
        </Box>
      </Container>
    </HeroSection>
  );
};

export default LandingPage; 