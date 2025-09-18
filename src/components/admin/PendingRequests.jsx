import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiUser,
    FiMail,
    FiMapPin,
    FiHome,
    FiClock,
    FiCheck,
    FiX,
    FiEye,
    FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './PendingRequests.css';

const PendingRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/auth/pending-govt-authorities');
            setRequests(response.data.pendingUsers || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            toast.error('Failed to fetch pending requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            setProcessing(userId);
            await axios.post(`/api/auth/approve-govt-authority/${userId}`, {
                action: 'approve'
            });

            toast.success('Government authority approved successfully');
            fetchPendingRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            toast.error('Failed to approve request');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (userId) => {
        try {
            setProcessing(userId);
            await axios.post(`/api/auth/approve-govt-authority/${userId}`, {
                action: 'reject'
            });

            toast.success('Government authority rejected');
            fetchPendingRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        } finally {
            setProcessing(null);
        }
    };

    const openModal = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRequest(null);
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

    const getRegionDisplay = (region) => {
        return region === 'dhaka_north' ? 'Dhaka North' : 'Dhaka South';
    };

    if (loading) {
        return (
            <div className="pending-requests">
                <div className="requests-header">
                    <h2>Pending Government Authority Requests</h2>
                    <div className="loading-skeleton header-skeleton" />
                </div>
                <div className="requests-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="request-card loading-skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="pending-requests">
            <div className="requests-header">
                <div className="header-content">
                    <h2>Pending Government Authority Requests</h2>
                    <p>Review and approve government authority registrations</p>
                </div>
                <motion.button
                    className="refresh-btn"
                    onClick={fetchPendingRequests}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                >
                    <FiRefreshCw className={loading ? 'spinning' : ''} />
                    Refresh
                </motion.button>
            </div>

            {requests.length === 0 ? (
                <motion.div
                    className="empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="empty-icon">📋</div>
                    <h3>No Pending Requests</h3>
                    <p>All government authority requests have been processed.</p>
                </motion.div>
            ) : (
                <div className="requests-grid">
                    <AnimatePresence>
                        {requests.map((request, index) => (
                            <motion.div
                                key={request.id}
                                className="request-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="card-header">
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            <FiUser />
                                        </div>
                                        <div className="user-details">
                                            <h3>{request.firstName} {request.lastName}</h3>
                                            <p className="user-email">
                                                <FiMail />
                                                {request.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="request-status pending">
                                        <FiClock />
                                        Pending
                                    </div>
                                </div>

                                <div className="card-content">
                                    <div className="info-row">
                                        <span className="info-label">
                                            <FiHome />
                                            Department
                                        </span>
                                        <span className="info-value">{request.department}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">
                                            <FiMapPin />
                                            Region
                                        </span>
                                        <span className="info-value">{getRegionDisplay(request.region)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">
                                            <FiUser />
                                            National ID
                                        </span>
                                        <span className="info-value">{request.national_id}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">
                                            <FiClock />
                                            Applied
                                        </span>
                                        <span className="info-value">{formatDate(request.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <motion.button
                                        className="action-btn view-btn"
                                        onClick={() => openModal(request)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <FiEye />
                                        View Details
                                    </motion.button>
                                    <div className="approval-actions">
                                        <motion.button
                                            className="action-btn reject-btn"
                                            onClick={() => handleReject(request.id)}
                                            disabled={processing === request.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {processing === request.id ? (
                                                <FiRefreshCw className="spinning" />
                                            ) : (
                                                <FiX />
                                            )}
                                            Reject
                                        </motion.button>
                                        <motion.button
                                            className="action-btn approve-btn"
                                            onClick={() => handleApprove(request.id)}
                                            disabled={processing === request.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {processing === request.id ? (
                                                <FiRefreshCw className="spinning" />
                                            ) : (
                                                <FiCheck />
                                            )}
                                            Approve
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Request Details Modal */}
            <AnimatePresence>
                {showModal && selectedRequest && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Government Authority Request Details</h3>
                                <button className="close-btn" onClick={closeModal}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="detail-section">
                                    <h4>Personal Information</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Name</span>
                                            <span className="detail-value">
                                                {selectedRequest.firstName} {selectedRequest.lastName}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Email</span>
                                            <span className="detail-value">{selectedRequest.email}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">National ID</span>
                                            <span className="detail-value">{selectedRequest.national_id}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Sex</span>
                                            <span className="detail-value capitalize">{selectedRequest.sex}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4>Government Information</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Department</span>
                                            <span className="detail-value">{selectedRequest.department}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Region</span>
                                            <span className="detail-value">{getRegionDisplay(selectedRequest.region)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Applied Date</span>
                                            <span className="detail-value">{formatDate(selectedRequest.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <motion.button
                                    className="modal-btn reject-btn"
                                    onClick={() => {
                                        handleReject(selectedRequest.id);
                                        closeModal();
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiX />
                                    Reject Request
                                </motion.button>
                                <motion.button
                                    className="modal-btn approve-btn"
                                    onClick={() => {
                                        handleApprove(selectedRequest.id);
                                        closeModal();
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FiCheck />
                                    Approve Request
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PendingRequests;
