import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import './App.css';
import CitizenLandingPage from './citizen/CitizenLandingPage.jsx';
<<<<<<< HEAD
import ArrangeEvents from './events/ArrangeEvents.jsx';
=======
import TrackProgress from './citizen/TrackProgress.jsx';
import IssueSubmission from './citizen/IssueSubmission.jsx';
import Contribution from './citizen/Contribution.jsx';
>>>>>>> 63a0a0af67b5e187c61fdf89fe4bf44c28aacf02

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect admin users to admin panel
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// Admin Protected Route component
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id'}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                },
              }}
            />

            <Routes>
              <Route path="/auth" element={<AuthPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/auth" replace />} />

              <Route path="/citizen" element={<CitizenLandingPage />} />
<<<<<<< HEAD
              <Route path="/admin/events" element={<ArrangeEvents />} />
=======
              <Route path="/trackprogress" element={<TrackProgress />} />
              <Route path="/issue-submission" element={<IssueSubmission />} />
              <Route path="/contribution" element={<Contribution />} />
              
>>>>>>> 63a0a0af67b5e187c61fdf89fe4bf44c28aacf02
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
