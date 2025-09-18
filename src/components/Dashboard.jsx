import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Feature1 from './features/Feature1';
import Feature2 from './features/Feature2';
import Feature3 from './features/Feature3';
import Feature4 from './features/Feature4';
import CitizenDashboard from './CitizenDashboard';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState('dashboard');

    // Route to appropriate dashboard based on user role
    if (user?.role === 'govt_authority') {
        return <GovernmentDashboard />;
    }

    if (user?.role === 'citizen') {
        return <CitizenDashboard />;
    }

    const features = [
        { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
        { id: 'feature1', name: 'Issue Reporting', icon: '🚨' },
        { id: 'feature2', name: 'Event Management', icon: '🎪' },
        { id: 'feature3', name: 'Reward System', icon: '🏆' },
        { id: 'feature4', name: 'Verification Panel', icon: '✅' }
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
                                    <span className="welcome-icon">🏛️</span>
                                    Welcome to Technovation TheLumiNos!
                                </h1>
                                <p className="welcome-subtitle">
                                    Connecting Citizens with Government Authorities for SDG11
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
                                        {user.national_id && (
                                            <div className="user-info-item">
                                                <span className="info-label">National ID:</span>
                                                <span className="info-value">{user.national_id}</span>
                                            </div>
                                        )}
                                        {user.sex && (
                                            <div className="user-info-item">
                                                <span className="info-label">Sex:</span>
                                                <span className="info-value">{user.sex}</span>
                                            </div>
                                        )}
                                        {user.status && (
                                            <div className="user-info-item">
                                                <span className="info-label">Status:</span>
                                                <span className="info-value status-badge">{user.status}</span>
                                            </div>
                                        )}
                                        {user.department && (
                                            <div className="user-info-item">
                                                <span className="info-label">Department:</span>
                                                <span className="info-value">{user.department}</span>
                                            </div>
                                        )}
                                        {user.region && (
                                            <div className="user-info-item">
                                                <span className="info-label">Region:</span>
                                                <span className="info-value">{user.region}</span>
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
