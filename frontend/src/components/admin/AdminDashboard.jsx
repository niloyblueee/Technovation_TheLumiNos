import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import PendingRequests from './PendingRequests';
import UserManagement from './UserManagement';
import AdminStats from './AdminStats';
import axios from 'axios';
import toast from 'react-hot-toast';
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

    // Shared state for all users and pending requests
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all users from backend
    const fetchAllUsers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/all-users`);
            setAllUsers(response.data.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Functions to update user state
    const updateUserStatus = async (userId, newStatus) => {
        try {
            if (newStatus === 'active' || newStatus === 'rejected') {
                // This is an approval/rejection of a govt authority
                const action = newStatus === 'active' ? 'approve' : 'reject';
                await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/approve-govt-authority/${userId}`, {
                    action: action
                });
            } else {
                // This is a general status update
                await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/users/${userId}/status`, {
                    status: newStatus
                });
            }

            // Update local state
            setAllUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, status: newStatus } : user
            ));
        } catch (error) {
            console.error('Failed to update user status:', error);
            toast.error('Failed to update user status');
        }
    };

    const deleteUser = async (userId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/users/${userId}`);

            // Update local state
            setAllUsers(prev => prev.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user');
        }
    };

    // Get pending requests (govt_authority with pending status)
    const pendingRequests = allUsers.filter(user =>
        user.role === 'govt_authority' && user.status === 'pending'
    );

    // Get statistics
    const stats = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(user => user.status === 'active').length,
        pendingUsers: pendingRequests.length,
        rejectedUsers: allUsers.filter(user => user.status === 'rejected').length,
        totalCitizens: allUsers.filter(user => user.role === 'citizen').length,
        totalGovtAuthorities: allUsers.filter(user => user.role === 'govt_authority').length,
        totalAdmins: allUsers.filter(user => user.role === 'admin').length,
        recentRegistrations: allUsers.slice(-5).reverse()
    };

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AdminStats stats={stats} />;
            case 'pending':
                return (
                    <PendingRequests
                        pendingRequests={pendingRequests}
                        onApprove={(userId) => updateUserStatus(userId, 'active')}
                        onReject={(userId) => updateUserStatus(userId, 'rejected')}
                    />
                );
            case 'users':
                return (
                    <UserManagement
                        users={allUsers}
                        onUpdateStatus={updateUserStatus}
                        onDeleteUser={deleteUser}
                    />
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

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <h2>Loading Admin Dashboard...</h2>
                    <p>Fetching user data and statistics</p>
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
