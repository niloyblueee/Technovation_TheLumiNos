import React, { useEffect, useRef, useState } from 'react';
import styles from './GovtDashboard.module.css';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from 'react-leaflet';
import { FaMapMarkerAlt, FaSearch, FaFilter, FaExclamationTriangle, FaCalendarAlt, FaTrophy, FaSpinner } from 'react-icons/fa';
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import axios from 'axios'

// ensure default marker icons load correctly with Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const DEFAULT_CENTER = [23.80, 90.40]

function HeatmapLayer({ points }) {
  const map = useMapEvents({});
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const heatPoints = points
      .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number')
      .map(p => [p.latitude, p.longitude, 0.5]);
    console.debug('Heat points computed:', heatPoints.length)
    if (typeof L.heatLayer !== 'function') {
      console.warn('leaflet.heat plugin not found. L.heatLayer is', typeof L.heatLayer)
    }
    if (heatPoints.length === 0) return;
    // leaflet.heat expects L.heatLayer
    layerRef.current = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

const GovtDashboard = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [markersVisible, setMarkersVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const mapRef = useRef(null);

  // Stats calculation
  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.priority === 'high').length
  };

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/issues`);
        setIssues(res.data || []);
        setFilteredIssues(res.data || []);
      } catch (err) {
        setError('Failed to fetch issues. Please try again later.');
        console.error('Failed to fetch issues for heatmap', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIssues();
  }, []);

  useEffect(() => {
    let filtered = [...issues];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(issue => 
        issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.id?.toString().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(issue => issue.status === filter);
    }
    
    setFilteredIssues(filtered);
  }, [searchTerm, filter, issues]);

  // toggle markers based on zoom level
  function MapZoomHandler() {
    useMapEvents({
      zoomend: (e) => {
        const z = e.target.getZoom();
        // show markers when zoomed in enough
        setMarkersVisible(z >= 14)
      }
    })
    return null
  }

  // Handle clicks on the map: find nearest issue and show its pin + popup
  function MapClickHandler() {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        if (!issues || issues.length === 0) {
          setSelectedIssue(null);
          return;
        }

        // Haversine distance in meters
        const toRad = (v) => (v * Math.PI) / 180;
        const haversine = (lat1, lon1, lat2, lon2) => {
          const R = 6371000; // meters
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        // choose threshold depending on zoom (looser when zoomed out)
        const z = map.getZoom();
        const threshold = z >= 14 ? 200 : (z >= 12 ? 800 : 2000);

        let nearest = null;
        let nearestDist = Infinity;
        for (const it of issues) {
          if (typeof it.latitude !== 'number' || typeof it.longitude !== 'number') continue;
          const d = haversine(lat, lng, it.latitude, it.longitude);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = it;
          }
        }

        if (nearest && nearestDist <= threshold) {
          setSelectedIssue({ ...nearest, distance: Math.round(nearestDist) });
          // pan a bit so popup is visible
          map.panTo([nearest.latitude, nearest.longitude]);
        } else {
          setSelectedIssue(null);
        }
      }
    });
    return null;
  }

  const StatusBadge = ({ status }) => (
    <span className={`${styles.badge} ${styles[`status-${status}`]}`}>
      {status}
    </span>
  );

  return (
    <div className={styles.wholeContainer}>
      <div className={styles.upperPart}>
        <h1><FaMapMarkerAlt /> Government Dashboard</h1>
      </div>

      <div className={styles.dashboardContent}>
        {/* Stats Panel */}
        <div className={styles.statsPanel}>
          <div className={styles.statCard}>
            <h3>Total Issues</h3>
            <p>{stats.total}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Pending</h3>
            <p className={styles.warning}>{stats.pending}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Resolved</h3>
            <p className={styles.success}>{stats.resolved}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Critical</h3>
            <p className={styles.danger}>{stats.critical}</p>
          </div>
        </div>

        <div className={styles.mapPortion}>
          <div className={styles.mapContainer}>
            {/* Search and Filter Panel */}
            <div className={styles.searchPanel}>
              <div className={styles.searchBox}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.filterBox}>
                <FaFilter className={styles.filterIcon} />
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Issues</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {isLoading && (
              <div className={styles.loadingOverlay}>
                <FaSpinner className={styles.spinner} />
                <p>Loading map data...</p>
              </div>
            )}
            
            {error && (
              <div className={styles.errorOverlay}>
                <FaExclamationTriangle />
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}

            <div className={styles.map}>
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                whenCreated={(map) => { mapRef.current = map }}
                zoomControl={false}
              >
                <ZoomControl position="topright" />
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />

                <MapZoomHandler />
                <MapClickHandler />
                <HeatmapLayer points={filteredIssues} />

                {markersVisible && filteredIssues.map(issue => (
                  issue.latitude && issue.longitude ? (
                    <Marker 
                      key={issue.id} 
                      position={[issue.latitude, issue.longitude]}
                    />
                  ) : null
                ))}

                {selectedIssue && selectedIssue.latitude && selectedIssue.longitude && (
                  <Marker position={[selectedIssue.latitude, selectedIssue.longitude]}>
                    <Popup>
                      <div className={styles.issuePopup}>
                        <h4>
                          Issue #{selectedIssue.id}
                          <StatusBadge status={selectedIssue.status || 'pending'} />
                        </h4>
                        <p>{selectedIssue.description || 'No description'}</p>
                        {selectedIssue.photo ? (
                          <div className={styles.popupImage}>
                            <img src={selectedIssue.photo} alt="evidence" />
                          </div>
                        ) : (
                          <div className={styles.noPhoto}>No photo provided</div>
                        )}
                        <div className={styles.popupFooter}>
                          <span>Priority: {selectedIssue.priority || 'medium'}</span>
                          <span>{selectedIssue.distance}m away</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>

          <div className={styles.adminButton}>
            <button 
              className={`${styles.actionButton} ${styles.problemsButton}`} 
              onClick={() => navigate('/govt-problem-page')}
            >
              <FaExclamationTriangle />
              <span>Problems</span>
            </button>
            <button 
              className={`${styles.actionButton} ${styles.eventsButton}`}
              onClick={() => navigate('/govt-events')}
            >
              <FaCalendarAlt />
              <span>Events</span>
            </button>
            <button 
              className={`${styles.actionButton} ${styles.rewardButton}`}
              onClick={() => navigate('/govt-reward-page')}
            >
              <FaTrophy />
              <span>Reward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GovtDashboard;
