import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Feature1 from './features/Feature1';
import Feature2 from './features/Feature2';
import Feature3 from './features/Feature3';
import Feature4 from './features/Feature4';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [activeFeature, setActiveFeature] = useState('dashboard');

    const features = [
        { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
        { id: 'feature1', name: 'Student Management', icon: '👥' },
        { id: 'feature2', name: 'Course Management', icon: '📚' },
        { id: 'feature3', name: 'Communication Hub', icon: '💬' },
        { id: 'feature4', name: 'Analytics', icon: '📊' }
    ];

    const renderContent = () => {
        switch (activeFeature) {
            case 'feature1':
                return <Feature1 />;
            case 'feature2':
                return <Feature2 />;
            case 'feature3':
                return <Feature3 />;
            case 'feature4':
                return <Feature4 />;
            default:
                return (
                    <div className="dashboard-welcome">
                        <div className="dashboard-welcome-content">
                            <div className="welcome-header">
                                <h1 className="welcome-title">
                                    <span className="welcome-icon">🎓</span>
                                    Welcome to Technovation TheLumiNos!
                                </h1>
                                <p className="welcome-subtitle">
                                    Your comprehensive campus management platform
                                </p>
                            </div>

                            {user && (
                                <div className="user-info-card">
                                    <div className="user-info-header">
                                        <h2>👤 User Information</h2>
                                    </div>
                                    <div className="user-info-grid">
                                        <div className="user-info-item">
                                            <span className="info-label">Name:</span>
                                            <span className="info-value">{user.firstName} {user.lastName}</span>
                                        </div>
                                        <div className="user-info-item">
                                            <span className="info-label">Email:</span>
                                            <span className="info-value">{user.email}</span>
                                        </div>
                                        <div className="user-info-item">
                                            <span className="info-label">Role:</span>
                                            <span className="info-value role-badge">{user.role}</span>
                                        </div>
                                        {user.campus_id && (
                                            <div className="user-info-item">
                                                <span className="info-label">Campus ID:</span>
                                                <span className="info-value">{user.campus_id}</span>
                                            </div>
                                        )}
                                        {user.department && (
                                            <div className="user-info-item">
                                                <span className="info-label">Department:</span>
                                                <span className="info-value">{user.department}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="welcome-actions">
                                <button onClick={logout} className="logout-welcome-btn">
                                    🚪 Logout
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setActiveFeature(activeFeature === 'mobile-menu' ? 'dashboard' : 'mobile-menu')}
            >
                ☰
            </button>

            {/* Sidebar */}
            <div className={`sidebar ${activeFeature === 'mobile-menu' ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Technovation</h2>
                    <p>TheLumiNos</p>
                </div>

                <nav className="sidebar-nav">
                    {features.map(feature => (
                        <button
                            key={feature.id}
                            onClick={() => setActiveFeature(feature.id)}
                            className={`nav-btn ${activeFeature === feature.id ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{feature.icon}</span>
                            <span className="nav-text">{feature.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={logout} className="logout-btn">
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {activeFeature === 'mobile-menu' && (
                <div
                    className="mobile-overlay"
                    onClick={() => setActiveFeature('dashboard')}
                />
            )}

            {/* Main Content */}
            <div className="main-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default Dashboard;
