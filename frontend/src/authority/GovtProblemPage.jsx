import React, { useEffect, useRef, useState } from 'react'
import styles from './GovtProblemPage.module.css'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { FaArrowLeft, FaSignOutAlt } from 'react-icons/fa'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// fix marker icons
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

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
    if (heatPoints.length > 0) {
      layerRef.current = L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    }
  }, [map, points]);

  return null;
}

const GovtProblemPage = () => {
  const { logout } = useAuth()
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [markersVisible, setMarkersVisible] = useState(false);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/issues`);
        setIssues(res.data || []);
      } catch (err) {
        console.error('Failed to fetch issues', err);
      }
    };
    fetchIssues();
  }, []);

  function MapZoomHandler() {
    useMapEvents({
      zoomend: (e) => {
        const z = e.target.getZoom();
        setMarkersVisible(z >= 13);
      }
    });
    return null;
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <div className={styles.pageBackground}>
      <div className={styles.GovtProblemContainer}>
        <div className={styles.headerRow}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/govt-dashboard')}
          >
            <FaArrowLeft /> Go Back
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
        <h1>Reported Problems & Progress</h1>

        <div className={styles.mapSection}>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            whenCreated={(map) => { mapRef.current = map }}
          >
            {/* Light Map Theme */}
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            />
            <MapZoomHandler />
            <HeatmapLayer points={issues} />

            {markersVisible && issues.map(issue =>
              issue.latitude && issue.longitude ? (
                <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                  <Popup>
                    <div style={{ maxWidth: 300 }}>
                      <h4>Issue #{issue.id}</h4>
                      <p>{issue.description || 'No description available'}</p>
                      {issue.photo && (
                        <img src={issue.photo} alt="evidence" style={{ width: '100%', borderRadius: 6 }} />
                      )}
                      <p><b>Status:</b> {issue.status || 'Pending'}</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>

        <div className={styles.issueList}>
          <h2>All Reported Issues</h2>
          <ol>
            {issues.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: 0.8 }}>No issues found</p>
            ) : (
              issues.map((issue) => (
                <li key={issue.id}>
                  <div className={styles.text}>
                    <p><b>ID:</b> {issue.id}</p>
                    <p><b>Description:</b> {issue.description}</p>
                    <p><b>Status:</b> <span className={`${styles.statusPill} ${styles[`status-${issue.status?.toLowerCase() || 'pending'}`]}`}>{issue.status || 'Pending'}</span></p>
                  </div>
                  <button
                    className="btn btn-outline-info btn-sm"
                    onClick={() => navigate(`/govt-verify/${issue.id}`)}
                  >
                    Verify
                  </button>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>
    </div>
  )
}

export default GovtProblemPage;
