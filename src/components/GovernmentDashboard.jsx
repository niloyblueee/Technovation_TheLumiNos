import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
    FiHome,
    FiUsers,
    FiMapPin,
    FiAlertTriangle,
    FiCheckCircle,
    FiClock,
    FiTrendingUp,
    FiSettings,
    FiLogOut,
    FiMenu,
    FiSun,
    FiMoon,
    FiBell,
    FiSearch,
    FiFilter,
    FiEye,
    FiEdit,
    FiTrash2,
    FiPlus,
    FiCalendar,
    FiMessageSquare,
    FiFileText,
    FiShield,
    FiTarget,
    FiAward,
    FiActivity
} from 'react-icons/fi';
import './GovernmentDashboard.css';

const GovernmentDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true' || true;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const navigationItems = [
        { id: 'overview', label: 'Overview', icon: FiHome, color: 'primary' },
        { id: 'issues', label: 'Issue Management', icon: FiAlertTriangle, color: 'warning' },
        { id: 'citizens', label: 'Citizen Reports', icon: FiUsers, color: 'info' },
        { id: 'events', label: 'Event Management', icon: FiCalendar, color: 'success' },
        { id: 'rewards', label: 'Reward System', icon: FiAward, color: 'secondary' },
        { id: 'verification', label: 'Verification Panel', icon: FiShield, color: 'danger' },
        { id: 'analytics', label: 'Analytics', icon: FiTrendingUp, color: 'purple' },
        { id: 'settings', label: 'Settings', icon: FiSettings, color: 'gray' }
    ];

    const stats = [
        {
            title: 'Total Issues',
            value: '24',
            change: '+12%',
            changeType: 'positive',
            icon: FiAlertTriangle,
            color: 'warning'
        },
        {
            title: 'Resolved Issues',
            value: '18',
            change: '+8%',
            changeType: 'positive',
            icon: FiCheckCircle,
            color: 'success'
        },
        {
            title: 'Pending Issues',
            value: '6',
            change: '+2',
            changeType: 'neutral',
            icon: FiClock,
            color: 'info'
        },
        {
            title: 'Citizen Reports',
            value: '156',
            change: '+23%',
            changeType: 'positive',
            icon: FiUsers,
            color: 'primary'
        }
    ];

    const recentIssues = [
        {
            id: 1,
            title: 'Road Repair Required',
            location: 'Dhanmondi, Dhaka',
            priority: 'high',
            status: 'pending',
            reportedBy: 'Ahmed Hassan',
            reportedAt: '2 hours ago',
            category: 'Infrastructure'
        },
        {
            id: 2,
            title: 'Water Supply Issue',
            location: 'Gulshan, Dhaka',
            priority: 'medium',
            status: 'in_progress',
            reportedBy: 'Fatima Khan',
            reportedAt: '4 hours ago',
            category: 'Utilities'
        },
        {
            id: 3,
            title: 'Street Light Repair',
            location: 'Banani, Dhaka',
            priority: 'low',
            status: 'resolved',
            reportedBy: 'Mohammad Ali',
            reportedAt: '1 day ago',
            category: 'Infrastructure'
        }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="overview-content">
                        <div className="welcome-section">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h1>Welcome back, {user.firstName}!</h1>
                                <p>Here's what's happening in your region today</p>
                            </motion.div>
                        </div>

                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.title}
                                    className={`stat-card stat-${stat.color}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className="stat-icon">
                                        <stat.icon />
                                    </div>
                                    <div className="stat-content">
                                        <h3>{stat.value}</h3>
                                        <p>{stat.title}</p>
                                        <div className={`stat-change ${stat.changeType}`}>
                                            <span>{stat.change}</span>
                                            <span>from last week</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="recent-issues">
                            <div className="section-header">
                                <h2>Recent Issues</h2>
                                <button className="view-all-btn">
                                    <FiEye />
                                    View All
                                </button>
                            </div>
                            <div className="issues-list">
                                {recentIssues.map((issue, index) => (
                                    <motion.div
                                        key={issue.id}
                                        className="issue-card"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        whileHover={{ x: 5 }}
                                    >
                                        <div className="issue-header">
                                            <div className="issue-title">
                                                <h4>{issue.title}</h4>
                                                <span className={`priority-badge ${issue.priority}`}>
                                                    {issue.priority}
                                                </span>
                                            </div>
                                            <span className={`status-badge ${issue.status}`}>
                                                {issue.status}
                                            </span>
                                        </div>
                                        <div className="issue-details">
                                            <p><FiMapPin /> {issue.location}</p>
                                            <p><FiUsers /> Reported by {issue.reportedBy}</p>
                                            <p><FiClock /> {issue.reportedAt}</p>
                                        </div>
                                        <div className="issue-actions">
                                            <button className="action-btn view-btn">
                                                <FiEye />
                                                View Details
                                            </button>
                                            <button className="action-btn edit-btn">
                                                <FiEdit />
                                                Update Status
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'issues':
                return (
                    <div className="issues-content">
                        <div className="content-header">
                            <h2>Issue Management</h2>
                            <div className="header-actions">
                                <div className="search-box">
                                    <FiSearch className="search-icon" />
                                    <input type="text" placeholder="Search issues..." />
                                </div>
                                <button className="filter-btn">
                                    <FiFilter />
                                    Filter
                                </button>
                                <button className="add-btn">
                                    <FiPlus />
                                    Add Issue
                                </button>
                            </div>
                        </div>
                        <div className="coming-soon">
                            <FiAlertTriangle className="coming-soon-icon" />
                            <h3>Issue Management System</h3>
                            <p>Track, manage, and resolve citizen-reported issues efficiently</p>
                        </div>
                    </div>
                );
            case 'citizens':
                return (
                    <div className="citizens-content">
                        <div className="content-header">
                            <h2>Citizen Reports</h2>
                            <div className="header-actions">
                                <div className="search-box">
                                    <FiSearch className="search-icon" />
                                    <input type="text" placeholder="Search reports..." />
                                </div>
                                <button className="filter-btn">
                                    <FiFilter />
                                    Filter
                                </button>
                            </div>
                        </div>
                        <div className="coming-soon">
                            <FiUsers className="coming-soon-icon" />
                            <h3>Citizen Report Management</h3>
                            <p>View and respond to citizen reports and feedback</p>
                        </div>
                    </div>
                );
            case 'events':
                return (
                    <div className="events-content">
                        <div className="content-header">
                            <h2>Event Management</h2>
                            <div className="header-actions">
                                <button className="add-btn">
                                    <FiPlus />
                                    Create Event
                                </button>
                            </div>
                        </div>
                        <div className="coming-soon">
                            <FiCalendar className="coming-soon-icon" />
                            <h3>Event Management System</h3>
                            <p>Create and manage community events and initiatives</p>
                        </div>
                    </div>
                );
            case 'rewards':
                return (
                    <div className="rewards-content">
                        <div className="content-header">
                            <h2>Reward System</h2>
                        </div>
                        <div className="coming-soon">
                            <FiAward className="coming-soon-icon" />
                            <h3>Reward & Recognition System</h3>
                            <p>Manage rewards for active citizens and contributors</p>
                        </div>
                    </div>
                );
            case 'verification':
                return (
                    <div className="verification-content">
                        <div className="content-header">
                            <h2>Verification Panel</h2>
                        </div>
                        <div className="coming-soon">
                            <FiShield className="coming-soon-icon" />
                            <h3>Issue Verification System</h3>
                            <p>Verify and validate citizen-reported issues</p>
                        </div>
                    </div>
                );
            case 'analytics':
                return (
                    <div className="analytics-content">
                        <div className="content-header">
                            <h2>Analytics & Reports</h2>
                        </div>
                        <div className="coming-soon">
                            <FiTrendingUp className="coming-soon-icon" />
                            <h3>Analytics Dashboard</h3>
                            <p>View detailed analytics and performance reports</p>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="settings-content">
                        <div className="content-header">
                            <h2>Settings</h2>
                        </div>
                        <div className="coming-soon">
                            <FiSettings className="coming-soon-icon" />
                            <h3>Settings & Preferences</h3>
                            <p>Configure your dashboard and notification preferences</p>
                        </div>
                    </div>
                );
            default:
                return <div>Content not found</div>;
        }
    };

    return (
        <div className={`government-dashboard ${darkMode ? 'dark' : 'light'}`}>
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
                <FiMenu />
            </button>

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <FiHome className="logo-icon" />
                        <span>Govt Dashboard</span>
                    </div>
                    <div className="user-info">
                        <div className="user-avatar">
                            <FiUsers />
                        </div>
                        <div className="user-details">
                            <h4>{user.firstName} {user.lastName}</h4>
                            <p>{user.department}</p>
                            <span className="region-badge">{user.region}</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navigationItems.map((item) => (
                        <motion.button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <item.icon className="nav-icon" />
                            <span>{item.label}</span>
                        </motion.button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="theme-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                    >
                        {darkMode ? <FiSun /> : <FiMoon />}
                        {darkMode ? 'Light' : 'Dark'} Mode
                    </button>
                    <button onClick={logout} className="logout-btn">
                        <FiLogOut />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="content-header">
                    <div className="header-left">
                        <h1>{navigationItems.find(item => item.id === activeTab)?.label}</h1>
                        <p>Manage your region's issues and citizen engagement</p>
                    </div>
                    <div className="header-right">
                        <button className="notification-btn">
                            <FiBell />
                            <span className="notification-badge">3</span>
                        </button>
                        <div className="user-menu">
                            <div className="user-avatar-small">
                                <FiUsers />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="content-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default GovernmentDashboard;
