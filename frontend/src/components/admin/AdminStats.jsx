import React from 'react';
import { motion } from 'framer-motion';
import {
    FiUsers,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiTrendingUp,
    FiMapPin,
    FiHome,
    FiShield
} from 'react-icons/fi';
import './AdminStats.css';

const AdminStats = ({ stats }) => {
    // Use stats from props (real data from backend)

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: FiUsers,
            color: 'primary',
            change: '+12%',
            changeType: 'positive'
        },
        {
            title: 'Active Users',
            value: stats?.activeUsers || 0,
            icon: FiCheckCircle,
            color: 'success',
            change: '+8%',
            changeType: 'positive'
        },
        {
            title: 'Pending Requests',
            value: stats?.pendingUsers || 0,
            icon: FiClock,
            color: 'warning',
            change: '+3',
            changeType: 'neutral'
        },
        {
            title: 'Rejected Users',
            value: stats?.rejectedUsers || 0,
            icon: FiXCircle,
            color: 'danger',
            change: '-2',
            changeType: 'positive'
        }
    ];

    const roleStats = [
        {
            title: 'Citizens',
            value: stats?.totalCitizens || 0,
            icon: FiUsers,
            color: 'blue',
            percentage: (stats?.totalUsers || 0) > 0 ? ((stats?.totalCitizens || 0) / (stats?.totalUsers || 1) * 100).toFixed(1) : 0
        },
        {
            title: 'Government Authorities',
            value: stats?.totalGovtAuthorities || 0,
            icon: FiHome,
            color: 'green',
            percentage: (stats?.totalUsers || 0) > 0 ? ((stats?.totalGovtAuthorities || 0) / (stats?.totalUsers || 1) * 100).toFixed(1) : 0
        },
        {
            title: 'Administrators',
            value: stats?.totalAdmins || 0,
            icon: FiShield,
            color: 'red',
            percentage: (stats?.totalUsers || 0) > 0 ? ((stats?.totalAdmins || 0) / (stats?.totalUsers || 1) * 100).toFixed(1) : 0
        }
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="admin-stats">
            <div className="stats-header">
                <div className="header-content">
                    <h2>Dashboard Overview</h2>
                    <p>System statistics and user activity</p>
                </div>
                <motion.button
                    className="refresh-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiTrendingUp />
                    Refresh Stats
                </motion.button>
            </div>

            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        className={`stat-card stat-${stat.color}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
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

            <div className="stats-content">
                <div className="role-distribution">
                    <div className="section-header">
                        <h3>User Role Distribution</h3>
                        <p>Breakdown of users by role</p>
                    </div>
                    <div className="role-stats">
                        {roleStats.map((role, index) => (
                            <motion.div
                                key={role.title}
                                className={`role-card role-${role.color}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                            >
                                <div className="role-icon">
                                    <role.icon />
                                </div>
                                <div className="role-info">
                                    <h4>{role.value}</h4>
                                    <p>{role.title}</p>
                                    <div className="role-percentage">
                                        {role.percentage}% of total users
                                    </div>
                                </div>
                                <div className="role-progress">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${role.percentage}%` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="recent-activity">
                    <div className="section-header">
                        <h3>Recent Registrations</h3>
                        <p>Latest user registrations</p>
                    </div>
                    <div className="activity-list">
                        {(stats?.recentRegistrations || []).length > 0 ? (
                            (stats?.recentRegistrations || []).map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    className="activity-item"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                >
                                    <div className="activity-avatar">
                                        <FiUsers />
                                    </div>
                                    <div className="activity-content">
                                        <h4>{user.firstName} {user.lastName}</h4>
                                        <p>{user.email}</p>
                                        <span className="activity-time">
                                            {formatDate(user.createdAt)}
                                        </span>
                                    </div>
                                    <div className="activity-status">
                                        <span className={`status-badge status-${user.status}`}>
                                            {user.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="empty-activity">
                                <FiUsers className="empty-icon" />
                                <p>No recent registrations</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStats;