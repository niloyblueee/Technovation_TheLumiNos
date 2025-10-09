import React, { useState, useEffect } from 'react';
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
              title: i.description ? (i.description.length > 60 ? i.description.slice(0, 57) + '...' : i.description) : `Issue ${i.id}`,
              status: statusLabel
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

  return (
    <>
      <CitizenNav />
      <div className="tp-container citizen-content">
        <div className="tp-card">
          <h1 className="tp-title">Flagged Problems</h1>

          <div className="tp-list">
            <div className="tp-header">
              <div className="tp-header-cell">Problems</div>
              <div className="tp-header-cell">Status</div>
            </div>

            {loading && (
              <div className="tp-loading">Loading problems...</div>
            )}

            {error && (
              <div className="tp-error">Error: {error}</div>
            )}

            {problems.map((problem) => (
              <div key={problem.id} className="tp-row">
                <div className="tp-problem">{problem.title}</div>
                <div className="tp-status">
                  <span className={`tp-status-badge ${getStatusClass(problem.status)}`}>
                    {problem.status}
                  </span>
                </div>
              </div>
            ))}

            {problems.length === 0 && (
              <div className="tp-empty">No flagged problems at this time.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TrackProgress;