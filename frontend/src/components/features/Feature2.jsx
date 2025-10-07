import React from 'react';
import './Features.css';

const Feature2 = () => {
    return (
        <div className="feature-container">
            <div className="feature-content">
                <div className="feature-header">
                    <h1 className="feature-title">
                        <span className="feature-icon">📚</span>
                        Course Management
                    </h1>
                    <p className="feature-subtitle">
                        Advanced course creation, scheduling, and management system
                    </p>
                </div>

                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-card-icon">📅</div>
                        <h3 className="feature-card-title">Course Scheduling</h3>
                        <p className="feature-card-description">
                            Create and manage course schedules with automatic conflict detection and room allocation.
                        </p>
                        <div className="feature-card-stats">
                            <span>120+ Courses</span>
                            <span>This Semester</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">📖</div>
                        <h3 className="feature-card-title">Curriculum Design</h3>
                        <p className="feature-card-description">
                            Design comprehensive curricula with prerequisites and learning objectives.
                        </p>
                        <div className="feature-card-stats">
                            <span>15 Programs</span>
                            <span>Active</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">🎯</div>
                        <h3 className="feature-card-title">Learning Outcomes</h3>
                        <p className="feature-card-description">
                            Track and measure learning outcomes and course effectiveness with detailed analytics.
                        </p>
                        <div className="feature-card-stats">
                            <span>98%</span>
                            <span>Completion Rate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feature2;
