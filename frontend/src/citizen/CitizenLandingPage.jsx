import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState(null);
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

  useEffect(() => {
    const phone = user?.phone_number;
    if (!phone) {
      setIssues([]);
      setIssuesLoading(false);
      setIssuesError(null);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    async function loadIssues() {
      setIssuesLoading(true);
      setIssuesError(null);
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const url = `${base.replace(/\/$/, '')}/api/issues`;
        const res = await fetch(url, { signal: controller.signal, credentials: 'include' });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : [];
        const phoneKey = String(phone);
        const mine = arr
          .filter(i => String(i.phone_number || '') === phoneKey)
          .sort((a, b) => (b.id || 0) - (a.id || 0));
        const mapped = mine.map(i => {
          const rawStatus = (i.status || '').toLowerCase();
          let statusLabel = 'Pending';
          if (rawStatus.includes('progress') || rawStatus.includes('in_progress') || rawStatus.includes('in-progress')) statusLabel = 'In Progress';
          else if (rawStatus.includes('resolve') || rawStatus.includes('complete')) statusLabel = 'Completed';
          else if (rawStatus.includes('reject')) statusLabel = 'Rejected';
          return { id: i.id, status: statusLabel };
        });
        setIssues(mapped);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (mounted) setIssuesError(err.message || 'Failed to load reports');
      } finally {
        if (mounted) setIssuesLoading(false);
      }
    }

    loadIssues();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [user?.phone_number]);

  const issueSummary = useMemo(() => {
    const summary = { total: issues.length, pending: 0, progress: 0, completed: 0, rejected: 0 };
    issues.forEach((issue) => {
      const status = (issue.status || '').toLowerCase();
      if (status.includes('progress')) summary.progress += 1;
      else if (status.includes('complete')) summary.completed += 1;
      else if (status.includes('reject')) summary.rejected += 1;
      else summary.pending += 1;
    });
    return summary;
  }, [issues]);

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
            <p>{issuesLoading ? 'Loading...' : issueSummary.total}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Issues</h3>
            <p>{issuesLoading ? 'Loading...' : issueSummary.pending}</p>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <p>{issuesLoading ? 'Loading...' : issueSummary.progress}</p>
          </div>
          <div className="stat-card">
            <h3>Completed</h3>
            <p>{issuesLoading ? 'Loading...' : issueSummary.completed}</p>
          </div>
        </div>

        {issuesError && (
          <div className="citizen-stats-error">Unable to load your reports: {issuesError}</div>
        )}

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