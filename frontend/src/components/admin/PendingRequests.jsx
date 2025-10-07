import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiUser,
    FiMail,
    FiHash,
    FiHome,
    FiBookOpen,
    FiMapPin
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PendingRequests.css';

const PendingRequests = ({ pendingRequests, onApprove, onReject }) => {
    const [loading, setLoading] = useState(false);

    const handleApprove = async (userId) => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            onApprove(userId);
            toast.success('Government authority approved successfully!');
        } catch (error) {
            toast.error('Failed to approve request');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (userId) => {
        setLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            onReject(userId);
            toast.success('Government authority request rejected');
        } catch (error) {
            toast.error('Failed to reject request');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRegionLabel = (region) => {
        return region === 'dhaka_north' ? 'Dhaka North' : 'Dhaka South';
    };

    return (
        <div className="pending-requests">
            <div className="requests-header">
                <div className="header-content">
                    <h2>Pending Government Authority Requests</h2>
                    <p>Review and approve government authority registrations</p>
                </div>
                <div className="requests-stats">
                    <div className="stat-item">
                        <FiClock className="stat-icon" />
                        <span>{pendingRequests.length} Pending</span>
                    </div>
                </div>
            </div>

            <div className="requests-content">
                {pendingRequests.length === 0 ? (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <FiCheckCircle className="empty-icon" />
                        <h3>No Pending Requests</h3>
                        <p>All government authority requests have been processed</p>
                    </motion.div>
                ) : (
                    <div className="requests-list">
                        <AnimatePresence>
                            {pendingRequests.map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    className="request-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -2 }}
                                >
                                    <div className="request-header">
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                <FiUser />
                                            </div>
                                            <div className="user-details">
                                                <h3>{request.firstName} {request.lastName}</h3>
                                                <p className="user-email">
                                                    <FiMail className="icon" />
                                                    {request.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="request-status">
                                            <span className="status-badge pending">
                                                <FiClock />
                                                Pending
                                            </span>
                                        </div>
                                    </div>

                                    <div className="request-details">
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <FiHash className="detail-icon" />
                                                <span className="detail-label">National ID:</span>
                                                <span className="detail-value">{request.national_id}</span>
                                            </div>
                                            <div className="detail-item">
                                                <FiUser className="detail-icon" />
                                                <span className="detail-label">Sex:</span>
                                                <span className="detail-value">{request.sex}</span>
                                            </div>
                                        </div>

                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <FiBookOpen className="detail-icon" />
                                                <span className="detail-label">Department:</span>
                                                <span className="detail-value">{request.department}</span>
                                            </div>
                                            <div className="detail-item">
                                                <FiMapPin className="detail-icon" />
                                                <span className="detail-label">Region:</span>
                                                <span className="detail-value">{getRegionLabel(request.region)}</span>
                                            </div>
                                        </div>

                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <FiClock className="detail-icon" />
                                                <span className="detail-label">Requested:</span>
                                                <span className="detail-value">{formatDate(request.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="request-actions">
                                        <motion.button
                                            className="action-btn approve-btn"
                                            onClick={() => handleApprove(request.id)}
                                            disabled={loading}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiCheckCircle />
                                            Approve
                                        </motion.button>
                                        <motion.button
                                            className="action-btn reject-btn"
                                            onClick={() => handleReject(request.id)}
                                            disabled={loading}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <FiXCircle />
                                            Reject
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingRequests;