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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import organizerService, { Arena } from '../services/api/organizer';

interface ZoneAnalytics {
  zone_name: string;
  capacity_per_zone: number;
  tickets_sold: number;
  revenue: number;
}

interface ArenaAnalytics {
  arena_id: string;
  arena_name: string;
  arena_location: string;
  total_capacity: number;
  zones: ZoneAnalytics[];
}

const OrganizerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedArena, setSelectedArena] = useState<ArenaAnalytics | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneAnalytics | null>(null);
  const [arenas, setArenas] = useState<ArenaAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const analyticsData = await organizerService.getArenasAnalytics();
      setArenas(analyticsData);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleArenaSelect = (arenaId: string) => {
    const arena = arenas.find(a => a.arena_id === arenaId);
    setSelectedArena(arena || null);
    setSelectedZone(null); 
  };

  const handleZoneSelect = (zoneName: string) => {
    if (!selectedArena) return;
    const zone = selectedArena.zones.find(z => z.zone_name === zoneName);
    setSelectedZone(zone ? {
      zone_name: zone.zone_name,
      capacity_per_zone: zone.capacity_per_zone,
      tickets_sold: zone.tickets_sold,
      revenue: zone.revenue,
    } : null);
  };

  const calculateOccupancyPercentage = (attendees: number, capacity: number) => {
    return Math.round((attendees / capacity) * 100);
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
  };

  const getTotalStats = () => {
    if (!selectedArena) return null;
    const totalCapacity = selectedArena.zones.reduce((sum, zone) => sum + zone.capacity_per_zone, 0);

    return {
      totalCapacity,
      totalZones: selectedArena.zones.length,
    };
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  const totalStats = getTotalStats();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navigation />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button 
            onClick={() => navigate('/organizers')} 
            sx={{ mb: 2, textTransform: 'none' }}
          >
            ← Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Arena and Zone Analytics for {user?.organizerDetails?.organizationName}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Selection Controls */}
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Select Arena and Zone
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Arena</InputLabel>
                  <Select
                    value={selectedArena?.arena_id || ''}
                    onChange={(e) => handleArenaSelect(e.target.value)}
                    label="Arena"
                  >
                    {arenas.map((arena) => (
                      <MenuItem key={arena.arena_id} value={arena.arena_id}>
                        {arena.arena_name} ({arena.zones.length} zones)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!selectedArena}>
                  <InputLabel>Zone (Optional)</InputLabel>
                  <Select
                    value={selectedZone?.zone_name || ''}
                    onChange={(e) => handleZoneSelect(e.target.value)}
                    label="Zone (Optional)"
                  >
                    <MenuItem value="">All Zones</MenuItem>
                    {selectedArena?.zones.map((zone) => (
                      <MenuItem key={zone.zone_name} value={zone.zone_name}>
                        {zone.zone_name} ({zone.capacity_per_zone})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Arena Overview Stats */}
        {selectedArena && totalStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {totalStats.totalCapacity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Capacity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {totalStats.totalZones}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Zones
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Zone Details */}
        {selectedArena && (
          <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {selectedZone ? `Zone Details: ${selectedZone.zone_name}` : `${selectedArena.arena_name} - All Zones`}
              </Typography>

              {selectedZone ? (

<Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Zone: {selectedZone.zone_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Capacity: {selectedZone.capacity_per_zone}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {selectedArena.zones.map((zone) => {
                    return (
                      <Grid item xs={12} md={6} lg={4} key={zone.zone_name}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                          onClick={() => handleZoneSelect(zone.zone_name)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {zone.zone_name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Capacity: {zone.capacity_per_zone}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        )}


        {selectedArena && (
          <Card sx={{ mt: 4, borderRadius: 2, boxShadow: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Future Analytics Features
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Coming soon to enhance your organizer experience:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="Historical Trends" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Real-time Monitoring" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Predictive Analytics" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Export Reports" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                <Chip label="Alert System" variant="outlined" sx={{ mr: 1, mb: 1 }} />
              </Box>
            </CardContent>
          </Card>
        )}

        {!selectedArena && (
          <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select an Arena to View Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose an arena from the dropdown above to view detailed zone analytics and occupancy data.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default OrganizerAnalytics; 