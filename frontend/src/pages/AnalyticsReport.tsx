import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { UpcomingConcertPerformance } from '../services/api/admin';
import { BarChart3, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';

const ROWS_PER_PAGE = 10;

const AnalyticsReport: React.FC = () => {
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState<UpcomingConcertPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUpcomingConcertsPerformance();
      setPerformanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const totalPages = Math.ceil(performanceData.length / ROWS_PER_PAGE);
  const paginatedData = performanceData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <Box sx={{ 
      padding: '2rem', 
      backgroundColor: '#f0f4f8', 
      minHeight: '100vh' 
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          color: '#1e293b' 
        }}>
          <BarChart3 size={32} />
          <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 700 }}>
            Upcoming Concerts Performance
          </Typography>
        </Box>
        <Button 
          onClick={() => navigate('/admin')}
          startIcon={<ArrowLeft size={16} />}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#f8fafc',
              borderColor: '#cbd5e1',
            }
          }}
        >
          Back to Admin
        </Button>
      </Box>

      <Card sx={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', 
        overflow: 'hidden' 
      }}>
        <CardHeader 
          title={
            <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
              Performance Report
            </Typography>
          }
          action={
            <Button 
              onClick={fetchPerformanceData} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: '#f1f5f9' },
                '&:disabled': { opacity: 0.7, cursor: 'not-allowed' }
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          }
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid #e2e8f0' 
          }}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: '#64748b',
                  padding: '1rem 1.5rem'
                }}>
                  Concert
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: '#64748b',
                  padding: '1rem 1.5rem'
                }}>
                  Date
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: '#64748b',
                  padding: '1rem 1.5rem'
                }}>
                  Artists
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: '#64748b',
                  padding: '1rem 1.5rem'
                }}>
                  Arena
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: '#64748b',
                  padding: '1rem 1.5rem'
                }}>
                  Tickets Sold
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', padding: '1rem 1.5rem', color: '#334155' }}>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', padding: '1rem 1.5rem', color: '#ef4444' }}>
                    {error}
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((concert, index) => (
                  <TableRow 
                    key={concert.concert_id}
                    sx={{ 
                      '&:hover': { backgroundColor: '#f8fafc' },
                      '&:last-child td': { borderBottom: 'none' }
                    }}
                  >
                    <TableCell sx={{ padding: '1rem 1.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                      {concert.concert_name}
                    </TableCell>
                    <TableCell sx={{ padding: '1rem 1.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                      {new Date(concert.concert_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ padding: '1rem 1.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                      {concert.artists}
                    </TableCell>
                    <TableCell sx={{ padding: '1rem 1.5rem', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                      {concert.arena_name}
                    </TableCell>
                    <TableCell sx={{ 
                      padding: '1rem 1.5rem', 
                      borderBottom: '1px solid #e2e8f0',
                      fontWeight: 700, 
                      fontSize: '1.1rem', 
                      color: '#3b82f6' 
                    }}>
                      {concert.tickets_sold}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', padding: '1rem 1.5rem', color: '#334155' }}>
                    No upcoming concerts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid #e2e8f0' 
        }}>
          <Typography sx={{ color: '#334155' }}>
            Page {currentPage} of {totalPages}
          </Typography>
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              startIcon={<ChevronLeft size={16} />}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                transition: 'all 0.2s ease',
                '&:hover:not(:disabled)': { backgroundColor: '#f1f5f9' },
                '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
              }}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              endIcon={<ChevronRight size={16} />}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                transition: 'all 0.2s ease',
                '&:hover:not(:disabled)': { backgroundColor: '#f1f5f9' },
                '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default AnalyticsReport; 