import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { Event as CalendarIcon, LocationOn as LocationOnIcon, People as PeopleIcon } from '@mui/icons-material';
import organizerService, { OrganizerConcert, OrganizerStats } from '../services/api/organizer';
import { useAuth } from '../context/AuthContext';
import ConcertCreationWizard from '../components/ConcertCreationWizard';
import Navigation from '../components/Navigation';

const OrganizerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [concerts, setConcerts] = useState<OrganizerConcert[]>([]);
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createConcertOpen, setCreateConcertOpen] = useState(false);

  useEffect(() => {
    loadOrganizerData();
  }, []);

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      
      const [concertsData, statsData] = await Promise.all([
        fetchWithErrorHandling(() => organizerService.getOrganizerConcerts(user?.id)),
        fetchWithErrorHandling(() => organizerService.getOrganizerStats(user?.id))
      ]);
      
      setConcerts(concertsData || []);
      setStats(statsData || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithErrorHandling = async (apiCall: () => Promise<any>) => {
    try {
      return await apiCall();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Unexpected token')) {
        throw new Error('API returned invalid JSON. Please check backend endpoints.');
      }
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    
    let date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else if (dateString.includes('-')) {
      date = new Date(dateString + 'T00:00:00');
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'ongoing': return 'success';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const handleCreateConcert = () => {
    setCreateConcertOpen(true);
  };

  const handleConcertCreated = () => {
    setCreateConcertOpen(false);
    loadOrganizerData();
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navigation />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Organizer Portal
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Welcome back, {user?.firstName} {user?.lastName}
          </Typography>
          {user?.organizerDetails && (
            <Typography variant="body1" color="text.secondary">
              {user.organizerDetails.organizationName}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} action={
            <Button color="inherit" size="small" onClick={loadOrganizerData}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        )}


        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {stats.totalConcerts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Concerts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {stats.upcomingConcerts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Events
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                    {stats.totalTicketsSold}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tickets Sold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565c0' }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 6,
          mt: 2
        }}>
          <Button
            variant="contained"
            onClick={handleCreateConcert}
            size="large"
            sx={{ 
              borderRadius: 3,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                boxShadow: '0 6px 25px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            🎵 Create New Concert
          </Button>
        </Box>

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          Your Concerts
        </Typography>

        {concerts.length === 0 ? (
          <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No concerts yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first concert to get started
              </Typography>
              <Button
                variant="contained"
                onClick={handleCreateConcert}
                size="large"
                sx={{ 
                  borderRadius: 3,
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                    boxShadow: '0 6px 25px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                🎵 Create Your First Concert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {concerts.map((concert) => (
              <Grid item xs={12} md={6} lg={4} key={concert.concert_id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    boxShadow: 1,
                    '&:hover': { boxShadow: 3 },
                    transition: 'box-shadow 0.3s ease'
                  }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ flexGrow: 1, fontWeight: 600 }}>
                          {concert.description}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ fontSize: '1.1rem', mr: 1, color: 'text.secondary' }} /> {formatDate(concert.date)} at {formatTime(concert.time)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <LocationOnIcon sx={{ fontSize: '1.1rem', mr: 1, color: 'text.secondary' }} /> {concert.arena.name}, {concert.arena.location}
                      </Typography>

                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Zone Pricing:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {(concert.zone_pricing || []).map((zone, index) => (
                            <Chip
                              key={index}
                              label={`${zone.zone_name}: ${formatCurrency(zone.price)}`}
                              size="small"
                              variant="outlined"
                              sx={{ backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9' }}
                            />
                          ))}
                        </Box>
                      </Box>

                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Artists:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {concert.artists.map((artist, index) => (
                            <Chip
                              key={index}
                              label={artist.artist_name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ fontSize: '1.1rem', mr: 1, color: 'text.secondary' }} /> {concert.ticketsSold} / {concert.arena.capacity} tickets sold
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Revenue: {formatCurrency(concert.totalRevenue)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
          <Button
            variant="contained"
            onClick={handleCreateConcert}
            sx={{ 
              borderRadius: '50px',
              minWidth: 'auto',
              width: 64,
              height: 64,
              fontSize: '28px',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                boxShadow: '0 8px 25px rgba(25, 118, 210, 0.5)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            +
          </Button>
        </Box>
      </Container>

      {/* Concert Creation Wizard */}
      <ConcertCreationWizard 
        onSuccess={handleConcertCreated} 
        open={createConcertOpen} 
        onClose={() => setCreateConcertOpen(false)} 
      />
    </Box>
  );
};

export default OrganizerDashboard; 