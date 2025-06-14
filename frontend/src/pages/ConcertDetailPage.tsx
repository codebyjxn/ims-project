import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Card
} from '@mui/material';
import { CalendarDays, MapPin, Users, Gift, CheckCircle } from 'lucide-react';
import concertService, { Concert } from '../services/api/concert';
import referralService, { ReferralValidation } from '../services/api/referral';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import ticketService from '../services/api/ticket';

// Updated interfaces to match our API
interface TicketPurchaseData {
  concertId: string;
  zoneId: string;
  quantity: number;
  fanId: string;
  paymentMethod: string;
  referralCode?: string;
}

const ConcertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralValidation, setReferralValidation] = useState<ReferralValidation | null>(null);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const loadConcert = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await concertService.getConcertById(id);
      setConcert(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concert');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadConcert();
  }, [loadConcert]);

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

  const handlePurchaseClick = (zoneId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedZone(zoneId);
    setPurchaseDialogOpen(true);
  };

  const validateReferralCode = async () => {
    if (!referralCode.trim()) {
      setReferralValidation(null);
      return;
    }

    try {
      setValidatingReferral(true);
      const validation = await referralService.validateReferralCode(referralCode.trim());
      setReferralValidation(validation);
    } catch (err: any) {
      setReferralValidation({
        valid: false,
        message: err.response?.data?.error || err.message || 'Failed to validate referral code'
      });
    } finally {
      setValidatingReferral(false);
    }
  };

  const calculateTotalPrice = (): number => {
    if (!concert || !selectedZone) return 0;
    const zone = concert.zone_pricing?.find((z: any) => z.zone_name === selectedZone);
    if (!zone) return 0;

    const basePrice = zone.price * quantity;
    const discount = referralValidation?.valid ? (referralValidation.discount || 0) : 0;
    return basePrice * (1 - discount / 100);
  };

  const handlePurchase = async () => {
    if (!concert || !selectedZone || !id || !user) return;

    // Extract user ID from the user object - handle multiple field names
    const fanId = user.id || (user as any).userId || (user as any).user_id;
    
    const purchaseData = {
      concertId: id,
      zoneId: selectedZone,
      quantity,
      fanId: fanId,
      paymentMethod: "credit_card", // Required by the API
      referralCode: referralValidation?.valid ? referralCode.trim() : undefined
    };

    try {
      setPurchasing(true);
      setPurchaseError(null);

      // Use the shared ticketService for purchase
      const result = await ticketService.purchaseTickets(purchaseData);

      if (result && result.success && result.tickets && result.tickets.length > 0) {
        setPurchaseSuccess(true);
        // Show success message with actual data from API
        setTimeout(() => {
          setPurchaseDialogOpen(false);
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('Purchase failed');
      }
      
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDialogClose = () => {
    if (purchasing) return; // Prevent closing during purchase
    
    setPurchaseDialogOpen(false);
    setSelectedZone('');
    setQuantity(1);
    setReferralCode('');
    setReferralValidation(null);
    setPurchaseError(null);
    setPurchaseSuccess(false);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#121212' }}>
        <Navigation />
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: 'white' }} />
        </Container>
      </Box>
    );
  }

  if (error || !concert) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#121212' }}>
        <Navigation />
        <Container sx={{ mt: 4 }}>
          <Alert 
            severity="error" 
            sx={{ 
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              color: 'white',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              '& .MuiAlert-icon': { color: '#f44336' }
            }}
            action={
              <Button color="inherit" size="small" onClick={loadConcert} sx={{ color: 'white' }}>
                Retry
              </Button>
            }
          >
            {error || 'Concert not found'}
          </Alert>
        </Container>
      </Box>
    );
  }

  const selectedZoneData = concert.zone_pricing?.find((z: any) => z.zone_name === selectedZone);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        backgroundImage: 'url(https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1,
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 3 }}>
        <Navigation />
      </Box>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, pt: 4, pb: 4 }}>
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/concerts')} 
          sx={{ 
            mb: 4,
            backgroundColor: '#424242',
            color: 'white',
            px: 3,
            py: 1,
            '&:hover': {
              backgroundColor: '#616161',
            }
          }}
        >
          ← Back to Concerts
        </Button>

        {/* Concert Header */}
        <Box>
          <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
            {concert.concert_name || `Concert at ${concert.arena?.arena_name}` || 'Concert'}
          </Typography>

          <Box sx={{ 
            mt: 4, 
            p: 4, 
            color: 'white'
          }}>
            {/* Date & Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <CalendarDays size={24} style={{ color: '#4fc3f7' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#4fc3f7', fontSize: '0.75rem' }}>
                  Date & Time
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {formatDate(concert.concert_date)} at {formatTime(concert.time)}
                </Typography>
              </Box>
            </Box>

            {/* Venue */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <MapPin size={24} style={{ color: '#4fc3f7' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#4fc3f7', fontSize: '0.75rem' }}>
                  Venue
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {concert.arena?.arena_name || 'Venue TBD'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {concert.arena?.arena_location || 'Location TBD'}
                </Typography>
              </Box>
            </Box>

            {/* Capacity */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Users size={24} style={{ color: '#4fc3f7' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#4fc3f7', fontSize: '0.75rem' }}>
                  Capacity
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {(concert.arena?.total_capacity || concert.arena_capacity)?.toLocaleString() || 'N/A'} total seats
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Artists */}
          <Box sx={{ 
            mt: 4, 
            p: 4
          }}>
            <Typography variant="h5" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>
              Performing Artists
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {concert.artists && concert.artists.map((artist: any) => (
                <Chip
                  key={artist.artist_id}
                  label={`${artist.artist_name} (${artist.genre})`}
                  sx={{ 
                    backgroundColor: '#4fc3f7',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    '&:hover': {
                      backgroundColor: '#29b6f6'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Description */}
          {concert.description && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
                {concert.description}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Zone Selection */}
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mt: 4, 
            mb: 3,
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          Choose Your Zone
        </Typography>

        {concert.arena?.zones && concert.arena.zones.length > 0 ? (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            {concert.arena.zones.map((zone) => (
              <Box
                key={zone.zone_name}
                sx={{
                  p: 3,
                  mb: 2,
                  cursor: 'pointer',
                  border: selectedZone === zone.zone_name 
                    ? '2px solid #4fc3f7' 
                    : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  backgroundColor: selectedZone === zone.zone_name 
                    ? 'rgba(79, 195, 247, 0.2)' 
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: selectedZone === zone.zone_name 
                      ? 'rgba(79, 195, 247, 0.3)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => handlePurchaseClick(zone.zone_name)}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                    {zone.zone_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Available: {zone.availableTickets?.toLocaleString()} seats
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ color: '#4fc3f7', fontWeight: 'bold' }}>
                    ${zone.price}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      mt: 1,
                      backgroundColor: '#4fc3f7',
                      '&:hover': {
                        backgroundColor: '#29b6f6'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchaseClick(zone.zone_name);
                    }}
                  >
                    Buy Tickets
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '& .MuiAlert-icon': {
                color: 'white'
              }
            }}
          >
            Zone information is not yet available for this concert. Please check back later.
          </Alert>
        )}
      </Container>

      {/* Enhanced Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            🎫 Purchase Tickets - {selectedZoneData?.zone_name}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {purchaseSuccess ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle size={64} color="#4caf50" style={{ marginBottom: 16 }} />
              <Typography variant="h5" color="success.main" gutterBottom>
                🎉 Purchase Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your tickets have been purchased successfully. You'll be redirected to your dashboard shortly.
              </Typography>
            </Box>
          ) : (
            <>
              {purchaseError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {purchaseError}
                </Alert>
              )}
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Number of Tickets</InputLabel>
                    <Select
                      value={quantity}
                      label="Number of Tickets"
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      disabled={purchasing}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <MenuItem key={num} value={num}>
                          {num} ticket{num > 1 ? 's' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Referral Code (Optional)"
                    variant="outlined"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value);
                      setReferralValidation(null); // Reset validation on change
                    }}
                    onBlur={validateReferralCode} // Validate on blur
                    sx={{ mt: 2 }}
                    InputProps={{
                      endAdornment: validatingReferral ? <CircularProgress size={20} /> : null
                    }}
                  />
                  {referralValidation && (
                    <Box 
                      sx={{ 
                        mt: 1, 
                        p: 1.5, 
                        borderRadius: 1, 
                        backgroundColor: referralValidation.valid ? 'success.light' : 'error.light',
                        color: referralValidation.valid ? 'success.dark' : 'error.dark',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ mr: 1, visibility: referralValidation.valid ? 'visible' : 'hidden', display: 'flex' }}>
                        <CheckCircle />
                      </Box>
                      <Typography variant="body2">
                        {referralValidation.valid
                          ? `Success! ${referralValidation.discount}% discount applied from ${referralValidation.referrer?.name}.`
                          : referralValidation.message || referralValidation.error}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                  <Box sx={{ mt: 2, p: 3, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#333', mb: 2 }}>
                      📋 Order Summary
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Zone:</Typography>
                      <Typography fontWeight="bold">{selectedZoneData?.zone_name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Quantity:</Typography>
                      <Typography fontWeight="bold">{quantity} ticket{quantity > 1 ? 's' : ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Price per ticket:</Typography>
                      <Typography fontWeight="bold">${selectedZoneData?.price}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Subtotal:</Typography>
                      <Typography fontWeight="bold">${((selectedZoneData?.price || 0) * quantity).toFixed(2)}</Typography>
                    </Box>
                    {referralValidation?.valid && referralValidation.discount && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="success.main">Referral Discount ({referralValidation.discount}%):</Typography>
                        <Typography color="success.main" fontWeight="bold">
                          -${(((selectedZoneData?.price || 0) * quantity) * (referralValidation.discount / 100)).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ color: '#333' }}>Total Amount:</Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        ${calculateTotalPrice().toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        {!purchaseSuccess && (
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleDialogClose} disabled={purchasing}>
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase} 
              variant="contained"
              disabled={purchasing || !selectedZone}
              sx={{
                backgroundColor: '#4fc3f7',
                '&:hover': {
                  backgroundColor: '#29b6f6'
                },
                px: 3
              }}
            >
              {purchasing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Processing...
                </>
              ) : (
                `Confirm Purchase - $${calculateTotalPrice().toFixed(2)}`
              )}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default ConcertDetailPage; 