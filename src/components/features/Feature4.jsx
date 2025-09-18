import React from 'react';
import './Features.css';

const Feature4 = () => {
    return (
        <div className="feature-container">
            <div className="feature-content">
                <div className="feature-header">
                    <h1 className="feature-title">
                        <span className="feature-icon">📊</span>
                        Analytics Dashboard
                    </h1>
                    <p className="feature-subtitle">
                        Comprehensive analytics and reporting system
                    </p>
                </div>

                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-card-icon">📈</div>
                        <h3 className="feature-card-title">Performance Metrics</h3>
                        <p className="feature-card-description">
                            Track student performance, attendance, and engagement metrics with real-time updates.
                        </p>
                        <div className="feature-card-stats">
                            <span>92%</span>
                            <span>Avg Performance</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">📊</div>
                        <h3 className="feature-card-title">Data Visualization</h3>
                        <p className="feature-card-description">
                            Interactive charts and graphs for better data understanding and insights.
                        </p>
                        <div className="feature-card-stats">
                            <span>50+</span>
                            <span>Chart Types</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">📋</div>
                        <h3 className="feature-card-title">Custom Reports</h3>
                        <p className="feature-card-description">
                            Generate custom reports and export data in various formats for analysis.
                        </p>
                        <div className="feature-card-stats">
                            <span>200+</span>
                            <span>Reports Generated</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feature4;
