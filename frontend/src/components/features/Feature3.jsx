import React from 'react';
import './Features.css';

const Feature3 = () => {
    return (
        <div className="feature-container">
            <div className="feature-content">
                <div className="feature-header">
                    <h1 className="feature-title">
                        <span className="feature-icon">💬</span>
                        Communication Hub
                    </h1>
                    <p className="feature-subtitle">
                        Integrated communication and collaboration platform
                    </p>
                </div>

                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-card-icon">💬</div>
                        <h3 className="feature-card-title">Real-time Chat</h3>
                        <p className="feature-card-description">
                            Instant messaging and group chat functionality for seamless communication across campus.
                        </p>
                        <div className="feature-card-stats">
                            <span>2,500+</span>
                            <span>Active Users</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">📢</div>
                        <h3 className="feature-card-title">Announcements</h3>
                        <p className="feature-card-description">
                            Broadcast important announcements and updates to the entire campus community.
                        </p>
                        <div className="feature-card-stats">
                            <span>150+</span>
                            <span>This Month</span>
                        </div>
                    </div>

                    <div className="feature-card">
                        <div className="feature-card-icon">🤝</div>
                        <h3 className="feature-card-title">Collaboration</h3>
                        <p className="feature-card-description">
                            Team collaboration tools for group projects and study sessions with file sharing.
                        </p>
                        <div className="feature-card-stats">
                            <span>300+</span>
                            <span>Active Groups</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Feature3;
