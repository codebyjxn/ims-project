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

// Dummy data for demonstration
const dummyArenas = [
  {
    id: 1,
    name: "Main Arena",
    zones: [
      { id: "A", name: "Zone A", attendees: 120, capacity: 200, entryCount: 125, exitCount: 5 },
      { id: "B", name: "Zone B", attendees: 80, capacity: 150, entryCount: 85, exitCount: 5 },
      { id: "C", name: "Zone C", attendees: 200, capacity: 200, entryCount: 205, exitCount: 5 },
    ],
  },
  {
    id: 2,
    name: "Outdoor Arena",
    zones: [
      { id: "X", name: "Zone X", attendees: 40, capacity: 100, entryCount: 42, exitCount: 2 },
      { id: "Y", name: "Zone Y", attendees: 60, capacity: 90, entryCount: 65, exitCount: 5 },
      { id: "Z", name: "Zone Z", attendees: 0, capacity: 75, entryCount: 0, exitCount: 0 },
    ],
  },
  {
    id: 3,
    name: "Indoor Stadium",
    zones: [
      { id: "VIP", name: "VIP Section", attendees: 25, capacity: 50, entryCount: 30, exitCount: 5 },
      { id: "GEN", name: "General Admission", attendees: 300, capacity: 400, entryCount: 315, exitCount: 15 },
    ],
  },
];

interface Arena {
  id: number;
  name: string;
  zones: Zone[];
  nzones?: number;
}

interface Zone {
  id: string;
  name: string;
  attendees: number;
  capacity: number;
  entryCount: number;
  exitCount: number;
}

const OrganizerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call with dummy data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Add nzones property to each arena
      const enrichedArenas = dummyArenas.map(arena => ({
        ...arena,
        nzones: arena.zones.length
      }));
      
      setArenas(enrichedArenas);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleArenaSelect = (arenaId: number) => {
    const arena = arenas.find(a => a.id === arenaId);
    setSelectedArena(arena || null);
    setSelectedZone(null); // Reset zone selection
  };

  const handleZoneSelect = (zoneId: string) => {
    if (!selectedArena) return;
    const zone = selectedArena.zones.find(z => z.id === zoneId);
    setSelectedZone(zone || null);
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
    
    const totalCapacity = selectedArena.zones.reduce((sum, zone) => sum + zone.capacity, 0);
    const totalAttendees = selectedArena.zones.reduce((sum, zone) => sum + zone.attendees, 0);
    const occupiedZones = selectedArena.zones.filter(zone => zone.attendees > 0).length;
    
    return {
      totalCapacity,
      totalAttendees,
      occupiedZones,
      totalZones: selectedArena.zones.length,
      occupancyRate: Math.round((totalAttendees / totalCapacity) * 100)
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
                    value={selectedArena?.id || ''}
                    onChange={(e) => handleArenaSelect(Number(e.target.value))}
                    label="Arena"
                  >
                    {arenas.map((arena) => (
                      <MenuItem key={arena.id} value={arena.id}>
                        {arena.name} ({arena.nzones} zones)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!selectedArena}>
                  <InputLabel>Zone (Optional)</InputLabel>
                  <Select
                    value={selectedZone?.id || ''}
                    onChange={(e) => handleZoneSelect(e.target.value)}
                    label="Zone (Optional)"
                  >
                    <MenuItem value="">All Zones</MenuItem>
                    {selectedArena?.zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.name} ({zone.attendees}/{zone.capacity})
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
                    {totalStats.totalAttendees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Attendees
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
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
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                    {totalStats.occupiedZones}/{totalStats.totalZones}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Occupied Zones
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565c0' }}>
                    {totalStats.occupancyRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Occupancy
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
                {selectedZone ? `Zone Details: ${selectedZone.name}` : `${selectedArena.name} - All Zones`}
              </Typography>

              {selectedZone ? (
                /* Single Zone View */
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Occupancy</Typography>
                        <Typography variant="body2">
                          {selectedZone.attendees}/{selectedZone.capacity} 
                          ({calculateOccupancyPercentage(selectedZone.attendees, selectedZone.capacity)}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateOccupancyPercentage(selectedZone.attendees, selectedZone.capacity)}
                        color={getOccupancyColor(calculateOccupancyPercentage(selectedZone.attendees, selectedZone.capacity))}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Entry Count</Typography>
                        <Typography variant="h6">{selectedZone.entryCount}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Exit Count</Typography>
                        <Typography variant="h6">{selectedZone.exitCount}</Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Live Status
                    </Typography>
                    <Chip 
                      label={selectedZone.attendees === 0 ? 'Empty' : 
                             selectedZone.attendees >= selectedZone.capacity ? 'Full' : 'Active'}
                      color={selectedZone.attendees === 0 ? 'default' : 
                             selectedZone.attendees >= selectedZone.capacity ? 'error' : 'success'}
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Capacity Utilization
                    </Typography>
                    <Typography variant="body1">
                      {calculateOccupancyPercentage(selectedZone.attendees, selectedZone.capacity)}% 
                      {selectedZone.attendees >= selectedZone.capacity * 0.9 && ' (Near Capacity)'}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                /* All Zones View */
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {selectedArena.zones.map((zone) => {
                    const occupancyPercentage = calculateOccupancyPercentage(zone.attendees, zone.capacity);
                    return (
                      <Grid item xs={12} md={6} lg={4} key={zone.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                          }}
                          onClick={() => handleZoneSelect(zone.id)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {zone.name}
                              </Typography>
                              <Chip 
                                label={zone.attendees === 0 ? 'Empty' : 
                                       zone.attendees >= zone.capacity ? 'Full' : 'Active'}
                                color={zone.attendees === 0 ? 'default' : 
                                       zone.attendees >= zone.capacity ? 'error' : 'success'}
                                size="small"
                              />
                            </Box>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Occupancy: {zone.attendees}/{zone.capacity} ({occupancyPercentage}%)
                            </Typography>
                            
                            <LinearProgress 
                              variant="determinate" 
                              value={occupancyPercentage}
                              color={getOccupancyColor(occupancyPercentage)}
                              sx={{ height: 6, borderRadius: 3, mb: 2 }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" color="text.secondary">
                                Entries: {zone.entryCount}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Exits: {zone.exitCount}
                              </Typography>
                            </Box>
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

        {/* Placeholder for Future Features */}
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