import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaCheckCircle, FaClock, FaExclamationTriangle, FaFireAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './FireIssueDetails.module.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const FireIssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resolving, setResolving] = useState(false);
    const API_BASE = useMemo(() => import.meta.env.VITE_API_URL || 'http://localhost:5000', []);
    const mapRef = useRef(null);

    const fetchIssue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_BASE}/api/issues/${id}`);
            const departments = Array.isArray(data.assigned_departments)
                ? data.assigned_departments.map((dept) => String(dept).toLowerCase())
                : typeof data.assigned_department === 'string'
                    ? data.assigned_department.split(',').map((dept) => dept.trim().toLowerCase())
                    : [];

            if (!departments.includes('fire')) {
                toast.error('This incident is not assigned to the fire department.');
                navigate('/fire', { replace: true });
                return;
            }

            setIssue(data);
        } catch (err) {
            console.error('Failed to load fire issue details', err);
            setError('Could not load the incident details.');
        } finally {
            setLoading(false);
        }
    }, [API_BASE, id, navigate]);

    useEffect(() => {
        fetchIssue();
    }, [fetchIssue]);

    useEffect(() => {
        if (issue && issue.latitude && issue.longitude && mapRef.current) {
            mapRef.current.setView([issue.latitude, issue.longitude], 15);
        }
    }, [issue]);

    const handleResolve = async () => {
        if (!issue) return;
        setResolving(true);
        try {
            await axios.post(`${API_BASE}/api/issues/${issue.id}/resolve`);
            toast.success(`Incident #${issue.id} marked as contained.`);
            navigate('/fire', { replace: true });
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to resolve incident.';
            toast.error(message);
        } finally {
            setResolving(false);
        }
    };

    const renderStatus = () => {
        if (!issue) return null;
        if (issue.status === 'resolved') {
            return (
                <span className={`${styles.status} ${styles.statusResolved}`}>
                    <FaCheckCircle /> Contained
                </span>
            );
        }
        if (issue.emergency) {
            return (
                <span className={`${styles.status} ${styles.statusEmergency}`}>
                    <FaExclamationTriangle /> Emergency
                </span>
            );
        }
        return (
            <span className={styles.status}>
                <FaClock /> In progress
            </span>
        );
    };

    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner} />
                <span>Loading incident details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorScreen}>
                <p>{error}</p>
                <button onClick={fetchIssue}>Retry</button>
            </div>
        );
    }

    if (!issue) {
        return null;
    }

    return (
        <div className={styles.wrapper}>
            <motion.header
                className={styles.header}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
            >
                <button className={styles.backButton} onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Back to dashboard
                </button>
                {renderStatus()}
            </motion.header>

            <motion.main
                className={styles.content}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05, ease: 'easeOut' }}
            >
                <div className={styles.primaryInfo}>
                    <h1>Incident #{issue.id}</h1>
                    <p className={styles.description}>{issue.description || 'No description provided.'}</p>
                    <div className={styles.metaGrid}>
                        <div>
                            <span className={styles.metaLabel}>Reported</span>
                            <span className={styles.metaValue}>{issue.created_at ? new Date(issue.created_at).toLocaleString() : 'Unknown'}</span>
                        </div>
                        <div>
                            <span className={styles.metaLabel}>Emergency</span>
                            <span className={styles.metaValue}>{issue.emergency ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                            <span className={styles.metaLabel}>Phone</span>
                            <span className={styles.metaValue}>{issue.phone_number || 'Not provided'}</span>
                        </div>
                        <div>
                            <span className={styles.metaLabel}>Departments</span>
                            <span className={styles.metaValue}>
                                {(issue.assigned_departments || []).join(', ') || issue.assigned_department || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.contentGrid}>
                    <div className={styles.mapSection}>
                        <h2><FaMapMarkerAlt /> Incident Location</h2>
                        <div className={styles.mapContainer}>
                            {issue.latitude && issue.longitude ? (
                                <MapContainer
                                    center={[issue.latitude, issue.longitude]}
                                    zoom={14}
                                    style={{ width: '100%', height: '100%' }}
                                    whenCreated={(mapInstance) => {
                                        mapRef.current = mapInstance;
                                    }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution="&copy; OpenStreetMap contributors"
                                    />
                                    <Marker position={[issue.latitude, issue.longitude]} />
                                </MapContainer>
                            ) : (
                                <div className={styles.noMap}>No coordinate data available.</div>
                            )}
                        </div>
                    </div>

                    {issue.photo ? (
                        <div className={styles.mediaSection}>
                            <h2><FaFireAlt /> Evidence Snapshot</h2>
                            <div className={styles.photoFrame}>
                                <img src={issue.photo} alt={`Incident ${issue.id}`} />
                            </div>
                        </div>
                    ) : null}
                </div>

                {issue.related_issues && issue.related_issues.length > 0 ? (
                    <section className={styles.relatedSection}>
                        <h3>Linked Reports</h3>
                        <div className={styles.relatedGrid}>
                            {issue.related_issues.map((related) => (
                                <div key={related.id} className={styles.relatedCard}>
                                    <span className={styles.relatedId}>#{related.id}</span>
                                    <p>{related.description || 'No description.'}</p>
                                    <span>{related.created_at ? new Date(related.created_at).toLocaleString() : 'Unknown time'}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}
            </motion.main>

            <motion.footer
                className={styles.footer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            >
                <button
                    className={styles.resolveButton}
                    onClick={handleResolve}
                    disabled={issue.status === 'resolved' || resolving}
                >
                    <FaCheckCircle /> {issue.status === 'resolved' ? 'Already Contained' : resolving ? 'Marking...' : 'Mark as Contained'}
                </button>
            </motion.footer>
        </div>
    );
};

export default FireIssueDetails;
