import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ p: 2 }}>
      <AppBar 
        position="sticky"
        sx={{
          top: 16, // Stick to the top with a 16px margin
          borderRadius: 3, // Rounded corners
          backgroundColor: 'rgba(30, 30, 30, 0.7)', // Semi-transparent dark background
          backdropFilter: 'blur(10px)', // Glassmorphism effect
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', // Floating shadow
          border: '1px solid rgba(255, 255, 255, 0.18)', // Subtle border
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            ConcertGo
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              onClick={() => navigate('/concerts')}
            >
              Concerts
            </Button>
            
            {isAuthenticated ? (
              <>
                {user?.userType === 'fan' && (
                  <Button 
                    sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                    onClick={() => navigate('/dashboard')}
                  >
                    My Tickets
                  </Button>
                )}
                {user?.userType === 'admin' && (
                  <Button 
                    sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                    onClick={() => navigate('/admin')}
                  >
                    Admin Panel
                  </Button>
                )}
                <Button 
                  sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button 
                  variant="outlined"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'white',
                    }
                  }}
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navigation; 