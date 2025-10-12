import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CitizenNav.css';
import { FaHome, FaClipboardList, FaChartLine, FaFileAlt, FaArrowLeft } from 'react-icons/fa';

const CitizenNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isActive = (path) => (location.pathname === path ? 'active' : '');

    const userDisplayName = [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(' ') || user?.name || 'Citizen';

    return (
        <nav className="citizen-nav">
            <div className="nav-left">
                <button
                    type="button"
                    className="nav-back"
                    onClick={() => navigate('/citizen')}
                    aria-label="Return to Citizen home"
                >
                    <FaArrowLeft />
                </button>
                <Link to="/citizen" className="nav-logo">
                    <FaHome /> TheLumiNos
                </Link>
                <span className="nav-tagline">Citizen Portal</span>
            </div>

            <div className="nav-links">
                <Link to="/issue-submission" className={`nav-link ${isActive('/issue-submission')}`}>
                    <FaFileAlt /> Submit Issue
                </Link>
                <Link to="/trackprogress" className={`nav-link ${isActive('/trackprogress')}`}>
                    <FaChartLine /> Track Progress
                </Link>
                <Link to="/contribution" className={`nav-link ${isActive('/contribution')}`}>
                    <FaClipboardList /> Contribution
                </Link>
            </div>

            <div className="profile-section">
                <div className="user-info" title={userDisplayName}>
                    {userDisplayName}
                </div>
                <button onClick={logout} className="logout-btn">
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default CitizenNav;