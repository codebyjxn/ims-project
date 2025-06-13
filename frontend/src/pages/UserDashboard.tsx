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
  const [totalSpent, setTotalSpent] = useState(0);
  const [attendedConcertsCount, setAttendedConcertsCount] = useState(0);

  useEffect(() => {
    loadUserTickets();
  }, []);

  useEffect(() => {
    if (tickets.length > 0) {
      const total = tickets.reduce((acc, ticket) => acc + (ticket.totalPrice || 0), 0);
      setTotalSpent(total);
      console.log(tickets);
      const uniqueConcertIds = new Set(tickets.map(ticket => ticket.concert.id));
      setAttendedConcertsCount(uniqueConcertIds.size);
    }
  }, [tickets]);

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
    <Box sx={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'white', 
          color: '#333',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <User size={24} style={{ marginRight: 12, color: '#666' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
          <Button 
            variant="outlined"
            onClick={handleBrowseConcerts}
            sx={{ mr: 2, borderColor: '#ccc', color: '#555', '&:hover': { backgroundColor: '#f0f0f0', borderColor: '#bbb' } }}
          >
            Browse Concerts
          </Button>
          <IconButton onClick={handleLogout} sx={{ color: '#555' }}>
            <LogOut size={20} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* User Info Card */}
        {fanDetails && (
          <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#e9f5ff', 
                      color: '#0d47a1', 
                      borderRadius: 2,
                      border: '1px solid #b3e5fc'
                    }}
                  >
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
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
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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
          <Grid container spacing={4}>
            {tickets.map((ticket) => (
              <Grid item xs={12} md={6} key={ticket.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {ticket.concert.title}
                      </Typography>
                      <Chip 
                        label={ticket.zone.name} 
                        color="primary" 
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {ticket.concert.arena.name}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarDays size={18} style={{ marginRight: 10, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(ticket.concert.date)} at {formatTime(ticket.concert.startTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MapPin size={18} style={{ marginRight: 10, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {ticket.concert.arena.location}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardContent>
                    <Grid container justifyContent="space-between" alignItems="center">
                      <Grid item>
                      <Typography variant="body2" color="text.secondary">
                        Purchased: {formatPurchaseDate(ticket.purchaseDate)}
                      </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ticket ID: {ticket.id}
                      </Typography>
                      </Grid>
                      <Grid item>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ textTransform: 'none' }}
                        >
                          View Ticket
                        </Button>
                      </Grid>
                    </Grid>
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
                      {attendedConcertsCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Concerts Attended
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {tickets.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tickets
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      ${totalSpent.toFixed(2)}
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