import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMenu,
    FiBell,
    FiSearch,
    FiUser,
    FiLogOut,
    FiSun,
    FiMoon,
    FiSettings
} from 'react-icons/fi';
import './AdminHeader.css';

const AdminHeader = ({
    user,
    logout,
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    setDarkMode
}) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [notifications] = useState([
        { id: 1, message: 'New government authority request', time: '2 min ago', unread: true },
        { id: 2, message: 'User registration completed', time: '1 hour ago', unread: true },
        { id: 3, message: 'System backup completed', time: '3 hours ago', unread: false },
    ]);

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="admin-header">
            <div className="header-left">
                <motion.button
                    className="menu-btn"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiMenu />
                </motion.button>

                <div className="header-title">
                    <h1>Admin Dashboard</h1>
                    <p>SDG11 Management System</p>
                </div>
            </div>

            <div className="header-right">
                {/* Search */}
                <div className="search-container">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users, requests..."
                        className="search-input"
                    />
                </div>

                {/* Theme Toggle */}
                <motion.button
                    className={`theme-toggle ${darkMode ? 'dark' : 'light'}`}
                    onClick={() => setDarkMode(!darkMode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                >
                    {darkMode ? <FiSun /> : <FiMoon />}
                </motion.button>

                {/* Notifications */}
                <div className="notifications-container">
                    <motion.button
                        className="notification-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiBell />
                        {unreadCount > 0 && (
                            <motion.span
                                className="notification-badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                {unreadCount}
                            </motion.span>
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                className="notification-dropdown"
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="dropdown-header">
                                    <h3>Notifications</h3>
                                    <span className="unread-count">{unreadCount} unread</span>
                                </div>
                                <div className="notification-list">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            className={`notification-item ${notification.unread ? 'unread' : ''}`}
                                            whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                                        >
                                            <div className="notification-content">
                                                <p className="notification-message">{notification.message}</p>
                                                <span className="notification-time">{notification.time}</span>
                                            </div>
                                            {notification.unread && <div className="unread-dot" />}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="user-menu-container">
                    <motion.button
                        className="user-btn"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="user-avatar">
                            <FiUser />
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.firstName} {user?.lastName}</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    </motion.button>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                className="user-dropdown"
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="dropdown-item">
                                    <FiUser />
                                    <span>Profile</span>
                                </div>
                                <div className="dropdown-item">
                                    <FiSettings />
                                    <span>Settings</span>
                                </div>
                                <div className="dropdown-divider" />
                                <motion.button
                                    className="dropdown-item logout-btn"
                                    onClick={logout}
                                    whileHover={{ backgroundColor: 'var(--danger-color)', color: 'white' }}
                                >
                                    <FiLogOut />
                                    <span>Logout</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;

