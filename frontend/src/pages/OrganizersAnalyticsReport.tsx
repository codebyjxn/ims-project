import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { OrganizerAnalytics } from '../services/api/admin';
import { BarChart3, ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import './OrganizersAnalyticsReport.css';

const ROWS_PER_PAGE = 10;

const OrganizersAnalyticsReport: React.FC = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<OrganizerAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [databaseType, setDatabaseType] = useState<string>('');
  const [sortField, setSortField] = useState<keyof OrganizerAnalytics>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterArena, setFilterArena] = useState<string>('');

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getOrganizersAnalytics();
      setAnalyticsData(response.analytics);
      setDatabaseType(response.database);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizers analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const summaryStats = React.useMemo(() => {
    if (analyticsData.length === 0) return null;
    
    const totalRevenue = analyticsData.reduce((sum, org) => sum + org.revenue, 0);
    const totalConcerts = analyticsData.reduce((sum, org) => sum + org.concerts, 0);
    const totalTickets = analyticsData.reduce((sum, org) => sum + org.tickets, 0);
    const totalUniqueFans = analyticsData.reduce((sum, org) => sum + org.uniqueFans, 0);
    
    return {
      totalRevenue,
      totalConcerts,
      totalTickets,
      totalUniqueFans,
      avgRevenuePerOrganizer: totalRevenue / analyticsData.length,
      avgConcertsPerOrganizer: totalConcerts / analyticsData.length
    };
  }, [analyticsData]);

  const uniqueArenas = React.useMemo(() => {
    const arenas = Array.from(new Set(analyticsData.map(org => org.arena))).filter(arena => arena && arena !== 'No arena');
    return arenas.sort();
  }, [analyticsData]);

  const processedData = React.useMemo(() => {
    let filtered = analyticsData;
    
    if (filterArena) {
      filtered = filtered.filter(org => org.arena === filterArena);
    }
    
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    return filtered;
  }, [analyticsData, sortField, sortDirection, filterArena]);

  const totalPages = Math.ceil(processedData.length / ROWS_PER_PAGE);
  const paginatedData = processedData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleSort = (field: keyof OrganizerAnalytics) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const getSortIcon = (field: keyof OrganizerAnalytics) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="organizers-analytics-container">
      <div className="analytics-header">
        <div className="analytics-title">
          <BarChart3 size={32} />
          <div>
            <h1>Organizers Analytics Report</h1>
            <p className="subtitle">Comprehensive performance analysis by arena</p>
            {databaseType && (
              <span className="database-badge">Data Source: {databaseType}</span>
            )}
          </div>
        </div>
        <button onClick={() => navigate('/admin')} className="back-button">
          <ArrowLeft size={16} />
          Back to Admin
        </button>
      </div>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-icon revenue">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatCurrency(summaryStats.totalRevenue)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon concerts">
              <Calendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{summaryStats.totalConcerts}</div>
              <div className="stat-label">Total Concerts</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon tickets">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(summaryStats.totalTickets)}</div>
              <div className="stat-label">Tickets Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon fans">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(summaryStats.totalUniqueFans)}</div>
              <div className="stat-label">Unique Fans</div>
            </div>
          </div>
        </div>
      )}

      <div className="analytics-card">
        <div className="card-header">
          <div className="header-left">
            <h3>Organizer Performance by Arena</h3>
            <p>Detailed breakdown of organizer performance metrics</p>
          </div>
          <div className="header-right">
            <select 
              value={filterArena} 
              onChange={(e) => {
                setFilterArena(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Arenas</option>
              {uniqueArenas.map(arena => (
                <option key={arena} value={arena}>{arena}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>❌ {error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Loading organizers analytics...</span>
          </div>
        ) : analyticsData.length === 0 ? (
          <div className="no-data">
            <span>📊 No analytics data available</span>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('orgName')} className="sortable">
                      Organization {getSortIcon('orgName')}
                    </th>
                    <th onClick={() => handleSort('arena')} className="sortable">
                      Arena {getSortIcon('arena')}
                    </th>
                    <th onClick={() => handleSort('location')} className="sortable">
                      Location {getSortIcon('location')}
                    </th>
                    <th onClick={() => handleSort('concerts')} className="sortable">
                      Concerts {getSortIcon('concerts')}
                    </th>
                    <th onClick={() => handleSort('revenue')} className="sortable">
                      Revenue {getSortIcon('revenue')}
                    </th>
                    <th onClick={() => handleSort('tickets')} className="sortable">
                      Tickets {getSortIcon('tickets')}
                    </th>
                    <th onClick={() => handleSort('uniqueFans')} className="sortable">
                      Unique Fans {getSortIcon('uniqueFans')}
                    </th>
                    <th onClick={() => handleSort('avgPrice')} className="sortable">
                      Avg Price {getSortIcon('avgPrice')}
                    </th>
                    <th onClick={() => handleSort('avgTicketsPerConcert')} className="sortable">
                      Avg Tickets/Concert {getSortIcon('avgTicketsPerConcert')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((org, index) => (
                    <tr key={`${org.orgId}-${org.arena}-${index}`}>
                      <td>
                        <div className="org-cell">
                          <div className="org-name">{org.orgName}</div>
                          <div className="org-contact">{org.contact}</div>
                        </div>
                      </td>
                      <td>{org.arena}</td>
                      <td>{org.location}</td>
                      <td className="number-cell">{org.concerts}</td>
                      <td className="currency-cell">{formatCurrency(org.revenue)}</td>
                      <td className="number-cell">{org.tickets}</td>
                      <td className="number-cell">{org.uniqueFans}</td>
                      <td className="currency-cell">{formatCurrency(org.avgPrice)}</td>
                      <td className="number-cell">{formatNumber(org.avgTicketsPerConcert, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-container">
              <div className="pagination-info">
                Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} to {Math.min(currentPage * ROWS_PER_PAGE, processedData.length)} of {processedData.length} results
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizersAnalyticsReport; 