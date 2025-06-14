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
import { CalendarDays, MapPin, Ticket, Gift, LogOut, User, CreditCard, RefreshCw, Download } from 'lucide-react';
import ticketService, { UserTicket } from '../services/api/ticket';
import { useAuth } from '../context/AuthContext';
import { downloadTicketPDF } from '../utils/pdfGenerator';

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
      const data = await ticketService.getUserTickets();
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
              Your purchased tickets will appear here.
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleBrowseConcerts}
            >
              Browse Concerts
            </Button>
          </Paper>
        ) : !refreshing && (
          <Grid container spacing={3}>
            {tickets.map((ticket) => (
              <Grid item xs={12} md={6} key={ticket.ticket_id}>
                <Card 
                  sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {ticket.concert_name || `Concert @ ${ticket.arena_name}`}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                      <CalendarDays size={16} style={{ marginRight: 8 }} />
                      <Typography variant="body2">
                        {ticket.concert_date ? `${formatDate(ticket.concert_date)} at ${formatTime(ticket.concert_time)}` : 'Date/Time TBD'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
                      <MapPin size={16} style={{ marginRight: 8 }} />
                      <Typography variant="body2">{ticket.arena_location || 'Location TBD'}</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Zone: <Chip label={ticket.zone_name} size="small" /></Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>Price: ${Number(ticket.purchase_price || 0).toFixed(2)}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Purchased: {formatPurchaseDate(ticket.purchase_date)}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardContent sx={{ pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<Download size={16}/>}
                      onClick={() => downloadTicketPDF(ticket)}
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default UserDashboard; 