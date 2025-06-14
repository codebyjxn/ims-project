import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import organizerService, { Arena, Artist, ConcertCreationData } from '../services/api/organizer';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizerId?: string;
}

interface ZoneConfiguration {
  zone_name: string;
  capacity_per_zone: number;
  price: number;
  priceInput?: string; 
}

const steps = [
  'Concert Details',
  'Arena Selection',
  'Zone Configuration',
  'Artist Selection',
  'Review & Confirm'
];

export const ConcertCreationWizard: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  organizerId,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [zoneConfigurations, setZoneConfigurations] = useState<ZoneConfiguration[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [arenasData, artistsData] = await Promise.all([
        organizerService.getArenas(),
        organizerService.getArtists(),
      ]);
      setArenas(arenasData);
      setArtists(artistsData);
    } catch (error) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setSelectedArena(null);
    setZoneConfigurations([]);
    setSelectedArtists([]);
    setError(null);
  };

  const handleArenaSelect = (arena: Arena) => {
    setSelectedArena(arena);
    setZoneConfigurations(
      arena.zones.map(zone => ({
        zone_name: zone.zone_name,
        capacity_per_zone: zone.capacity_per_zone,
        price: 0,
        priceInput: '',
      }))
    );
  };

  const updateZonePrice = (zoneName: string, inputValue: string) => {
    const numericValue = inputValue === '' ? 0 : parseFloat(inputValue) || 0;
    setZoneConfigurations(prev =>
      prev.map(zone =>
        zone.zone_name === zoneName 
          ? { ...zone, price: numericValue, priceInput: inputValue } 
          : zone
      )
    );
  };

  const handleArtistToggle = (artistId: string) => {
    setSelectedArtists(prev => {
      if (prev.includes(artistId)) {
        return prev.filter(id => id !== artistId);
      } else {
        return [...prev, artistId];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const concertData: ConcertCreationData = {
        ...(organizerId && { organizerId }), 
        title,
        description,
        date,
        time,
        arenaId: selectedArena?.arena_id || '',
        zones: zoneConfigurations,
        artists: selectedArtists,
      };

      await organizerService.createConcert(concertData);
      onSuccess();
      handleReset();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create concert');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return title && description && date && time;
      case 1:
        return selectedArena;
      case 2:
        return zoneConfigurations.every(zone => zone.price > 0);
      case 3:
        return selectedArtists.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Concert Title"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Concert Date"
                  type="date"
                  value={date}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={time}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select an Arena
            </Typography>
            <Grid container spacing={2}>
              {arenas.map((arena) => (
                <Grid item xs={12} md={6} key={arena.arena_id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedArena?.arena_id === arena.arena_id ? 2 : 1,
                      borderColor: selectedArena?.arena_id === arena.arena_id ? 'primary.main' : 'divider',
                      borderRadius: 2,
                    }}
                    onClick={() => handleArenaSelect(arena)}
                  >
                    <CardContent>
                      <Typography variant="h6">{arena.arena_name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        📍 {arena.arena_location}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        👥 Capacity: {arena.total_capacity.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {arena.zones.length} zones available
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configure Zone Pricing
            </Typography>
            {selectedArena && (
              <Grid container spacing={2}>
                {zoneConfigurations.map((zone) => (
                  <Grid item xs={12} md={6} key={zone.zone_name}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6">{zone.zone_name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Capacity: {zone.capacity_per_zone} seats
                        </Typography>
                        <TextField
                          fullWidth
                          label="Price per Ticket ($)"
                          type="number"
                          value={zone.priceInput !== undefined ? zone.priceInput : (zone.price === 0 ? '' : zone.price.toString())}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => updateZonePrice(zone.zone_name, e.target.value)}
                          placeholder="Enter price"
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Artists
            </Typography>
            <Grid container spacing={2}>
              {artists.map((artist) => (
                <Grid item xs={12} md={6} key={artist.artist_id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedArtists.includes(artist.artist_id) ? 2 : 1,
                      borderColor: selectedArtists.includes(artist.artist_id) ? 'primary.main' : 'divider',
                      borderRadius: 2,
                    }}
                    onClick={() => handleArtistToggle(artist.artist_id)}
                  >
                    <CardContent>
                      <Typography variant="h6">{artist.artist_name}</Typography>
                      <Chip label={artist.genre} size="small" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Concert Details
            </Typography>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5">{title}</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {description}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      📅 {date} at {time}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      📍 {selectedArena?.arena_name}, {selectedArena?.arena_location}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      Zone Pricing
                    </Typography>
                    {zoneConfigurations.map((zone) => (
                      <Box key={zone.zone_name} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography>{zone.zone_name}</Typography>
                        <Typography>${zone.price}</Typography>
                      </Box>
                    ))}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      Artists
                    </Typography>
                    {selectedArtists.map((artistId) => {
                      const artist = artists.find(a => a.artist_id === artistId);
                      return (
                        <Chip
                          key={artistId}
                          label={artist?.artist_name}
                          sx={{ mr: 1, mt: 1 }}
                        />
                      );
                    })}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Create New Concert
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!loading && renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isStepValid() || loading}
          >
            Create Concert
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!isStepValid()}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConcertCreationWizard;