// IssueSubmissionWithMap.jsx
// React component (Vite + JavaScript friendly) with browser geolocation + draggable Leaflet map marker
// Usage (Vite + React):
// 1. npm install react-leaflet leaflet
// 2. In your src/main.jsx import global CSS: import 'leaflet/dist/leaflet.css';
// 3. Place this file in src/components/ and import it where you need it.

import React, { useState, useRef, useEffect } from 'react';
import './IssueSubmission.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Vite-friendly asset imports for Leaflet's default icon images
// Vite will turn these into proper URLs at build time.
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// ----- CONFIG: change this to restrict to your region (lat, lng)
// Example bounds roughly around Dhaka — adjust to your city's tighter box.
const REGION_BOUNDS = L.latLngBounds(
  L.latLng(23.7000, 90.3500), // southwest (minLat, minLng)
  L.latLng(23.9400, 90.5400)  // northeast (maxLat, maxLng)
);

const DEFAULT_CENTER = [
  (REGION_BOUNDS.getSouth() + REGION_BOUNDS.getNorth()) / 2,
  (REGION_BOUNDS.getWest() + REGION_BOUNDS.getEast()) / 2,
];

const clampToBounds = (lat, lng, bounds) => {
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  const west = bounds.getWest();
  const east = bounds.getEast();
  const clampedLat = Math.max(south, Math.min(north, lat));
  const clampedLng = Math.max(west, Math.min(east, lng));
  return { latitude: clampedLat, longitude: clampedLng };
};

function DraggableMarker({ position, setPosition, bounds }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      // Allow user to click on map to move marker
      const { lat, lng } = e.latlng;
      const clamped = clampToBounds(lat, lng, bounds);
      setPosition(clamped);
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        const clamped = clampToBounds(lat, lng, bounds);
        // If drag ended outside bounds, snap back inside
        if (clamped.latitude !== lat || clamped.longitude !== lng) {
          marker.setLatLng([clamped.latitude, clamped.longitude]);
        }
        setPosition(clamped);
      }
    },
  };

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={[position.latitude, position.longitude]}
      ref={markerRef}
    />
  );
}

const IssueSubmissionWithMap = () => {
  const [isEmergency, setIsEmergency] = useState(false);
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
  const [geoError, setGeoError] = useState(null);
  const fileInputRef = useRef(null);

  const loggedInUserNumber = '+8801731481414';

  // Attempt to get the current location using the browser Geolocation API
  const getLiveLocation = (options = { enableHighAccuracy: true, timeout: 10000 }) => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser.');
      // fallback to default center in region bounds
      const fallback = { latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] };
      setLocation(fallback);
      setMapCenter({ lat: fallback.latitude, lng: fallback.longitude });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // clamp to the allowed region
        const clamped = clampToBounds(latitude, longitude, REGION_BOUNDS);
        setLocation(clamped);
        setMapCenter({ lat: clamped.latitude, lng: clamped.longitude });
      },
      (err) => {
        console.error('Geolocation error', err);
        setGeoError(err.message || 'Unable to fetch location (permission denied or timeout).');
        // fallback inside region bounds
        const fallback = { latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] };
        setLocation(fallback);
        setMapCenter({ lat: fallback.latitude, lng: fallback.longitude });
      },
      options,
    );
  };

  useEffect(() => {
    // auto-get location on mount (optional). You can remove this if you want
    // to only get location when user clicks the input.
    getLiveLocation();
  }, []);

  const handleLocationChange = (e) => {
    const [lat, lon] = e.target.value.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lon)) {
      const clamped = clampToBounds(lat, lon, REGION_BOUNDS);
      setLocation(clamped);
      setMapCenter({ lat: clamped.latitude, lng: clamped.longitude });
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Problem description cannot be empty.');
      return;
    }

    const jsonPayload = {
      Sender: loggedInUserNumber,
      Coordinate: location ? `${location.latitude},${location.longitude}` : '',
      Description: description,
      Photo: file ? file.name : '',
      Video: file ? file.name : '',
      Emergency: isEmergency,
    };

    setSubmittedData(jsonPayload);
    console.log(JSON.stringify(jsonPayload, null, 2));
  };

  return (
    <div className="app-container">
      <div className="form-card">
        <h1 className="form-title">Issue Submission (with live location)</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label className="form-label">Problem Type</label>
            <div className="button-group">
              <button
                type="button"
                onClick={() => setIsEmergency(true)}
                className={`button-emergency ${isEmergency ? 'active' : ''}`}
              >
                Emergency
              </button>
              <button
                type="button"
                onClick={() => setIsEmergency(false)}
                className={`button-normal ${!isEmergency ? 'active' : ''}`}
              >
                Normal Problems
              </button>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Location Coordinate</label>
            <input
              type="text"
              value={location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Click to fetch location...'}
              onChange={handleLocationChange}
              onClick={() => { setShowMap(true); getLiveLocation(); }}
              className="input-field"
              readOnly={false} // allow manual edits as well
            />
            <div style={{ marginTop: 8 }}>
              <button type="button" className="file-upload-button" onClick={() => { getLiveLocation(); setShowMap(true); }}>
                Use current location / open map
              </button>
              <small style={{ marginLeft: 8, color: '#666' }}>
                {geoError ? `Error: ${geoError}` : 'You can drag the marker on the map to fine-tune.'}
              </small>
            </div>
          </div>

          {/* Map area (togglable) */}
          {showMap && location && (
            <div className="form-section" style={{ height: 360 }}>
              <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                whenCreated={(map) => {
                  // enforce bounds so user cannot pan out of the region
                  map.setMaxBounds(REGION_BOUNDS);
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <DraggableMarker
                  position={location}
                  setPosition={(pos) => {
                    setLocation(pos);
                  }}
                  bounds={REGION_BOUNDS}
                />

              </MapContainer>

              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button type="button" className="file-upload-button" onClick={() => { setShowMap(false); }}>
                  Confirm location
                </button>
                <button type="button" className="file-upload-button" onClick={() => { setShowMap(false); setLocation(null); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="form-section">
            <label htmlFor="description" className="form-label">
              Problem Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field textarea-field"
              rows="4"
              placeholder="Describe the problem in detail..."
              required
            ></textarea>
          </div>

          <div className="form-section">
            <label className="form-label">Photo/Video Evidence</label>
            <div className="file-upload-group">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="file-upload-button"
              >
                Upload File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden-file-input"
                accept="image/*,video/*"
              />
              {file && <span className="file-name">{file.name}</span>}
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
          >
            Submit
          </button>
        </form>

        {submittedData && (
          <div className="submitted-data-container">
            <h2 className="submitted-data-title">Submitted JSON Data:</h2>
            <pre className="submitted-data-code">{JSON.stringify(submittedData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueSubmissionWithMap;
