import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import ConcertsPage from './pages/ConcertsPage';
import ConcertDetailPage from './pages/ConcertDetailPage';
import UserDashboard from './pages/UserDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OrganizerAnalytics from './pages/OrganizerAnalytics';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import AdminPanel from './components/AdminPanel';
import AnalyticsReport from './pages/AnalyticsReport';
import OrganizersAnalyticsReport from './pages/OrganizersAnalyticsReport';
import './App.css';

// Protected route wrapper for any authenticated user
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Protected route wrapper for fan users
const FanRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.userType !== 'fan') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>Access Denied</h2>
        <p>This page is only available for fans.</p>
        <p>User type: {user?.userType}</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Protected route wrapper for organizer users
const OrganizerRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.userType !== 'organizer') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>Access Denied</h2>
        <p>This page is only available for event organizers.</p>
        <p>User type: {user?.userType}</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Protected route wrapper for admin users only
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.userType !== 'admin') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>Access Denied</h2>
        <p>You need administrator privileges to access this page.</p>
        <p>User type: {user?.userType}</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/concerts" element={<ConcertsPage />} />
          <Route path="/concerts/:id" element={<ConcertDetailPage />} />
          <Route 
            path="/dashboard" 
            element={
              <FanRoute>
                <UserDashboard />
              </FanRoute>
            } 
          />
          <Route 
            path="/organizers" 
            element={
              <OrganizerRoute>
                <OrganizerDashboard />
              </OrganizerRoute>
            } 
          />
          <Route 
            path="/organizers/analytics" 
            element={
              <OrganizerRoute>
                <OrganizerAnalytics />
              </OrganizerRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AnalyticsReport />
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/organizers-analytics"
            element={
              <AdminRoute>
                <OrganizersAnalyticsReport />
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
