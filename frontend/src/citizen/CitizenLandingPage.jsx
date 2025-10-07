import React, { useState, useEffect, useRef } from "react";
import './CitizenLandingPage.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

    // use per-user storage key so each user has their own read state
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

        // load read set from localStorage
        let readSet = {};
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) readSet = JSON.parse(raw) || {};
        } catch (e) {
          readSet = {};
        }

        // merge read state
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

  // helper to persist read state per-user
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

  return (
    <>
      <div className="dashboardContainer">
        <header className="header">
          <div className="citizen-header-left">
            <h1 className="dashboardTitle">Welcome To Your Dashboard</h1>
            {user && (
              <div className="citizen-user-info">
                <div className="citizen-user-line"><strong>Name:</strong> {user.firstName} {user.lastName}</div>
                <div className="citizen-user-line"><strong>Email:</strong> {user.email || 'Not provided'}</div>
                <div className="citizen-user-line"><strong>Phone:</strong> {user.phone_number || 'Not provided'}</div>
                <div className="citizen-user-line"><strong>Reward Points:</strong> <span style={{ fontWeight: 'bold' }}>{user.reward_points ?? 0}</span></div>
              </div>
            )}
            <div className="citizen-logout-row">
              <button
                className="logout-btn"
                onClick={() => { logout(); navigate('/auth'); }}
              >
                Logout
              </button>
            </div>
          </div>

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
        </header>

        <div className="button-row">
          <button className="TrackProgress" onClick={() => navigate('/trackprogress')}>Track Progress</button>
          <button className="IssueSubmission" onClick={() => navigate('/issue-submission')}>Issue Submission</button>
          <button className="Contribution" onClick={() => navigate('/contribution')}>Contribution</button>
        </div>
      </div>
    </>
  )
}
export default CitizenLandingPage;