import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { api, Concert } from '../services/api';
import Navigation from '../components/Navigation';

const ConcertsPage: React.FC = () => {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadConcerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getUpcomingConcerts();
      setConcerts(response);
    } catch (err) {
      setError('Failed to load concerts. Please try again.');
      console.error('Error loading concerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConcerts();
  }, [loadConcerts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const handleViewConcert = (concertId: string) => {
    navigate(`/concerts/${concertId}`);
  };

  const getCardBackground = () => {
    return `url(https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80)`;
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadConcerts}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#121212' }}>
      <Navigation />
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white' }}>
          Upcoming Concerts
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Discover amazing live music experiences
        </Typography>
      </Box>

      {/* Concerts Grid */}
      {concerts && concerts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            No upcoming concerts at the moment. Please check back soon!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {concerts.map((concert) => (
            <Grid item xs={12} md={6} lg={6} key={concert.concert_id}>
              <Card 
                sx={{ 
                  height: 650, 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  borderRadius: 3,
                  overflow: 'hidden',
                  backgroundImage: getCardBackground(),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.95) 100%)',
                    zIndex: 1,
                  }
                }}
                onClick={() => handleViewConcert(concert.concert_id)}
              >
                {/* Content Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '60%',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    p: 3,
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* Concert Title */}
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      mb: 2
                    }}
                  >
                    {concert.concert_name || `Concert at ${concert.arena?.arena_name}` || 'Concert'}
                  </Typography>

                  {/* Details Container */}
                  <Box
                    sx={{
                      mb: 2,
                    }}
                  >
                    {/* Date and Time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <CalendarDays size={16} style={{ marginRight: 8, color: '#4fc3f7' }} />
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                        {formatDate(concert.concert_date)} at {formatTime(concert.time)}
                      </Typography>
                    </Box>

                    {/* Location */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <MapPin size={16} style={{ marginRight: 8, color: '#4fc3f7' }} />
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                        {concert.arena?.arena_name || 'Venue TBD'}, {concert.arena?.arena_location || 'Location TBD'}
                      </Typography>
                    </Box>

                    {/* Capacity */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Users size={16} style={{ marginRight: 8, color: '#4fc3f7' }} />
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                        Capacity: {(concert.arena?.total_capacity || concert.arena_capacity)?.toLocaleString() || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Artists */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#4fc3f7', fontWeight: 'bold', mb: 1 }}>
                        Artists:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {concert.artists.map((artist) => (
                          <Chip
                            key={artist.artist_id}
                            label={`${artist.artist_name} (${artist.genre})`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(79, 195, 247, 0.3)',
                              color: 'white',
                              fontSize: '0.75rem',
                              height: '24px',
                              border: '1px solid rgba(79, 195, 247, 0.5)',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Price Range */}
                    {concert.zone_pricing && concert.zone_pricing.length > 0 ? (
                      <Typography variant="body1" sx={{ color: '#ffb74d', fontWeight: 'bold', textAlign: 'center' }}>
                        From ${Math.min(...concert.zone_pricing.map(z => z.price))} - ${Math.max(...concert.zone_pricing.map(z => z.price))}
                      </Typography>
                    ) : (
                      <Typography variant="body1" sx={{ color: '#ffb74d', fontWeight: 'bold', textAlign: 'center' }}>
                        Pricing TBA
                      </Typography>
                    )}
                  </Box>

                  {/* Action Button */}
                  <Box sx={{ mt: 2, px: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        backgroundColor: '#424242',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontWeight: 'bold',
                        py: 1.2,
                        borderRadius: 0,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        '&:hover': {
                          backgroundColor: '#616161',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewConcert(concert.concert_id);
                      }}
                    >
                      View Details & Buy Tickets
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
                </Grid>
      )}
    </Container>
    </Box>
  );
};

export default ConcertsPage; 