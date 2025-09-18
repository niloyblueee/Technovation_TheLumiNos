import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUsers,
    FiSearch,
    FiFilter,
    FiTrash2,
    FiEdit,
    FiEye,
    FiMail,
    FiHash,
    FiUser,
    FiHome,
    FiShield,
    FiCheckCircle,
    FiXCircle,
    FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './UserManagement.css';

const UserManagement = ({ users, onUpdateStatus, onDeleteUser }) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.national_id.includes(searchTerm);

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleDeleteUser = async (userId) => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            onDeleteUser(userId);
            setShowDeleteModal(false);
            setSelectedUser(null);
            toast.success('User deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            onUpdateStatus(userId, newStatus);
            toast.success(`User status updated to ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update user status');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <FiShield className="role-icon admin" />;
            case 'govt_authority': return <FiHome className="role-icon govt" />;
            case 'citizen': return <FiUser className="role-icon citizen" />;
            default: return <FiUser className="role-icon" />;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <FiCheckCircle className="status-icon active" />;
            case 'pending': return <FiClock className="status-icon pending" />;
            case 'rejected': return <FiXCircle className="status-icon rejected" />;
            default: return <FiClock className="status-icon" />;
        }
    };

    const getRegionLabel = (region) => {
        return region === 'dhaka_north' ? 'Dhaka North' : 'Dhaka South';
    };

    return (
        <div className="user-management">
            <div className="management-header">
                <div className="header-content">
                    <h2>User Management</h2>
                    <p>Manage all users in the system</p>
                </div>
                <div className="user-stats">
                    <div className="stat-item">
                        <FiUsers className="stat-icon" />
                        <span>{users.length} Total Users</span>
                    </div>
                </div>
            </div>

            <div className="management-filters">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or national ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-controls">
                    <div className="filter-group">
                        <FiFilter className="filter-icon" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Administrators</option>
                            <option value="govt_authority">Government Authorities</option>
                            <option value="citizen">Citizens</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="users-content">
                {filteredUsers.length === 0 ? (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <FiUsers className="empty-icon" />
                        <h3>No Users Found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                    </motion.div>
                ) : (
                    <div className="users-list">
                        <AnimatePresence>
                            {filteredUsers.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    className="user-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="user-header">
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div className="user-details">
                                                <h3>{user.firstName} {user.lastName}</h3>
                                                <p className="user-email">
                                                    <FiMail className="icon" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="user-status">
                                            <span className={`status-badge ${user.status}`}>
                                                {getStatusIcon(user.status)}
                                                {user.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="user-details-grid">
                                        <div className="detail-item">
                                            <FiHash className="detail-icon" />
                                            <span className="detail-label">National ID:</span>
                                            <span className="detail-value">{user.national_id}</span>
                                        </div>

                                        <div className="detail-item">
                                            <FiUser className="detail-icon" />
                                            <span className="detail-label">Sex:</span>
                                            <span className="detail-value">{user.sex}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Role:</span>
                                            <span className="detail-value role-badge">{user.role}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Joined:</span>
                                            <span className="detail-value">{formatDate(user.createdAt)}</span>
                                        </div>

                                        {user.department && (
                                            <div className="detail-item">
                                                <span className="detail-label">Department:</span>
                                                <span className="detail-value">{user.department}</span>
                                            </div>
                                        )}

                                        {user.region && (
                                            <div className="detail-item">
                                                <span className="detail-label">Region:</span>
                                                <span className="detail-value">{getRegionLabel(user.region)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="user-actions">
                                        <motion.button
                                            className="action-btn view-btn"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiEye />
                                            View
                                        </motion.button>

                                        {user.role !== 'admin' && (
                                            <>
                                                {user.status === 'pending' && (
                                                    <>
                                                        <motion.button
                                                            className="action-btn approve-btn"
                                                            onClick={() => handleStatusChange(user.id, 'active')}
                                                            disabled={loading}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <FiCheckCircle />
                                                            Approve
                                                        </motion.button>
                                                        <motion.button
                                                            className="action-btn reject-btn"
                                                            onClick={() => handleStatusChange(user.id, 'rejected')}
                                                            disabled={loading}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <FiXCircle />
                                                            Reject
                                                        </motion.button>
                                                    </>
                                                )}

                                                <motion.button
                                                    className="action-btn delete-btn"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    disabled={loading}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <FiTrash2 />
                                                    Delete
                                                </motion.button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            className="delete-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Delete User</h3>
                                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                            </div>

                            <div className="modal-content">
                                <div className="user-preview">
                                    <div className="user-avatar">
                                        {getRoleIcon(selectedUser.role)}
                                    </div>
                                    <div className="user-info">
                                        <h4>{selectedUser.firstName} {selectedUser.lastName}</h4>
                                        <p>{selectedUser.email}</p>
                                        <span className="role-badge">{selectedUser.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <motion.button
                                    className="modal-btn cancel-btn"
                                    onClick={() => setShowDeleteModal(false)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    className="modal-btn delete-btn"
                                    onClick={() => handleDeleteUser(selectedUser.id)}
                                    disabled={loading}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {loading ? 'Deleting...' : 'Delete User'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;