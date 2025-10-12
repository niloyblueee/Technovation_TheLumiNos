import React, { useState, useEffect, useMemo } from 'react';
import './TrackProgress.css';
import { useAuth } from '../contexts/AuthContext';
import CitizenNav from './CitizenNav';

function TrackProgress() {
  const { user, isAuthenticated } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only load when authenticated; otherwise clear list
    if (!isAuthenticated) {
      setProblems([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const url = `${base.replace(/\/$/, '')}/api/issues`;
        const res = await fetch(url, { signal: controller.signal, credentials: 'include' });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        if (mounted) {
          // map backend issues to UI shape: id, title, status
          const arr = Array.isArray(data) ? data : [];
          // filter to current user's issues by phone_number
          const phone = user?.phone_number;
          const mine = phone ? arr.filter(i => String(i.phone_number || '') === String(phone)) : [];
          // sort newest first by id (assuming auto-increment)
          mine.sort((a, b) => (b.id || 0) - (a.id || 0));
          const mapped = mine.map(i => {
            const rawStatus = (i.status || '').toLowerCase();
            let statusLabel = 'Pending';
            if (rawStatus.includes('progress') || rawStatus.includes('in_progress') || rawStatus.includes('in-progress')) statusLabel = 'On Progress';
            else if (rawStatus.includes('resolve') || rawStatus.includes('complete')) statusLabel = 'Completed';
            else if (rawStatus.includes('reject')) statusLabel = 'Rejected';
            else if (rawStatus.includes('pending')) statusLabel = 'Pending';

            return {
              id: i.id,
              title: i.description ? (i.description.length > 72 ? i.description.slice(0, 69) + '...' : i.description) : `Issue ${i.id}`,
              status: statusLabel,
              coordinate: i.coordinate || i.location || '',
              submittedAt: i.created_at || i.createdAt || i.created_on || null,
              updatedAt: i.updated_at || i.updatedAt || i.updated_on || i.modified_at || null,
            };
          });
          setProblems(mapped);
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load issues');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; controller.abort(); };
  }, [isAuthenticated, user?.phone_number]);

  // Return a CSS class name for the badge based on status (case-insensitive)
  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed')) return 'badge-completed';
    if (s.includes('progress')) return 'badge-progress';
    if (s.includes('pending')) return 'badge-pending';
    return 'badge-default';
  };

  const summary = useMemo(() => {
    const counts = { total: problems.length, pending: 0, progress: 0, completed: 0 };
    problems.forEach((p) => {
      const s = (p.status || '').toLowerCase();
      if (s.includes('progress')) counts.progress += 1;
      else if (s.includes('complete')) counts.completed += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [problems]);

  const latestUpdate = useMemo(() => {
    const timestamps = problems
      .map((p) => p.updatedAt || p.submittedAt)
      .map((value) => {
        const date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
      })
      .filter((value) => value !== null);
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }, [problems]);

  const formatDate = (value) => {
    if (!value) return 'Awaiting update';
    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (!date || Number.isNaN(date.getTime())) return 'Awaiting update';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <>
      <CitizenNav />
      <div className="tp-shell citizen-content">
        <div className="tp-layout">
          <header className="tp-hero">
            <div className="tp-hero-text">
              <h1>Track Your Reports</h1>
              <p>Monitor every issue you have raised and follow its journey from submission to resolution.</p>
            </div>
            <div className="tp-stats" aria-label="Issue summary">
              <div className="tp-stat-card">
                <span className="tp-stat-label">Total</span>
                <span className="tp-stat-value">{summary.total}</span>
              </div>
              <div className="tp-stat-card">
                <span className="tp-stat-label">Pending</span>
                <span className="tp-stat-value">{summary.pending}</span>
              </div>
              <div className="tp-stat-card">
                <span className="tp-stat-label">In Progress</span>
                <span className="tp-stat-value">{summary.progress}</span>
              </div>
              <div className="tp-stat-card">
                <span className="tp-stat-label">Completed</span>
                <span className="tp-stat-value">{summary.completed}</span>
              </div>
            </div>
          </header>

          <div className="tp-content">
            <section className="tp-stream">
              <div className="tp-table-head">
                <span>Issue Details</span>
                <span>Status</span>
                <span>Last Update</span>
              </div>

              <div className="tp-table-body">
                {loading && (
                  <div className="tp-state tp-loading">Loading issues…</div>
                )}

                {error && (
                  <div className="tp-state tp-error">Unable to load updates: {error}</div>
                )}

                {!loading && !error && problems.map((problem) => (
                  <article key={problem.id} className="tp-row">
                    <div className="tp-issue">
                      <h2 className="tp-issue-title">{problem.title}</h2>
                      <div className="tp-issue-meta">
                        {problem.coordinate ? (
                          <span className="tp-meta-chip">{problem.coordinate}</span>
                        ) : null}
                        {problem.submittedAt ? (
                          <span className="tp-meta-chip">Submitted {formatDate(problem.submittedAt)}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="tp-status">
                      <span className={`tp-status-badge ${getStatusClass(problem.status)}`}>
                        {problem.status}
                      </span>
                    </div>
                    <div className="tp-updated">{formatDate(problem.updatedAt || problem.submittedAt)}</div>
                  </article>
                ))}

                {!loading && !error && problems.length === 0 && (
                  <div className="tp-state tp-empty">
                    You haven’t submitted any issues yet. Once you do, you’ll see progress updates here.
                  </div>
                )}
              </div>
            </section>

            <aside className="tp-side">
              <div className="tp-aside-card">
                <h3>How progress is tracked</h3>
                <ul>
                  <li>Pending reports are awaiting verification by the authority team.</li>
                  <li>In progress means on-ground teams are actively addressing the issue.</li>
                  <li>Completed issues were resolved and closed by the authority.</li>
                </ul>
              </div>
              <div className="tp-aside-card">
                <h3>Last sync</h3>
                <p className="tp-sync-time">{latestUpdate ? formatDate(latestUpdate) : 'No updates yet'}</p>
                <p className="tp-sync-note">Refresh the page to pull the newest status from the server.</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

export default TrackProgress;