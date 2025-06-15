import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { OrganizerAnalytics } from '../services/api/admin';
import { BarChart3, ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const ROWS_PER_PAGE = 10;

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '2rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem'
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '1rem',
    margin: '0 0 0.75rem 0'
  },
  databaseBadge: {
    background: '#dbeafe',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#475569',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  summaryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statIconRevenue: {
    background: '#dcfce7',
    color: '#16a34a'
  },
  statIconConcerts: {
    background: '#dbeafe',
    color: '#2563eb'
  },
  statIconTickets: {
    background: '#fef3c7',
    color: '#d97706'
  },
  statIconFans: {
    background: '#f3e8ff',
    color: '#9333ea'
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.2
  },
  statLabel: {
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginTop: '0.25rem'
  },
  analyticsCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: '#f8fafc'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 0.5rem 0'
  },
  cardSubtitle: {
    color: '#64748b',
    fontSize: '0.875rem',
    margin: 0
  },
  filterSelect: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: 'white',
    color: '#374151',
    fontSize: '0.875rem'
  },
  tableContainer: {
    overflowX: 'auto' as const
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    padding: '0.75rem',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    userSelect: 'none' as const
  },
  tableHeaderHover: {
    backgroundColor: '#f1f5f9'
  },
  tableCell: {
    padding: '0.75rem',
    borderBottom: '1px solid #f3f4f6'
  },
  tableRowHover: {
    backgroundColor: '#f9fafb'
  },
  orgCell: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  orgName: {
    fontWeight: 600,
    color: '#1f2937'
  },
  orgContact: {
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  numberCell: {
    textAlign: 'right' as const,
    fontWeight: 500
  },
  currencyCell: {
    textAlign: 'right' as const,
    fontWeight: 600,
    color: '#059669'
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    background: '#f9fafb'
  },
  paginationInfo: {
    color: '#6b7280',
    fontSize: '0.875rem'
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  paginationButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: 'white',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  pageInfo: {
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: 500
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#6b7280'
  },
  errorMessage: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '1rem 1.5rem',
    borderLeft: '4px solid #dc2626'
  },
  noData: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: '#6b7280',
    fontSize: '1.125rem'
  }
};

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
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <BarChart3 size={32} style={{ color: '#3b82f6', marginTop: '0.25rem' }} />
          <div>
            <h1 style={styles.title}>Organizers Analytics Report</h1>
            <p style={styles.subtitle}>Comprehensive performance analysis by arena</p>
            {databaseType && (
              <span style={styles.databaseBadge}>Data Source: {databaseType}</span>
            )}
          </div>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          style={styles.backButton}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <ArrowLeft size={16} />
          Back to Admin
        </button>
      </div>

      {/* Summary Statistics */}
      {summaryStats && (
        <div style={styles.summaryStats}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, ...styles.statIconRevenue}}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{formatCurrency(summaryStats.totalRevenue)}</div>
              <div style={styles.statLabel}>Total Revenue</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, ...styles.statIconConcerts}}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{summaryStats.totalConcerts}</div>
              <div style={styles.statLabel}>Total Concerts</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, ...styles.statIconTickets}}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{formatNumber(summaryStats.totalTickets)}</div>
              <div style={styles.statLabel}>Tickets Sold</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, ...styles.statIconFans}}>
              <Users size={24} />
            </div>
            <div>
              <div style={styles.statValue}>{formatNumber(summaryStats.totalUniqueFans)}</div>
              <div style={styles.statLabel}>Unique Fans</div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.analyticsCard}>
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>Organizer Performance by Arena</h3>
            <p style={styles.cardSubtitle}>Detailed breakdown of organizer performance metrics</p>
          </div>
          <div>
            <select 
              value={filterArena} 
              onChange={(e) => {
                setFilterArena(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.filterSelect}
            >
              <option value="">All Arenas</option>
              {uniqueArenas.map(arena => (
                <option key={arena} value={arena}>{arena}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <span>❌ {error}</span>
          </div>
        )}

        {loading ? (
          <div style={styles.loadingContainer}>
            <div>Loading organizers analytics...</div>
          </div>
        ) : analyticsData.length === 0 ? (
          <div style={styles.noData}>
            <span>📊 No analytics data available</span>
          </div>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th 
                      onClick={() => handleSort('orgName')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Organization {getSortIcon('orgName')}
                    </th>
                    <th 
                      onClick={() => handleSort('arena')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Arena {getSortIcon('arena')}
                    </th>
                    <th 
                      onClick={() => handleSort('location')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Location {getSortIcon('location')}
                    </th>
                    <th 
                      onClick={() => handleSort('concerts')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Concerts {getSortIcon('concerts')}
                    </th>
                    <th 
                      onClick={() => handleSort('revenue')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Revenue {getSortIcon('revenue')}
                    </th>
                    <th 
                      onClick={() => handleSort('tickets')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Tickets {getSortIcon('tickets')}
                    </th>
                    <th 
                      onClick={() => handleSort('uniqueFans')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Unique Fans {getSortIcon('uniqueFans')}
                    </th>
                    <th 
                      onClick={() => handleSort('avgPrice')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Avg Price {getSortIcon('avgPrice')}
                    </th>
                    <th 
                      onClick={() => handleSort('avgTicketsPerConcert')} 
                      style={styles.tableHeader}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableHeaderHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                    >
                      Avg Tickets/Concert {getSortIcon('avgTicketsPerConcert')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((org, index) => (
                    <tr 
                      key={`${org.orgId}-${org.arena}-${index}`}
                      onMouseOver={(e) => {
                        Object.assign(e.currentTarget.style, styles.tableRowHover);
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={styles.tableCell}>
                        <div style={styles.orgCell}>
                          <div style={styles.orgName}>{org.orgName}</div>
                          <div style={styles.orgContact}>{org.contact}</div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>{org.arena}</td>
                      <td style={styles.tableCell}>{org.location}</td>
                      <td style={{...styles.tableCell, ...styles.numberCell}}>{org.concerts}</td>
                      <td style={{...styles.tableCell, ...styles.currencyCell}}>{formatCurrency(org.revenue)}</td>
                      <td style={{...styles.tableCell, ...styles.numberCell}}>{org.tickets}</td>
                      <td style={{...styles.tableCell, ...styles.numberCell}}>{org.uniqueFans}</td>
                      <td style={{...styles.tableCell, ...styles.currencyCell}}>{formatCurrency(org.avgPrice)}</td>
                      <td style={{...styles.tableCell, ...styles.numberCell}}>{formatNumber(org.avgTicketsPerConcert, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.paginationContainer}>
              <div style={styles.paginationInfo}>
                Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1} to {Math.min(currentPage * ROWS_PER_PAGE, processedData.length)} of {processedData.length} results
              </div>
              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
                  }}
                  onMouseOver={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span style={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
                  }}
                  onMouseOver={(e) => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
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