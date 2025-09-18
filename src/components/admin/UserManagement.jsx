import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch,
    FiFilter,
    FiTrash2,
    FiEdit,
    FiEye,
    FiUser,
    FiMail,
    FiMapPin,
    FiHome,
    FiRefreshCw,
    FiX,
    FiCheck,
    FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/auth/all-users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.national_id?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        setFilteredUsers(filtered);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            setDeleting(true);
            await axios.delete(`/api/auth/users/${selectedUser.id}`);

            toast.success('User deleted successfully');
            fetchUsers();
            setShowDeleteModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setSelectedUser(null);
    };

    const getRoleDisplay = (role) => {
        const roleMap = {
            'admin': 'Administrator',
            'govt_authority': 'Government Authority',
            'citizen': 'Citizen'
        };
        return roleMap[role] || role;
    };

    const getStatusDisplay = (status) => {
        const statusMap = {
            'active': 'Active',
            'pending': 'Pending',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'active': 'success',
            'pending': 'warning',
            'rejected': 'danger'
        };
        return colorMap[status] || 'secondary';
    };

    const getRegionDisplay = (region) => {
        if (!region) return 'N/A';
        return region === 'dhaka_north' ? 'Dhaka North' : 'Dhaka South';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="user-management">
                <div className="management-header">
                    <h2>User Management</h2>
                    <div className="loading-skeleton header-skeleton" />
                </div>
                <div className="users-table">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="user-row loading-skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="user-management">
            <div className="management-header">
                <div className="header-content">
                    <h2>User Management</h2>
                    <p>Manage all users in the system</p>
                </div>
                <motion.button
                    className="refresh-btn"
                    onClick={fetchUsers}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                >
                    <FiRefreshCw className={loading ? 'spinning' : ''} />
                    Refresh
                </motion.button>
            </div>

            <div className="filters-section">
                <div className="search-container">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-controls">
                    <div className="filter-group">
                        <label>Role</label>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Administrator</option>
                            <option value="govt_authority">Government Authority</option>
                            <option value="citizen">Citizen</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Status</label>
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

            <div className="users-table-container">
                <div className="table-header">
                    <div className="results-info">
                        <span>
                            Showing {filteredUsers.length} of {users.length} users
                        </span>
                    </div>
                </div>

                <div className="users-table">
                    <div className="table-header-row">
                        <div className="col-user">User</div>
                        <div className="col-role">Role</div>
                        <div className="col-status">Status</div>
                        <div className="col-region">Region</div>
                        <div className="col-joined">Joined</div>
                        <div className="col-actions">Actions</div>
                    </div>

                    <AnimatePresence>
                        {filteredUsers.map((user, index) => (
                            <motion.div
                                key={user.id}
                                className="user-row"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <div className="col-user">
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            <FiUser />
                                        </div>
                                        <div className="user-details">
                                            <h4>{user.firstName} {user.lastName}</h4>
                                            <p className="user-email">
                                                <FiMail />
                                                {user.email}
                                            </p>
                                            {user.national_id && (
                                                <p className="user-id">ID: {user.national_id}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-role">
                                    <span className={`role-badge role-${user.role}`}>
                                        {getRoleDisplay(user.role)}
                                    </span>
                                </div>

                                <div className="col-status">
                                    <span className={`status-badge status-${getStatusColor(user.status)}`}>
                                        {getStatusDisplay(user.status)}
                                    </span>
                                </div>

                                <div className="col-region">
                                    <span className="region-info">
                                        {user.region ? (
                                            <>
                                                <FiMapPin />
                                                {getRegionDisplay(user.region)}
                                            </>
                                        ) : (
                                            'N/A'
                                        )}
                                    </span>
                                    {user.department && (
                                        <span className="department-info">
                                            <FiHome />
                                            {user.department}
                                        </span>
                                    )}
                                </div>

                                <div className="col-joined">
                                    <span className="join-date">
                                        {formatDate(user.createdAt)}
                                    </span>
                                </div>

                                <div className="col-actions">
                                    <div className="action-buttons">
                                        <motion.button
                                            className="action-btn view-btn"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title="View Details"
                                        >
                                            <FiEye />
                                        </motion.button>
                                        <motion.button
                                            className="action-btn edit-btn"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title="Edit User"
                                        >
                                            <FiEdit />
                                        </motion.button>
                                        <motion.button
                                            className="action-btn delete-btn"
                                            onClick={() => openDeleteModal(user)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title="Delete User"
                                        >
                                            <FiTrash2 />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredUsers.length === 0 && (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="empty-icon">👥</div>
                        <h3>No Users Found</h3>
                        <p>No users match your current search and filter criteria.</p>
                    </motion.div>
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
                        onClick={closeDeleteModal}
                    >
                        <motion.div
                            className="modal-content delete-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <div className="warning-icon">
                                    <FiAlertTriangle />
                                </div>
                                <h3>Delete User</h3>
                                <button className="close-btn" onClick={closeDeleteModal}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body">
                                <p>
                                    Are you sure you want to delete{' '}
                                    <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>?
                                </p>
                                <p className="warning-text">
                                    This action cannot be undone. All user data will be permanently removed.
                                </p>
                            </div>

                            <div className="modal-footer">
                                <motion.button
                                    className="modal-btn cancel-btn"
                                    onClick={closeDeleteModal}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiX />
                                    Cancel
                                </motion.button>
                                <motion.button
                                    className="modal-btn delete-btn"
                                    onClick={handleDeleteUser}
                                    disabled={deleting}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {deleting ? (
                                        <FiRefreshCw className="spinning" />
                                    ) : (
                                        <FiTrash2 />
                                    )}
                                    {deleting ? 'Deleting...' : 'Delete User'}
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
