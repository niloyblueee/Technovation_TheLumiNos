import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import AuthPage from './components/auth/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import './App.css';
import AdminDashboard from './components/admin/AdminDashboard.jsx';

import CitizenLandingPage from './citizen/CitizenLandingPage.jsx';
import TrackProgress from './citizen/TrackProgress.jsx';
import IssueSubmission from './citizen/IssueSubmission.jsx';
import Contribution from './citizen/Contribution.jsx';


import ArrangeEvents from './authority/ArrangeEvents.jsx';
import GovtDashboard from './authority/GovtDashboard.jsx';
import GovtRewardPage from './authority/GovtRewardPage.jsx';
import GovtProblemPage from './authority/GovtProblemPage.jsx';
import IssueVerification from './authority/IssueVerification.jsx';


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

  // No implicit redirect here; children handle content. Redirects happen on login/register.

  return children;
};

// Default redirect based on auth + role
const DefaultRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'govt_authority') return <Navigate to="/govt-dashboard" replace />;
  return <Navigate to="/citizen" replace />;
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
    // Non-admin users should not access /admin
    if (user?.role === 'govt_authority') return <Navigate to="/govt-dashboard" replace />;
    return <Navigate to="/citizen" replace />;
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

              {/* Default redirect: if logged in, send to role-based page */}
              <Route path="/" element={<DefaultRedirect />} />




              <Route path="/govt-events" element={<ArrangeEvents />} />
              <Route path="/govt-dashboard" element={<GovtDashboard />} />
              <Route path="/govt-reward-page" element={<GovtRewardPage />} />
              <Route path="/govt-problem-page" element={<GovtProblemPage />} />
              <Route
                path="/govt-verify/:id"
                element={
                  <ProtectedRoute>
                    <IssueVerification />
                  </ProtectedRoute>
                }
              />

              <Route path="/citizen" element={<CitizenLandingPage />} />
              <Route path="/trackprogress" element={<TrackProgress />} />
              <Route path="/issue-submission" element={<IssueSubmission />} />
              <Route path="/contribution" element={<Contribution />} />



            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
