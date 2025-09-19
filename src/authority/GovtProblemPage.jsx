import React, { useEffect, useRef, useState } from 'react'
import styles from './GovtProblemPage.module.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
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


const GovtProblemPage = () => {

  const [issues, setIssues] = useState([])
  const [markersVisible, setMarkersVisible] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const mapRef = useRef(null)
  const selectedMarkerRef = useRef(null)


  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/issues`)
        console.debug('Fetched issues for heatmap:', res.data)
        setIssues(res.data || [])
      } catch (err) {
        console.error('Failed to fetch issues for heatmap', err)
      }
    }
    fetchIssues()
  }, [])
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
  // when a selected issue is set from the list, fly to it and open its popup
  useEffect(() => {
    if (!selectedIssue || !mapRef.current) return;
      let { latitude, longitude } = selectedIssue;
    latitude = Number(latitude);
    longitude = Number(longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    try {
      const currentZoom = typeof mapRef.current.getZoom === 'function' ? mapRef.current.getZoom() : 12;
      const targetZoom = Math.max(currentZoom, 15);
      if (typeof mapRef.current.setView === 'function') {
        mapRef.current.setView([latitude, longitude], targetZoom);
      } else {
        mapRef.current.flyTo([latitude, longitude], targetZoom, { duration: 0.2 });
      }
    } catch (e) {
      // ignore map errors
    }

    // try to open popup after a short delay so Marker is mounted (snappier)
    const t = setTimeout(() => {
      try {
        if (selectedMarkerRef.current && typeof selectedMarkerRef.current.openPopup === 'function') {
          selectedMarkerRef.current.openPopup();
        }
      } catch (e) {
        // ignore
      }
    }, 150);
    return () => clearTimeout(t);
  }, [selectedIssue]);
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Problems</h2>
      </div>

      <div className={styles.body}>
        <div className={styles.heatmap}>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => { mapRef.current = map }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            <MapZoomHandler />
            <MapClickHandler />
            <HeatmapLayer points={issues} />

            {markersVisible && issues.map(issue => (
              issue.latitude && issue.longitude ? (
                <Marker key={issue.id} position={[issue.latitude, issue.longitude]} />
              ) : null
            ))}

            {selectedIssue && selectedIssue.latitude && selectedIssue.longitude && (
              <Marker position={[selectedIssue.latitude, selectedIssue.longitude]} ref={selectedMarkerRef}>
                <Popup>
                  <div style={{ maxWidth: 300 }}>
                    <h4>Issue #{selectedIssue.id}</h4>
                    <p style={{ margin: '6px 0' }}>{selectedIssue.description || 'No description'}</p>
                    {selectedIssue.photo ? (
                      <img src={selectedIssue.photo} alt="evidence" style={{ width: '100%', borderRadius: 6 }} />
                    ) : (
                      <div style={{ color: '#666' }}>No photo provided</div>
                    )}
                    <div style={{ marginTop: 6, fontSize: 12, color: '#444' }}>Distance: {selectedIssue.distance} m</div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div className={styles.issueList}>
          <h4>Issues & Progress</h4>
            {issues.map((issue) => (
              <div
                className={styles.issueRow}
                key={issue.id ?? issue.description}
                onClick={() => setSelectedIssue({ ...issue })}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') { setSelectedIssue({ ...issue }); } }}
              >
                <button className={`${styles.listBtn} btn btn-outline-danger`} aria-label={`Issue ${issue.id}`}>
                  {issue.description ? (issue.description.length > 60 ? issue.description.slice(0, 57) + '...' : issue.description) : `Issue ${issue.id}`}
                </button>
                <span className={styles.progressText}>
                  {issue.status || 'Status unknown'}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default GovtProblemPage
