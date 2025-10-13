import React, { useState, useEffect } from "react";
import styles from "./GovtRewardPage.module.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const GovtRewardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leaderboard/citizens`);
        if (!cancelled) {
          const rows = resp.data.leaderboard || [];
          const mapped = rows.map((r) => ({
            id: r.id,
            name: `${r.firstName} ${r.lastName}`.trim(),
            points: r.reward_point || 0,
            email: r.email,
            phone_number: r.phone_number,
          }));
          setCitizens(mapped);
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => { cancelled = true; }
  }, []);

  const handleInvite = (citizen) => {
    alert(`Invitation sent to ${citizen.name} for the event!`);
    // here you could integrate API call for sending invite
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>🏆 Reward Dashboard</h1>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>🏆 Reward Dashboard</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className={styles.container}>
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
      <h1 className={styles.title}>🏆 Reward Dashboard</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Reward Points</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {citizens.map((citizen, index) => (
            <tr key={citizen.id}>
              <td data-header="Rank">{index + 1}</td>
              <td data-header="Name">{citizen.name}</td>
              <td data-header="Points">{citizen.points}</td>
              <td data-header="Action">
                <button
                  className={styles.inviteButton}
                  onClick={() => handleInvite(citizen)}
                >
                  Invite to Event
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GovtRewardPage;
