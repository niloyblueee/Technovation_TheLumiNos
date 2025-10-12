import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './IssueSubmission.css';
import CitizenNav from './CitizenNav';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

// Vite-friendly asset imports for Leaflet's default icon images
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// ----- CONFIG: change this to restrict to your region (lat, lng)
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

  const { user } = useAuth();
  const navigate = useNavigate();
  const loggedInUserNumber = user?.phone_number || '';

  const getLiveLocation = (options = { enableHighAccuracy: true, timeout: 10000 }) => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser.');
      const fallback = { latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] };
      setLocation(fallback);
      setMapCenter({ lat: fallback.latitude, lng: fallback.longitude });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const clamped = clampToBounds(latitude, longitude, REGION_BOUNDS);
        setLocation(clamped);
        setMapCenter({ lat: clamped.latitude, lng: clamped.longitude });
      },
      (err) => {
        console.error('Geolocation error', err);
        setGeoError(err.message || 'Unable to fetch location (permission denied or timeout).');
        const fallback = { latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] };
        setLocation(fallback);
        setMapCenter({ lat: fallback.latitude, lng: fallback.longitude });
      },
      options,
    );
  };

  useEffect(() => {
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

    const MAX_DIM = 1600;
    let { width, height } = img;
    if (Math.max(width, height) > MAX_DIM) {
      width = 300;
      height = 400;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.92;
    const minQuality = 0.35;
    while (quality >= minQuality) {
      const blob = await new Promise((res) => canvas.toBlob(res, mime, quality));
      if (!blob) break;
      if (blob.size <= maxBytes || quality <= minQuality) {
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

    return dataUrl;
  };

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (!f.type || !f.type.startsWith('image/')) {
      alert('Please upload an image file (any common photo format).');
      return;
    }

    try {
      const originalDataUrl = await readFileAsDataUrl(f);
      const targetMime = f.type === 'image/jpeg' ? 'image/jpeg' : 'image/jpeg';
      const compressedDataUrl = await compressDataUrl(originalDataUrl, targetMime, 1_000_000);
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
        navigate('/trackprogress');
      } catch (error) {
        console.error('Error submitting issue:', error);
      }
    };
    addIssueToServer();
  };

  const coordinateDisplay = location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Not selected';

  return (
    <>
      <CitizenNav />
      <div className="app-container citizen-content">
        <div className="issue-layout">
          <header className="issue-header">
            <div className="issue-heading">
              <h1 className="form-title">Report An Issue</h1>
              <p className="form-subtitle">Submit community problems with precise details so authorities can act quickly.</p>
            </div>
          </header>

          <div className="issue-body">
            <form onSubmit={handleSubmit} className="form-card">
              <section className="form-section">
                <div className="section-heading">
                  <label className="form-label">Problem Type</label>
                  <span className="section-hint">Choose the urgency level</span>
                </div>
                <div className="button-group">
                  <button
                    type="button"
                    onClick={() => setIsEmergency(true)}
                    className={`toggle-pill ${isEmergency ? 'selected' : ''}`}
                  >
                    Emergency
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEmergency(false)}
                    className={`toggle-pill ${!isEmergency ? 'selected' : ''}`}
                  >
                    Normal
                  </button>
                </div>
              </section>

              <section className="form-section">
                <div className="section-heading">
                  <label className="form-label">Location Coordinate</label>
                  <span className="section-hint">Auto-detected or choose from map</span>
                </div>
                <div className="field-with-actions">
                  <input
                    type="text"
                    value={location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Click to fetch location...'}
                    onChange={handleLocationChange}
                    onClick={() => { setShowMap(true); getLiveLocation(); }}
                    className="input-field"
                    readOnly={false}
                  />
                  <button type="button" className="ghost-button" onClick={() => { getLiveLocation(); setShowMap(true); }}>
                    Use current location
                  </button>
                </div>
                <p className="help-text">{geoError ? `Error: ${geoError}` : 'Fine-tune by dragging the pin on the map.'}</p>
              </section>

              {showMap && location && (
                <section className="form-section">
                  <div className="map-wrapper">
                    <MapContainer
                      center={[mapCenter.lat, mapCenter.lng]}
                      zoom={15}
                      className="map"
                      whenCreated={(map) => {
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
                    <div className="map-actions">
                      <button type="button" className="ghost-button" onClick={() => { setShowMap(false); }}>
                        Confirm location
                      </button>
                      <button type="button" className="ghost-button" onClick={() => { setShowMap(false); setLocation(null); }}>
                        Reset
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <section className="form-section">
                <div className="section-heading">
                  <label htmlFor="description" className="form-label">
                    Problem Description
                  </label>
                  <span className="section-hint">Share key facts and impact</span>
                </div>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field textarea-field"
                  rows="4"
                  placeholder="Include location details, severity, and any context that helps responders."
                  required
                ></textarea>
              </section>

              <section className="form-section">
                <div className="section-heading">
                  <label className="form-label">Photo Evidence</label>
                  <span className="section-hint">Optional, but helps prioritise</span>
                </div>
                <div className="file-upload-group">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="ghost-button"
                  >
                    Attach photo
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
                      className="preview-image"
                    />
                  )}
                </div>
              </section>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  Submit Issue
                </button>
              </div>
            </form>

            <aside className="side-panel">
              <div className="side-card">
                <h2>Submission Tips</h2>
                <ul>
                  <li>Confirm your coordinates before submitting.</li>
                  <li>Attach clear photos to speed up verification.</li>
                  <li>Provide contact info if authorities need follow-up.</li>
                </ul>
              </div>
              {submittedData && (
                <div className="side-card">
                  <h2>Payload Preview</h2>
                  <pre className="submitted-data-code">{JSON.stringify(submittedData, null, 2)}</pre>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default IssueSubmissionWithMap;