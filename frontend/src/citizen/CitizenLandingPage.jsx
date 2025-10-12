import React, { useState, useEffect, useRef } from "react";
import './CitizenLandingPage.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUserAlt, FaEnvelope, FaPhone, FaMapMarkedAlt, FaClipboardList, FaTrophy } from 'react-icons/fa';

function CitizenLandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wrapperRef = useRef(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (fetchedRef.current) return;
    const controller = new AbortController();

    const storageKey = user && user.email ? `notifications_read_${user.email}` : 'notifications_read_anonymous';

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const url = `${base.replace(/\/$/, '')}/api/notifications`;
        const res = await fetch(url, {
          signal: controller.signal,
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];

        let readSet = {};
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) readSet = JSON.parse(raw) || {};
        } catch (e) {
          readSet = {};
        }

        const merged = items.map(n => ({ ...n, read: Boolean(readSet[n.id]) }));
        setNotifications(merged);
        fetchedRef.current = true;
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [open, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const persistReadState = (items) => {
    const storageKey = user && user.email ? `notifications_read_${user.email}` : 'notifications_read_anonymous';
    const map = {};
    items.forEach(i => { if (i.read) map[i.id] = true; });
    try {
      localStorage.setItem(storageKey, JSON.stringify(map));
    } catch (e) {
      // ignore storage errors
    }
  };

  if (!user) {
    return (
      <div className="dashboardContainer">
        <div className="innerContainer" style={{ alignItems: 'center', justifyItems: 'center' }}>
          <h2 className="dashboardTitle" style={{ textAlign: 'center' }}>Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboardContainer">
      <div className="innerContainer">
        <header className="topBar">
          <div className="brand">
            <span className="brand-logo">TheLumiNos</span>
            <span className="brand-tag">Citizen Portal</span>
          </div>
          <div className="topBarActions">
            <div className="notifications-wrapper" ref={wrapperRef}>
              <button
                className="notifications"
                onClick={() => setOpen(prev => !prev)}
                aria-expanded={open}
                aria-haspopup="true"
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {open && (
                <div className="notifications-menu" role="menu" aria-label="Notifications">
                  <div className="notifications-menu-header">
                    <strong>Notifications</strong>
                    <button
                      className="mark-read-btn"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setNotifications(prev => {
                          const updated = prev.map(n => ({ ...n, read: true }));
                          persistReadState(updated);
                          return updated;
                        });
                      }}
                    >
                      Mark all read
                    </button>
                  </div>

                  {loading && <div className="notifications-empty">Loading...</div>}
                  {error && <div className="notifications-error">Error: {error}</div>}

                  {!loading && !error && notifications.length === 0 && (
                    <div className="notifications-empty">No notifications</div>
                  )}

                  {!loading && notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.read ? 'read' : 'unread'}`}
                      onClick={() => {
                        setNotifications(prev => {
                          const updated = prev.map(x => x.id === n.id ? { ...x, read: true } : x);
                          persistReadState(updated);
                          return updated;
                        });
                        if (n.path) navigate(n.path);
                      }}
                      role="menuitem"
                      tabIndex={0}
                    >
                      <div className="notification-title">{n.title || n.message}</div>
                      {n.createdAt && <div className="notification-time">{new Date(n.createdAt).toLocaleString()}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              className="logout-btn"
              onClick={() => { logout(); navigate('/auth'); }}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="profileSection">
          <h1 className="dashboardTitle">Welcome {user.firstName + ' ' + user.lastName || 'Citizen'}</h1>
          <div className="citizen-user-info">
            <div className="citizen-user-line">
              <FaUserAlt /> <strong>Name:</strong> {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not provided'}
            </div>
            <div className="citizen-user-line">
              <FaEnvelope /> <strong>Email:</strong> {user.email || 'Not provided'}
            </div>
            <div className="citizen-user-line">
              <FaPhone /> <strong>Phone:</strong> {user.phone_number || 'Not provided'}
            </div>
          </div>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Reports</h3>
            <p>{notifications.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Issues</h3>
            <p>{notifications.filter(n => !n.read).length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Reward Points</h3>
            <p>{user?.reward_points ?? 0}</p>
          </div>
        </div>

        <div className="button-row">
          <button className="TrackProgress" onClick={() => navigate('/trackprogress')}>
            <FaMapMarkedAlt />
            Track Progress
          </button>
          <button className="IssueSubmission" onClick={() => navigate('/issue-submission')}>
            <FaClipboardList />
            Issue Submission
          </button>
          <button className="Contribution" onClick={() => navigate('/contribution')}>
            <FaTrophy />
            Contribution
          </button>
        </div>
      </div>
    </div>
  );
}

export default CitizenLandingPage;