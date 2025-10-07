// IssueSubmissionWithMap.jsx
// React component (Vite + JavaScript friendly) with browser geolocation + draggable Leaflet map marker
// Usage (Vite + React):
// 1. npm install react-leaflet leaflet
// 2. In your src/main.jsx import global CSS: import 'leaflet/dist/leaflet.css';
// 3. Place this file in src/components/ and import it where you need it.

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './IssueSubmission.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';


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

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loggedInUserNumber = user?.phone_number || '';

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

  // helpers: read file as dataURL and compress to <= 1MB (approx) using canvas
  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => resolve(fr.result);
      fr.readAsDataURL(file);
    });

  const compressDataUrl = async (dataUrl, mime = 'image/jpeg', maxBytes = 1_000_000) => {
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    // scale down if very large to help meet size target
    const MAX_DIM = 1600;
    let { width, height } = img;
    if (Math.max(width, height) > MAX_DIM) {
      //const ratio = MAX_DIM / Math.max(width, height);
      width = 300;
      height = 400;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // progressively lower quality until under size or minimum quality reached
    let quality = 0.92;
    const minQuality = 0.35;
    while (quality >= minQuality) {
      const blob = await new Promise((res) => canvas.toBlob(res, mime, quality));
      if (!blob) break;
      if (blob.size <= maxBytes || quality <= minQuality) {
        // convert blob back to dataURL
        const result = await new Promise((res, rej) => {
          const fr = new FileReader();
          fr.onerror = rej;
          fr.onload = () => res(fr.result);
          fr.readAsDataURL(blob);
        });
        return result;
      }
      quality -= 0.08;
    }

    // fallback: return original
    return dataUrl;
  };

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    // accept any image MIME
    if (!f.type || !f.type.startsWith('image/')) {
      alert('Please upload an image file (any common photo format).');
      return;
    }

    try {
      const originalDataUrl = await readFileAsDataUrl(f);
      // convert PNG/other -> jpeg for better compression if needed
      const targetMime = f.type === 'image/jpeg' ? 'image/jpeg' : 'image/jpeg';
      const compressedDataUrl = await compressDataUrl(originalDataUrl, targetMime, 1_000_000);
      // store only the data URL string (suitable for storing in MySQL TEXT/BLOB)
      setFile(compressedDataUrl);
    } catch (err) {
      console.error('Image processing failed', err);
      alert('Failed to process the image. Please try a different file.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Problem description cannot be empty.');
      return;
    }

    if (!loggedInUserNumber) {
      alert('Your phone number is missing from your profile. Please add it to your account before submitting an issue.');
      return;
    }

    const jsonPayload = {
      Sender: loggedInUserNumber,
      Coordinate: location ? `${location.latitude},${location.longitude}` : '',
      Description: description,
      // Photo is the base64 data URL string (no file name)
      Photo: file ? file : '',
      Emergency: isEmergency,
      status: 'pending',
    };

    setSubmittedData(jsonPayload);
    console.log(JSON.stringify(jsonPayload, null, 2));

    const addIssueToServer = async () => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/submit-issue`, {
          phone_number: loggedInUserNumber,
          coordinate: jsonPayload.Coordinate,
          description: jsonPayload.Description,
          photo: jsonPayload.Photo,
          emergency: jsonPayload.Emergency,
          status: jsonPayload.status,
        });
        console.log('Issue submitted successfully:', response.data);
      } catch (error) {
        console.error('Error submitting issueeee:', error);
      }
    };
    addIssueToServer();
  };

  return (
    <div className="app-container">
      <div className="form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="form-title" style={{ margin: 0 }}>Issue Submission (with live location)</h1>
          <button
            type="button"
            className="file-upload-button"
            onClick={() => { logout(); navigate('/auth'); }}
          >
            Logout
          </button>
        </div>

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
            <label className="form-label">Photo Evidence</label>
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
                accept="image/*"
              />
              {file && (
                <img
                  src={file}
                  alt="preview"
                  style={{ width: 120, height: 'auto', borderRadius: 6, marginLeft: 8 }}
                />
              )}
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
