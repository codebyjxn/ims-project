import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Paper,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Skeleton
} from '@mui/material';
import { CalendarDays, MapPin, Ticket, Gift, LogOut, User, CreditCard, RefreshCw } from 'lucide-react';
import { api, UserTicket } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserTickets();
  }, []);

  const loadUserTickets = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await api.getUserTickets();
      console.log('Loaded tickets:', data);
      setTickets(data);
      setError(null);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserTickets();
  };

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

  const formatPurchaseDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBrowseConcerts = () => {
    navigate('/concerts');
  };

  // Helper to safely get fan details
  const getFanDetails = () => {
    if (user?.userType === 'fan' && user.fanDetails) {
      return user.fanDetails;
    }
    return null;
  };

  if (loading && !refreshing) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  const fanDetails = getFanDetails();

  return (
    <Box>
      {/* Top Navigation */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <User size={24} style={{ marginRight: 12 }} />
            <Typography variant="h6">
              {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
          <Button 
            color="inherit" 
            onClick={handleBrowseConcerts}
            sx={{ mr: 2 }}
          >
            Browse Concerts
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogOut size={20} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* User Info Card */}
        {fanDetails && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Your Account
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Username:</strong> {fanDetails.username || 'Not set'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Email:</strong> {user?.email}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Preferred Genre:</strong> {fanDetails.preferredGenre || 'Not specified'}
                  </Typography>
                  {fanDetails.phoneNumber && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Phone:</strong> {fanDetails.phoneNumber}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Gift size={20} style={{ marginRight: 8 }} />
                      <Typography variant="h6">Referral Program</Typography>
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      Your Referral Code: <strong>{fanDetails.referralCode || 'Not available'}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Referral Points: <strong>{fanDetails.referralPoints || 0}</strong>
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Share your code with friends! You earn 5 points per ticket they buy.
                      Use points for discounts: 1 point = 1% off (max 50%)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Tickets Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            My Tickets
          </Typography>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
            onClick={handleRefresh}
            disabled={refreshing}
            size="small"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        )}

        {refreshing && tickets.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {[1, 2, 3].map((index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {!refreshing && tickets.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Ticket size={64} color="#ccc" style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tickets purchased yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Browse our amazing upcoming concerts and get your tickets!
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleBrowseConcerts}
              startIcon={<CreditCard size={16} />}
            >
              Browse Concerts
            </Button>
          </Paper>
        ) : !refreshing && (
          <Grid container spacing={3}>
            {tickets.map((ticket) => (
              <Grid item xs={12} md={6} lg={4} key={ticket.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                        {ticket.concert.title}
                      </Typography>
                      <Chip 
                        label={ticket.zone.name} 
                        color="primary" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarDays size={16} style={{ marginRight: 8, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(ticket.concert.date)} at {formatTime(ticket.concert.startTime)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MapPin size={16} style={{ marginRight: 8, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {ticket.concert.arena.name}, {ticket.concert.arena.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Ticket size={16} style={{ marginRight: 8, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Purchased: {formatPurchaseDate(ticket.purchaseDate)}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        ${ticket.totalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Quick Stats */}
        {!refreshing && tickets.length > 0 && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Concert Stats
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {tickets.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Concerts Attended
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {tickets.reduce((sum, ticket) => sum + ticket.quantity, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tickets
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      ${tickets.reduce((sum, ticket) => sum + ticket.totalPrice, 0).toFixed(0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Spent
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default UserDashboard; 