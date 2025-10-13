import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
import { FaArrowRight, FaBolt, FaExclamationTriangle, FaPlug, FaRegClock, FaRedo, FaSignOutAlt } from 'react-icons/fa';
import styles from './ElectricityDepartment.module.css';
import { useAuth } from '../contexts/AuthContext';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const DEFAULT_CENTER = [23.80, 90.40];

const HeatmapLayer = ({ points }) => {
    const map = useMapEvents({});
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map) return;
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }

        const heatPoints = points
            .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
            .map((p) => [p.latitude, p.longitude, p.emergency ? 0.95 : 0.6]);

        if (heatPoints.length === 0) return;
        layerRef.current = L.heatLayer(heatPoints, { radius: 28, blur: 22, maxZoom: 17 }).addTo(map);

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, points]);

    return null;
};

const MapZoomHandler = ({ onVisibleChange }) => {
    useMapEvents({
        zoomend: (event) => {
            const zoomLevel = event.target.getZoom();
            onVisibleChange(zoomLevel >= 14);
        },
    });
    return null;
};

const ElectricityDepartment = () => {
    const navigate = useNavigate();
    const { user, loading, logout } = useAuth();
    const [activeIssues, setActiveIssues] = useState([]);
    const [resolvedIssues, setResolvedIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [markersVisible, setMarkersVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const mapRef = useRef(null);
    const API_BASE = useMemo(() => import.meta.env.VITE_API_URL || 'http://localhost:5000', []);

    useEffect(() => {
        if (!loading && user && user.role !== 'electricity') {
            navigate('/');
        }
    }, [loading, user, navigate]);

    const fetchIssues = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_BASE}/api/issues`);
            const electricityIssues = (data || []).filter((issue) => {
                const departments = Array.isArray(issue.assigned_departments)
                    ? issue.assigned_departments.map((dept) => String(dept).toLowerCase())
                    : typeof issue.assigned_department === 'string'
                        ? issue.assigned_department.split(',').map((dept) => dept.trim().toLowerCase())
                        : [];

                return departments.includes('electricity') && ['in_progress', 'resolved'].includes(issue.status);
            });

            const unresolved = electricityIssues.filter((issue) => issue.status !== 'resolved');
            const resolved = electricityIssues.filter((issue) => issue.status === 'resolved');

            setActiveIssues(unresolved);
            setResolvedIssues(resolved);

            if (unresolved.length > 0) {
                setSelectedIssue(unresolved[0]);
            } else if (resolved.length > 0) {
                setSelectedIssue(resolved[0]);
            } else {
                setSelectedIssue(null);
            }
        } catch (err) {
            console.error('Failed to fetch electricity issues', err);
            setError('Unable to load electricity incidents. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    useEffect(() => {
        if (selectedIssue && selectedIssue.latitude && selectedIssue.longitude && mapRef.current) {
            mapRef.current.flyTo([selectedIssue.latitude, selectedIssue.longitude], 14, { duration: 1.1 });
        }
    }, [selectedIssue]);

    const stats = useMemo(() => ({
        active: activeIssues.length,
        resolved: resolvedIssues.length,
        emergency: activeIssues.filter((issue) => issue.emergency).length,
    }), [activeIssues, resolvedIssues]);

    const handleViewDetails = (issueId) => {
        navigate(`/electricity/issues/${issueId}`);
    };

    const handleLogout = useCallback(() => {
        logout();
        navigate('/auth');
    }, [logout, navigate]);

    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <FaRegClock />
                <span>Stabilising grid dashboard...</span>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <motion.header
                className={styles.header}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div>
                    <p className={styles.subtitle}>City Grid Control</p>
                    <h1 className={styles.title}>Electricity Response Center</h1>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.refreshButton} onClick={fetchIssues} disabled={isLoading}>
                        <FaRedo />
                        <span>{isLoading ? 'Refreshing' : 'Refresh Feed'}</span>
                    </button>
                    <button className={styles.logoutButton} onClick={handleLogout}>
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            </motion.header>

            <motion.section
                className={styles.statsRow}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            >
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Active Faults</div>
                    <div className={styles.statValue}>{stats.active}</div>
                    <FaBolt className={styles.statIcon} />
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Restored</div>
                    <div className={styles.statValueResolved}>{stats.resolved}</div>
                    <FaPlug className={styles.statIcon} />
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Critical</div>
                    <div className={styles.statValueAlert}>{stats.emergency}</div>
                    <FaExclamationTriangle className={styles.statIcon} />
                </div>
            </motion.section>

            <div className={styles.grid}>
                <motion.div
                    className={styles.mapCard}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                >
                    <div className={styles.mapHeader}>
                        <div>
                            <h2>Grid Heatmap</h2>
                            <p>Live distribution of electricity disruptions.</p>
                        </div>
                        {selectedIssue ? (
                            <div className={styles.focusChip}>
                                <FaBolt />
                                Tracking #{selectedIssue.id}
                            </div>
                        ) : null}
                    </div>

                    <div className={styles.mapContainer}>
                        {error ? (
                            <div className={styles.errorOverlay}>
                                <p>{error}</p>
                                <button onClick={fetchIssues}>Retry</button>
                            </div>
                        ) : null}

                        {isLoading ? (
                            <div className={styles.loadingOverlay}>
                                <div className={styles.spinner} />
                                <span>Synchronising incidents...</span>
                            </div>
                        ) : null}

                        <MapContainer
                            center={selectedIssue && selectedIssue.latitude && selectedIssue.longitude ? [selectedIssue.latitude, selectedIssue.longitude] : DEFAULT_CENTER}
                            zoom={12}
                            style={{ width: '100%', height: '100%' }}
                            whenCreated={(mapInstance) => {
                                mapRef.current = mapInstance;
                            }}
                            zoomControl={false}
                            className={styles.leafletRoot}
                        >
                            <ZoomControl position="topright" />
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                            <MapZoomHandler onVisibleChange={setMarkersVisible} />
                            <HeatmapLayer points={activeIssues} />

                            {markersVisible && activeIssues.map((issue) => (
                                issue.latitude && issue.longitude ? (
                                    <Marker
                                        key={issue.id}
                                        position={[issue.latitude, issue.longitude]}
                                        eventHandlers={{
                                            click: () => {
                                                setSelectedIssue(issue);
                                            },
                                        }}
                                    >
                                        <Popup>
                                            <div className={styles.popupContent}>
                                                <h3>Incident #{issue.id}</h3>
                                                <p>{issue.description || 'No description provided.'}</p>
                                                <button onClick={() => handleViewDetails(issue.id)}>Open Case</button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ) : null
                            ))}
                        </MapContainer>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.listCard}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
                >
                    <div className={styles.listHeader}>
                        <h2>Active Incidents</h2>
                        <span>{activeIssues.length} case{activeIssues.length === 1 ? '' : 's'}</span>
                    </div>

                    {activeIssues.length === 0 && !isLoading ? (
                        <div className={styles.emptyState}>
                            <p>No active electricity incidents right now.</p>
                        </div>
                    ) : (
                        <div className={styles.issueList}>
                            {activeIssues.map((issue, index) => (
                                <motion.div
                                    key={issue.id}
                                    className={`${styles.issueCard} ${selectedIssue && selectedIssue.id === issue.id ? styles.issueCardActive : ''}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45, delay: index * 0.05, ease: 'easeOut' }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    onClick={() => setSelectedIssue(issue)}
                                >
                                    <div className={styles.issueMeta}>
                                        <span className={styles.issueId}>#{issue.id}</span>
                                        <span className={`${styles.statusBadge} ${issue.emergency ? styles.statusEmergency : ''}`}>
                                            {issue.emergency ? 'Critical' : 'In progress'}
                                        </span>
                                    </div>
                                    <p className={styles.issueDescription}>{issue.description || 'No description provided.'}</p>
                                    <div className={styles.issueFooter}>
                                        <span>{issue.created_at ? new Date(issue.created_at).toLocaleString() : 'Unknown time'}</span>
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDetails(issue.id);
                                        }}>
                                            View Details <FaArrowRight />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            <motion.section
                className={styles.resolvedSection}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            >
                <div className={styles.resolvedHeader}>
                    <h2>Restored Services</h2>
                    <span>{resolvedIssues.length}</span>
                </div>
                {resolvedIssues.length === 0 ? (
                    <div className={styles.emptyState}>No restored cases yet.</div>
                ) : (
                    <div className={styles.resolvedGrid}>
                        {resolvedIssues.map((issue) => (
                            <div key={issue.id} className={styles.resolvedCard}>
                                <div className={styles.resolvedId}>#{issue.id}</div>
                                <p>{issue.description || 'No description provided.'}</p>
                                <span>{issue.created_at ? new Date(issue.created_at).toLocaleString() : 'Unknown time'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </motion.section>
        </div>
    );
};

export default ElectricityDepartment;
