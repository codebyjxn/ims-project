import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, UpcomingConcertPerformance } from '../services/api';
import { BarChart3, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import './AnalyticsReport.css';

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
      const data = await api.getUpcomingConcertsPerformance();
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
    <div className="analytics-report-container">
      <div className="analytics-report-header">
        <div className="analytics-report-title">
          <BarChart3 size={32} />
          <h1>Upcoming Concerts Performance</h1>
        </div>
        <button onClick={() => navigate('/admin')} className="back-button">
          <ArrowLeft size={16} />
          Back to Admin
        </button>
      </div>

      <div className="analytics-report-card">
        <div className="card-header">
            <h3>Performance Report</h3>
            <button onClick={fetchPerformanceData} disabled={loading} className="refresh-button">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Concert</th>
                <th>Date</th>
                <th>Artists</th>
                <th>Arena</th>
                <th>Tickets Sold</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="text-center error-message">{error}</td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((concert) => (
                  <tr key={concert.concert_id}>
                    <td>{concert.concert_name}</td>
                    <td>{new Date(concert.concert_date).toLocaleDateString()}</td>
                    <td>{concert.artists}</td>
                    <td>{concert.arena_name}</td>
                    <td className="tickets-sold">{concert.tickets_sold}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">No upcoming concerts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination-container">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport; 