import React, { useState } from 'react';
import './TrackProgress.css';

function TrackProgress() {
  // Later will fetch from backend
  const [problems] = useState([
    { id: 1, title: 'Fire Issued', status: 'Completed' },
    { id: 2, title: 'Road Block issued', status: 'On Progress' },
    { id: 3, title: 'Phone Stolen', status: 'Pending Review' },
    { id: 4, title: 'Drain Blockage', status: 'On Progress' },
    {id: 5 ,title: 'Brain Blockage', status: 'Completed'  },
    {id: 6, title: 'Ass Blockage', status: 'On Progress' }
  ]);

  // Return a CSS class name for the badge based on status (case-insensitive)
  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed')) return 'badge-completed';
    if (s.includes('progress')) return 'badge-progress';
    if (s.includes('pending')) return 'badge-pending';
    return 'badge-default';
  };

  return (
    <div className="tp-container">
      <div className="tp-card">
        <h1 className="tp-title">Flagged Problems</h1>

        <div className="tp-list">
          <div className="tp-header">
            <div className="tp-header-cell">Problems</div>
            <div className="tp-header-cell">Status</div>
          </div>

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
  );
}

export default TrackProgress;