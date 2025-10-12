// src/citizen/Contribution.jsx

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './Contribution.css';
import { useAuth } from '../contexts/AuthContext';
import CitizenNav from './CitizenNav';

const ContributionPage = () => {
    const { user, isAuthenticated } = useAuth();
    const [myIssues, setMyIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const historyData = [
        { item: 'Plastic bottles', count: 18 },
        { item: 'Food packaging', count: 9 },
        { item: 'Metal cans', count: 7 },
    ];

    const cleanPoints = 150;
    const cleanRedeemable = 75;

    useEffect(() => {
        const fetchIssues = async () => {
            setLoading(true);
            setError('');
            try {
                const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${base.replace(/\/$/, '')}/api/issues`, { withCredentials: true });
                if (!Array.isArray(data)) {
                    setMyIssues([]);
                    return;
                }
                const phone = user?.phone_number;
                const mine = phone ? data.filter((it) => String(it.phone_number || '') === String(phone)) : [];
                setMyIssues(mine);
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load issues');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) fetchIssues();
        else {
            setLoading(false);
            setMyIssues([]);
        }
    }, [isAuthenticated, user?.phone_number]);

    const computed = useMemo(() => {
        const rows = myIssues.map((it) => {
            const emergency = Boolean(it.emergency);
            const status = String(it.status || '').toLowerCase();
            const max = emergency ? 25 : 10;
            let points = 0;
            if (status === 'in_progress' || status === 'resolved' || status.includes('complete')) {
                points = max;
            } else if (status === 'rejected' && emergency) {
                points = -20;
            }
            const label = it.description ? (it.description.length > 64 ? `${it.description.slice(0, 61)}…` : it.description) : `Issue #${it.id}`;
            return {
                id: it.id,
                label,
                emergency,
                status,
                points,
                max,
                submittedAt: it.created_at || it.createdAt || null,
            };
        });

        const total = rows.reduce((sum, r) => sum + (r.points || 0), 0);
        const redeemable = Math.max(0, Math.floor(total / 10));
        const emergencyCount = rows.filter((r) => r.emergency).length;
        const completed = rows.filter((r) => (r.status || '').includes('progress') || (r.status || '').includes('resolve')).length;
        return { rows, total, redeemable, emergencyCount, completed };
    }, [myIssues]);

    const latestActivity = useMemo(() => {
        const timestamps = myIssues
            .map((it) => it.updated_at || it.updatedAt || it.created_at || it.createdAt)
            .map((value) => {
                const date = value ? new Date(value) : null;
                return date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
            })
            .filter((value) => value !== null);
        if (!timestamps.length) return null;
        return new Date(Math.max(...timestamps));
    }, [myIssues]);

    const formatStatus = (status) => {
        const value = (status || '').toLowerCase();
        if (value.includes('resolve') || value.includes('complete')) return 'Completed';
        if (value.includes('progress')) return 'In Progress';
        if (value.includes('reject')) return 'Rejected';
        return 'Pending';
    };

    const formatDate = (value) => {
        if (!value) return 'Awaiting activity';
        const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
        if (!date || Number.isNaN(date.getTime())) return 'Awaiting activity';
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    };

    const handleRedeemClick = () => {
        alert('Navigating to online redeem options!');
    };

    return (
        <>
            <CitizenNav />
            <div className="contrib-shell citizen-content">
                <div className="contrib-layout">
                    <header className="contrib-hero">
                        <div className="contrib-hero-text">
                            <h1>Community Contributions</h1>
                            <p>Earn points for every verified report and use them to unlock community rewards.</p>
                        </div>
                        <div className="contrib-stats" aria-label="Contribution summary">
                            <div className="contrib-stat-card">
                                <span className="contrib-stat-label">Total Points</span>
                                <span className="contrib-stat-value">{computed.total}</span>
                            </div>
                            <div className="contrib-stat-card">
                                <span className="contrib-stat-label">Redeemable</span>
                                <span className="contrib-stat-value">{computed.redeemable}</span>
                            </div>
                            <div className="contrib-stat-card">
                                <span className="contrib-stat-label">Emergency Reports</span>
                                <span className="contrib-stat-value">{computed.emergencyCount}</span>
                            </div>
                            <div className="contrib-stat-card">
                                <span className="contrib-stat-label">Resolved</span>
                                <span className="contrib-stat-value">{computed.completed}</span>
                            </div>
                        </div>
                    </header>

                    <div className="contrib-content">
                        <section className="contrib-issues">
                            <div className="contrib-table-head">
                                <span>Reported Issue</span>
                                <span>Status</span>
                                <span>Points</span>
                            </div>

                            <div className="contrib-table-body">
                                {loading && (
                                    <div className="contrib-state contrib-loading">Loading your contributions…</div>
                                )}

                                {error && (
                                    <div className="contrib-state contrib-error">{error}</div>
                                )}

                                {!loading && !error && computed.rows.map((row) => (
                                    <article key={row.id} className="contrib-row">
                                        <div className="contrib-issue">
                                            <h2 className="contrib-issue-title">{row.label}</h2>
                                            <div className="contrib-issue-meta">
                                                {row.emergency && <span className="contrib-meta-chip danger">Emergency</span>}
                                                {row.submittedAt && (
                                                    <span className="contrib-meta-chip">Submitted {formatDate(row.submittedAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="contrib-status">
                                            <span className={`contrib-status-badge ${formatStatus(row.status).toLowerCase().replace(' ', '-')}`}>
                                                {formatStatus(row.status)}
                                            </span>
                                        </div>
                                        <div className="contrib-points">
                                            <span className={`contrib-points-chip ${row.points < 0 ? 'negative' : ''}`}>
                                                {row.points}/{row.max}
                                            </span>
                                        </div>
                                    </article>
                                ))}

                                {!loading && !error && computed.rows.length === 0 && (
                                    <div className="contrib-state contrib-empty">
                                        You haven’t earned any points yet. Submit an issue to start contributing!
                                    </div>
                                )}
                            </div>
                        </section>

                        <aside className="contrib-side">
                            <div className="contrib-card">
                                <h3>Cleanliness Awards</h3>
                                <div className="contrib-award">
                                    <span className="contrib-award-label">Clean Points</span>
                                    <span className="contrib-award-value">{cleanPoints}</span>
                                </div>
                                <div className="contrib-award">
                                    <span className="contrib-award-label">Redeemable (Tk)</span>
                                    <span className="contrib-award-value">{cleanRedeemable}</span>
                                </div>
                                <button className="contrib-redeem" onClick={handleRedeemClick}>
                                    View Redeem Options
                                </button>
                                <p className="contrib-card-note">Cash in your points for sustainable products or utility bill credits.</p>
                            </div>

                            <div className="contrib-card">
                                <h3>Activity Snapshot</h3>
                                <p className="contrib-sync">Latest update: {latestActivity ? formatDate(latestActivity) : 'No activity yet'}</p>
                                <ul className="contrib-history">
                                    {historyData.map((item, index) => (
                                        <li key={index}>
                                            <span>{item.item}</span>
                                            <span>{item.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ContributionPage;