import React from 'react';
import './Features.css';

const Feature1 = () => {
    return (
        <div className="feature-container">
            <div className="feature-content">
                <div className="feature-header">
                    <h1 className="feature-title">
                        <span className="feature-icon">👥</span>
                        Student Management
                    </h1>
                    <p className="feature-subtitle">
                        Comprehensive student information and management system
                    </p>
                </div>

                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-card-icon">📚</div>
                        <h3 className="feature-card-title">Academic Records</h3>
                        <p className="feature-card-description">
                            Manage student academic information, grades, and transcripts with advanced filtering and search capabilities.
                        </p>
                        <div className="feature-card-stats">
                            <span>1,250+ Students</span>
                            <span>Active Records</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">👥</div>
                        <h3 className="feature-card-title">Class Management</h3>
                        <p className="feature-card-description">
                            Organize students into classes and manage class schedules with automatic conflict detection.
                        </p>
                        <div className="feature-card-stats">
                            <span>45 Classes</span>
                            <span>This Semester</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">📊</div>
                        <h3 className="feature-card-title">Analytics</h3>
                        <p className="feature-card-description">
                            View detailed analytics and reports on student performance with interactive dashboards.
                        </p>
                        <div className="feature-card-stats">
                            <span>95%</span>
                            <span>Success Rate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feature1;
