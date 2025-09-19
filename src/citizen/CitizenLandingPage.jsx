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

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/notifications', {
          signal: controller.signal,
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
        fetchedRef.current = true;
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="dashboardContainer">
        <header className="header">
          <div className="citizen-header-left">
            <h1 className="dashboardTitle">Welcome To Your Dashboard</h1>
            {user && (
              <div className="citizen-user-info">
                <div className="citizen-user-line"><strong>Name:</strong> {user.firstName} {user.lastName}</div>
                <div className="citizen-user-line"><strong>Phone:</strong> {user.phone_number || 'Not provided'}</div>
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
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      // optional: persist to backend
                      // await fetch('/api/notifications/mark-read', { method: 'PUT', credentials: 'include' });
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
                      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
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

        <div className="buttonRow">
          <button className="TrackProgress" onClick={() => navigate('/trackprogress')}>Track Progress</button>
          <button className="IssueSubmission" onClick={() => navigate('/issue-submission')}>Issue Submission</button>
          <button className="Contribution" onClick={() => navigate('/contribution')}>Contribution</button>
        </div>
      </div>
    </>
  )
}
export default CitizenLandingPage;