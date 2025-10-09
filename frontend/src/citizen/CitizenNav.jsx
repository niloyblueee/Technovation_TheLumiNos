import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CitizenNav.css';
import { FaHome, FaClipboardList, FaChartLine, FaFileAlt } from 'react-icons/fa';

const CitizenNav = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <nav className="citizen-nav">
            <Link to="/citizen" className="nav-logo">
                <FaHome /> TheLumiNos
            </Link>
            
            <div className="nav-links">
                <Link to="/issue-submission" className={`nav-link ${isActive('/submit-issue')}`}>
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
                <div className="user-info">
                    {user?.name || 'User'}
                </div>
                <button onClick={logout} className="logout-btn">
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default CitizenNav;