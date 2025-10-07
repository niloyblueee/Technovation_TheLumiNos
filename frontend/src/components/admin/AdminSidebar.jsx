import React from 'react';
import { motion } from 'framer-motion';
import {
    FiHome,
    FiUsers,
    FiClock,
    FiSettings,
    FiSun,
    FiMoon,
    FiLogOut,
    FiShield
} from 'react-icons/fi';
import './AdminSidebar.css';

const AdminSidebar = ({
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    setDarkMode,
    tabs
}) => {
    const sidebarVariants = {
        open: { x: 0 },
        closed: { x: '-100%' }
    };

    const itemVariants = {
        open: { opacity: 1, x: 0 },
        closed: { opacity: 0, x: -20 }
    };

    const getIcon = (iconName) => {
        const icons = {
            '📊': <FiHome />,
            '⏳': <FiClock />,
            '👥': <FiUsers />,
        };
        return icons[iconName] || <FiShield />;
    };

    return (
        <motion.aside
            className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
            variants={sidebarVariants}
            initial="closed"
            animate={sidebarOpen ? "open" : "closed"}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="sidebar-header">
                <motion.div
                    className="logo"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                    <FiShield className="logo-icon" />
                    <div className="logo-text">
                        <h2>Admin Panel</h2>
                        <p>SDG11 Management</p>
                    </div>
                </motion.div>
            </div>

            <nav className="sidebar-nav">
                {tabs.map((tab, index) => (
                    <motion.button
                        key={tab.id}
                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSidebarOpen(false);
                        }}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="nav-icon">
                            {getIcon(tab.icon)}
                        </span>
                        <span className="nav-text">{tab.name}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                className="active-indicator"
                                layoutId="activeIndicator"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <motion.div
                    className="theme-toggle"
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    transition={{ delay: 0.4 }}
                >
                    <button
                        className={`theme-btn ${darkMode ? 'dark' : 'light'}`}
                        onClick={() => setDarkMode(!darkMode)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {darkMode ? <FiSun /> : <FiMoon />}
                        <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
                    </button>
                </motion.div>

                <motion.div
                    className="admin-info"
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    transition={{ delay: 0.5 }}
                >
                    <div className="admin-avatar">
                        <FiShield />
                    </div>
                    <div className="admin-details">
                        <p className="admin-name">System Admin</p>
                        <p className="admin-role">Super Administrator</p>
                    </div>
                </motion.div>
            </div>
        </motion.aside>
    );
};

export default AdminSidebar;

