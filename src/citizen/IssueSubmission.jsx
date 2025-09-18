import React, { useState, useRef, useEffect } from 'react';
import './IssueSubmission.css';

const IssueSubmission = () => {
  const [isEmergency, setIsEmergency] = useState(false);
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const fileInputRef = useRef(null);
  
  const loggedInUserNumber = '+8801731481414';

  const getLiveLocation = () => {
    const fakeLocation = {
      latitude: 23.8103,
      longitude: 90.4125
    };
    setLocation(fakeLocation);
  };

  useEffect(() => {
    getLiveLocation();
  }, []);

  const handleLocationChange = (e) => {
    const [lat, lon] = e.target.value.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lon)) {
      setLocation({ latitude: lat, longitude: lon });
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
      Emergency: isEmergency
    };

    setSubmittedData(jsonPayload);
    console.log(JSON.stringify(jsonPayload, null, 2));
  };

  return (
    <div className="app-container">
      <div className="form-card">
        <h1 className="form-title">Issue Submission</h1>

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
              value={location ? `${location.latitude}, ${location.longitude}` : 'Fetching location...'}
              onChange={handleLocationChange}
              className="input-field"
            />
          </div>

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
            <pre className="submitted-data-code">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueSubmission;