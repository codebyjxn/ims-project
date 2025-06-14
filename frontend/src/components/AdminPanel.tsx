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
import './AdminPanel.css';

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
    switch (status) {
      case 'online': return <CheckCircle className="status-icon online" />;
      case 'offline': return <XCircle className="status-icon offline" />;
      case 'warning': return <AlertCircle className="status-icon warning" />;
      default: return <RefreshCw className="status-icon checking animate-spin" />;
    }
  };

  return (
    <div className="admin-panel">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <p className="subtitle">Admin Dashboard</p>
            <h1 className="title">System Management</h1>
          </div>
          <div className="header-actions">
            <div className="user-info">
              <User className="icon" />
              <span>{user?.email}</span>
            </div>
            <button onClick={logout} className="action-button">
              <LogOut className="icon" />
              Logout
            </button>
          </div>
        </div>
      <div className="status-bar">
        <div className={`status-item ${apiStatus}`}>
          {getStatusIcon(apiStatus)}
            <span>API Status: {apiStatus}</span>
        </div>
        <div className={`status-item ${dbStatus}`}>
          {getStatusIcon(dbStatus)}
            <span>Database Status: {dbStatus}</span>
          </div>
          <button onClick={checkSystemStatus} disabled={loading === 'health'} className="refresh-button">
              <RefreshCw size={16} className={loading === 'health' ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>
      <main className="main-content">
        <div className="grid">
          {/* System Actions */}
          <div className="card">
            <div className="card-header">
              <Database className="icon" />
              <h3>Database Actions</h3>
      </div>
            <div className="card-content">
              <p>Use these actions to manage the database state.</p>
          <div className="button-group">
            <button 
              onClick={seedDatabase}
              disabled={loading === 'seed'}
                  className="action-button"
            >
                  {loading === 'seed' ? 'Seeding...' : 'Seed Database'}
            </button>
            <button 
              onClick={migrateToNoSQL}
              disabled={loading === 'migrate'}
                  className="action-button"
            >
                  {loading === 'migrate' ? 'Migrating...' : 'Migrate to NoSQL'}
            </button>
          </div>
          </div>
        </div>

          {/* Analytics Report Navigation */}
        <div className="card">
            <div className="card-header">
              <BarChart3 className="icon" />
              <h3>Analytics</h3>
                    </div>
            <div className="card-content">
              <p>View detailed reports on concert performance and organizer analytics.</p>
              <div className="button-group">
                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="action-button"
                >
                  Concert Analytics Report
                  <ArrowRightLeft className="icon" />
                </button>
                <button 
                  onClick={() => navigate('/admin/organizers-analytics')}
                  className="action-button"
                >
                  Organizers Analytics Report
                  <BarChart3 className="icon" />
                </button>
              </div>
                      </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel; 