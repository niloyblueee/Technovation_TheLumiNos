import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
// import PendingRequests from './PendingRequests';
// import UserManagement from './UserManagement';
import AdminStats from './AdminStats';
// import AdminSidebar from './AdminSidebar';
// import AdminHeader from './AdminHeader';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true' || true; // Default to dark mode
    });

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AdminStats />;
            case 'pending':
                return (
                    <div>
                        <h2>Pending Government Authority Requests</h2>
                        <p>Review and approve government authority registrations</p>
                        <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                            <p>No pending requests at the moment.</p>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div>
                        <h2>User Management</h2>
                        <p>Manage all users in the system</p>
                        <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                            <p>User management features coming soon...</p>
                        </div>
                    </div>
                );
            default:
                return <div><h2>Dashboard</h2><p>Default content</p></div>;
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="admin-access-denied">
                <div className="access-denied-content">
                    <h1>🚫 Access Denied</h1>
                    <p>You need admin privileges to access this dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`admin-dashboard ${darkMode ? 'dark' : 'light'}`}>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        className="mobile-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                ☰
            </button>

            {/* Simple Sidebar */}
            <div className={`simple-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                </div>
                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        ⏳ Pending Requests
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 User Management
                    </button>
                </nav>
                <div className="sidebar-footer">
                    <button
                        className="theme-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                    >
                        {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'} Mode
                    </button>
                    <button onClick={logout} className="logout-btn">
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-main-content">
                <div className="admin-content">
                    <div className="admin-content-wrapper">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
