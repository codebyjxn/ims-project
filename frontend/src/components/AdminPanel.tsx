import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  RefreshCw, 
  BarChart3, 
  ArrowRightLeft,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  User,
  Ticket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/api/admin';
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  IconButton,
  Chip,
  Grid,
  Paper,
} from '@mui/material';

interface HealthStatus {
  status: string;
  services?: Record<string, string>;
  timestamp?: string;
}

const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'warning' | 'checking'>('checking');
  const [loading, setLoading] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await adminService.getHealth();
      setApiStatus('online');

      // Support both the public /health shape (with services.postgres) and
      // the admin /health shape (with postgres.connected)
      let pgConnected = false;
      let mongoConnected = false;

      if ((response as any).services) {
        // Public health endpoint shape
        const services = (response as any).services;
        pgConnected = services.postgres === 'connected';
        mongoConnected = services.mongodb === 'connected';
      } else if ((response as any).postgres && (response as any).mongodb) {
        // Admin health endpoint shape
        pgConnected = (response as any).postgres.connected;
        mongoConnected = (response as any).mongodb.connected;
      }

      if (pgConnected && mongoConnected) {
        setDbStatus('online');
      } else if (pgConnected || mongoConnected) {
        setDbStatus('warning');
      } else {
        setDbStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
      setDbStatus('offline');
    }
  };

  const seedDatabase = async () => {
    setLoading('seed');
    try {
      await adminService.seedDatabase();
      alert('Database seeded successfully!');
    } catch (error: any) {
      alert(`Seeding failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const migrateToNoSQL = async () => {
    setLoading('migrate');
    try {
      await adminService.migrateToNoSQL();
      alert('Migration completed successfully!');
    } catch (error: any) {
      alert(`Migration failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { size: 20 };
    switch (status) {
      case 'online': return <CheckCircle {...iconProps} style={{ color: '#22c55e' }} />;
      case 'offline': return <XCircle {...iconProps} style={{ color: '#ef4444' }} />;
      case 'warning': return <AlertCircle {...iconProps} style={{ color: '#f97316' }} />;
      default: return <RefreshCw {...iconProps} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'offline': return '#ef4444';
      case 'warning': return '#f97316';
      default: return '#3b82f6';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: '#f0f4f8', 
      color: '#334155' 
    }}>
      <Paper sx={{ 
        backgroundColor: '#f0f4f8', 
        padding: '1rem 2rem', 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
        zIndex: 10,
        borderRadius: 0
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          maxWidth: '1400px', 
          margin: '0 auto' 
        }}>
          <Box>
            <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: '#1e293b' }}>
              System Management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: '#334155' }}>
              <User size={18} />
              <Typography>{user?.email}</Typography>
            </Box>
            <Button 
              onClick={logout} 
              startIcon={<LogOut size={18} />}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: 500,
                '&:hover': { backgroundColor: '#2563eb' }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          gap: '2rem', 
          alignItems: 'center', 
          maxWidth: '1400px', 
          margin: '1rem auto 0', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e2e8f0' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: '#334155' }}>
            {getStatusIcon(apiStatus)}
            <Typography>API Status: {apiStatus}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: '#334155' }}>
            {getStatusIcon(dbStatus)}
            <Typography>Database Status: {dbStatus}</Typography>
          </Box>
          <IconButton 
            onClick={checkSystemStatus} 
            disabled={loading === 'health'}
            sx={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '50%', 
              padding: '0.5rem' 
            }}
          >
            <RefreshCw size={16} style={{ 
              animation: loading === 'health' ? 'spin 1s linear infinite' : 'none' 
            }} />
          </IconButton>
        </Box>
      </Paper>
      
      <Box sx={{ flexGrow: 1, padding: '2rem', overflowY: 'auto' }}>
        <Grid container spacing={4} sx={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Database Actions Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              backgroundColor: '#f0f4f8', 
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}>
              <CardHeader 
                avatar={<Database size={24} style={{ color: '#3b82f6' }} />}
                title={
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                    Database Actions
                  </Typography>
                }
                sx={{ 
                  padding: '1.5rem', 
                  borderBottom: '1px solid #e2e8f0' 
                }}
              />
              <CardContent sx={{ padding: '1.5rem', flexGrow: 1 }}>
                <Typography sx={{ color: '#334155' }}>
                  Use these actions to manage the database state.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <Button 
                    onClick={seedDatabase}
                    disabled={loading === 'seed'}
                    variant="contained"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#2563eb' },
                      '&:disabled': { opacity: 0.7 }
                    }}
                  >
                    {loading === 'seed' ? 'Seeding...' : 'Seed Database'}
                  </Button>
                  <Button 
                    onClick={migrateToNoSQL}
                    disabled={loading === 'migrate'}
                    variant="contained"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#2563eb' },
                      '&:disabled': { opacity: 0.7 }
                    }}
                  >
                    {loading === 'migrate' ? 'Migrating...' : 'Migrate to NoSQL'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Analytics Report Navigation */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              backgroundColor: '#f0f4f8', 
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%'
            }}>
              <CardHeader 
                avatar={<BarChart3 size={24} style={{ color: '#3b82f6' }} />}
                title={
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                    Analytics
                  </Typography>
                }
                sx={{ 
                  padding: '1.5rem', 
                  borderBottom: '1px solid #e2e8f0' 
                }}
              />
              <CardContent sx={{ padding: '1.5rem', flexGrow: 1 }}>
                <Typography sx={{ color: '#334155' }}>
                  View detailed reports on concert performance and organizer analytics.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <Button 
                  onClick={() => navigate('/admin/analytics')}
                    variant="contained"
                    endIcon={<ArrowRightLeft size={18} />}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#2563eb' }
                    }}
                >
                  Concert Analytics Report
                  </Button>
                  <Button 
                  onClick={() => navigate('/admin/organizers-analytics')}
                    variant="contained"
                    endIcon={<BarChart3 size={18} />}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: '#2563eb' }
                    }}
                >
                  Organizers Analytics Report
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminPanel; 