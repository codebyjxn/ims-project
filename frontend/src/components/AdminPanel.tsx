import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  BarChart3, 
  Activity, 
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  Music,
  ArrowRightLeft,
  Plus,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

interface SystemStats {
  postgresql?: {
    totalRecords: number;
    tables: Record<string, number>;
  };
  mongodb?: {
    totalRecords: number;
    collections: Record<string, number>;
  };
  system?: {
    uptime: string;
    memory: string;
  };
}

interface HealthStatus {
  status: string;
  services?: Record<string, string>;
  timestamp?: string;
}

interface LogEntry {
  id: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'warning' | 'checking'>('checking');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      type: 'info',
      message: 'Admin panel loaded successfully',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const checkSystemStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setApiStatus('online');
      await checkDatabaseStatus();
    } catch (error) {
      setApiStatus('offline');
      setDbStatus('offline');
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      const healthData = response.data as HealthStatus;
      const pgStatus = healthData.services?.postgres || 'unknown';
      const mongoStatus = healthData.services?.mongodb || 'unknown';
      
      if (pgStatus === 'connected' && mongoStatus === 'connected') {
        setDbStatus('online');
      } else if (pgStatus === 'connected' || mongoStatus === 'connected') {
        setDbStatus('warning');
      } else {
        setDbStatus('offline');
      }
    } catch (error) {
      setDbStatus('offline');
    }
  };

  const seedDatabase = async () => {
    setLoading('seed');
    try {
      addLog('info', 'Starting database seeding...');
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/admin/seed`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      addLog('success', `Database seeded successfully: ${(response.data as any).message || 'Sample data created'}`);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      addLog('error', `Seeding failed: ${message}`);
    } finally {
      setLoading(null);
    }
  };

  const migrateToNoSQL = async () => {
    setLoading('migrate');
    try {
      addLog('info', 'Starting migration to MongoDB...');
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/admin/migrate`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      addLog('success', `Migration completed: ${(response.data as any).message || 'Data migrated to MongoDB'}`);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      addLog('error', `Migration failed: ${message}`);
    } finally {
      setLoading(null);
    }
  };

  const clearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear ALL data from both databases? This action cannot be undone!')) {
      return;
    }
    
    setLoading('clear');
    try {
      addLog('warning', 'Starting database clear operation...');
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/admin/clear`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      addLog('success', `Database cleared: ${(response.data as any).message || 'All data removed'}`);
      setStats(null);
      setHealth(null);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      addLog('error', `Clear failed: ${message}`);
    } finally {
      setLoading(null);
    }
  };

  const getStats = async () => {
    setLoading('stats');
    try {
      addLog('info', 'Fetching system statistics...');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setStats(response.data as SystemStats);
      addLog('success', 'Statistics loaded successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      addLog('error', `Stats error: ${message}`);
    } finally {
      setLoading(null);
    }
  };

  const checkHealth = async () => {
    setLoading('health');
    try {
      addLog('info', 'Performing health check...');
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      setHealth(response.data as HealthStatus);
      addLog('success', 'Health check completed');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      addLog('error', `Health check error: ${message}`);
    } finally {
      setLoading(null);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Activity log cleared');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="status-icon online" />;
      case 'offline': return <XCircle className="status-icon offline" />;
      case 'warning': return <AlertCircle className="status-icon warning" />;
      default: return <RefreshCw className="status-icon checking animate-spin" />;
    }
  };

  const getStatusText = (status: string, type: string) => {
    switch (status) {
      case 'online': return `${type}: Online`;
      case 'offline': return `${type}: Offline`;
      case 'warning': return `${type}: Warning`;
      default: return `${type}: Checking...`;
    }
  };

  return (
    <div className="admin-panel">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <h1><Music className="header-icon" /> Joana Booking System</h1>
            <p className="subtitle">Admin Dashboard</p>
          </div>
          <div className="header-user">
            <div className="user-info">
              <User className="user-icon" />
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="user-type">({user?.userType})</span>
            </div>
            <button className="logout-btn" onClick={logout}>
              <LogOut className="btn-icon" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="status-bar">
        <div className={`status-item ${apiStatus}`}>
          {getStatusIcon(apiStatus)}
          <span>{getStatusText(apiStatus, 'API')}</span>
        </div>
        <div className={`status-item ${dbStatus}`}>
          {getStatusIcon(dbStatus)}
          <span>{getStatusText(dbStatus, 'Database')}</span>
        </div>
      </div>

      <div className="dashboard">
        <div className="card">
          <h2><Database className="card-icon" /> Database Management</h2>
          <div className="button-group">
            <button 
              className="btn btn-primary" 
              onClick={seedDatabase}
              disabled={loading === 'seed'}
            >
              {loading === 'seed' ? (
                <RefreshCw className="btn-icon animate-spin" />
              ) : (
                <Plus className="btn-icon" />
              )}
              Seed PostgreSQL Database
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={migrateToNoSQL}
              disabled={loading === 'migrate'}
            >
              {loading === 'migrate' ? (
                <RefreshCw className="btn-icon animate-spin" />
              ) : (
                <ArrowRightLeft className="btn-icon" />
              )}
              Migrate to MongoDB
            </button>
            <button 
              className="btn btn-danger" 
              onClick={clearDatabase}
              disabled={loading === 'clear'}
            >
              {loading === 'clear' ? (
                <RefreshCw className="btn-icon animate-spin" />
              ) : (
                <Trash2 className="btn-icon" />
              )}
              Clear All Data
            </button>
          </div>
          <div className="info">
            <p><strong>Seed Database:</strong> Populates PostgreSQL with sample concerts, venues, artists, and users</p>
            <p><strong>Migrate to NoSQL:</strong> Copies data from PostgreSQL to MongoDB for analytics</p>
            <p><strong>Clear Data:</strong> Removes all data from both databases</p>
          </div>
        </div>

        <div className="card">
          <h2><BarChart3 className="card-icon" /> System Statistics</h2>
          <button 
            className="btn btn-info" 
            onClick={getStats}
            disabled={loading === 'stats'}
          >
            {loading === 'stats' ? (
              <RefreshCw className="btn-icon animate-spin" />
            ) : (
              <RefreshCw className="btn-icon" />
            )}
            Refresh Stats
          </button>
          <div className="stats-grid">
            {stats ? (
              <>
                {stats.postgresql && (
                  <>
                    <div className="stat-item">
                      <span className="stat-value">{stats.postgresql.totalRecords}</span>
                      <span className="stat-label">PostgreSQL Records</span>
                    </div>
                    {Object.entries(stats.postgresql.tables || {}).map(([table, count]) => (
                      <div key={table} className="stat-item">
                        <span className="stat-value">{count}</span>
                        <span className="stat-label">{table.charAt(0).toUpperCase() + table.slice(1)}</span>
                      </div>
                    ))}
                  </>
                )}
                {stats.mongodb && (
                  <>
                    <div className="stat-item">
                      <span className="stat-value">{stats.mongodb.totalRecords}</span>
                      <span className="stat-label">MongoDB Records</span>
                    </div>
                    {Object.entries(stats.mongodb.collections || {}).map(([collection, count]) => (
                      <div key={collection} className="stat-item">
                        <span className="stat-value">{count}</span>
                        <span className="stat-label">{collection.charAt(0).toUpperCase() + collection.slice(1)}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <p>Click "Refresh Stats" to load system information</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2><Activity className="card-icon" /> System Health</h2>
          <button 
            className="btn btn-success" 
            onClick={checkHealth}
            disabled={loading === 'health'}
          >
            {loading === 'health' ? (
              <RefreshCw className="btn-icon animate-spin" />
            ) : (
              <Server className="btn-icon" />
            )}
            Check Health
          </button>
          <div className="health-grid">
            {health ? (
              <>
                <div className="health-item">
                  <div className={`health-status ${health.status === 'OK' ? 'healthy' : 'unhealthy'}`}>
                    {health.status || 'Unknown'}
                  </div>
                  <div>Overall Status</div>
                </div>
                {health.services && Object.entries(health.services).map(([service, status]) => (
                  <div key={service} className="health-item">
                    <div className={`health-status ${status === 'connected' ? 'healthy' : 'unhealthy'}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    <div>{service.charAt(0).toUpperCase() + service.slice(1)}</div>
                  </div>
                ))}
                {health.timestamp && (
                  <div className="health-item">
                    <div className="health-status">{new Date(health.timestamp).toLocaleString()}</div>
                    <div>Last Check</div>
                  </div>
                )}
              </>
            ) : (
              <p>Click "Check Health" to verify system status</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2><Activity className="card-icon" /> Activity Log</h2>
        <div className="log-container">
          {logs.map(log => (
            <div key={log.id} className={`log-entry ${log.type}`}>
              <span className="timestamp">[{log.timestamp}]</span>
              {log.message}
            </div>
          ))}
        </div>
        <button className="btn btn-outline" onClick={clearLogs}>
          <Trash2 className="btn-icon" />
          Clear Log
        </button>
      </div>
    </div>
  );
};

export default AdminPanel; 