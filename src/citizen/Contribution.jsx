// src/citizen/Contribution.jsx

import React, { useEffect, useMemo, useState } from 'react';
import './Contribution.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ContributionPage = () => {
    const { user, isAuthenticated } = useAuth();
    const [myIssues, setMyIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Placeholder: leave as-is (user trash collection etc.)
    const historyData = [
        { item: 'plastic', count: 10 },
        { item: 'Bottle', count: 20 },
        { item: 'Chips Packet', count: 5 },
    ];

    // Cleanliness awards dummy values
    const cleanPoints = 150;
    const cleanRedeemable = 75;

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${base}/api/issues`);
                if (!Array.isArray(data)) {
                    setMyIssues([]);
                } else {
                    // Filter to current user's issues by phone number
                    const phone = user?.phone_number;
                    const mine = phone ? data.filter(it => String(it.phone_number || '') === String(phone)) : [];
                    setMyIssues(mine);
                }
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to load issues');
            } finally {
                setLoading(false);
            }
        };
        if (isAuthenticated) fetchIssues();
        else { setLoading(false); setMyIssues([]); }
    }, [isAuthenticated, user?.phone_number]);

    // Compute points per issue per the rules
    const computed = useMemo(() => {
        const rows = myIssues.map(it => {
            const emergency = !!it.emergency;
            const status = String(it.status || '').toLowerCase();
            const max = emergency ? 25 : 10;
            let pts = 0;
            if (status === 'in_progress' || status === 'resolved') {
                pts = max; // approved/verified
            } else if (status === 'rejected' && emergency) {
                pts = -20; // false emergency penalty
            } else {
                pts = 0; // pending or rejected (non-emergency)
            }
            // Prepare a label for the issue
            const label = it.description ? (it.description.length > 40 ? it.description.slice(0, 37) + '…' : it.description) : `Issue #${it.id}`;
            return {
                id: it.id,
                label,
                emergency,
                status,
                points: pts,
                max,
            };
        });
        const total = rows.reduce((sum, r) => sum + (r.points || 0), 0);
        const redeemable = Math.floor(total / 10); // one tenth of total points
        return { rows, total, redeemable };
    }, [myIssues]);

    const handleRedeemClick = () => {
        alert('Navigating to online redeem options!');
    };

    return (
        <div className="contribution-page">
            <h1 className="main-title">Thank You For keeping Your Own Area Clean and sustainable</h1>
            <p className="sub-title">Track Your Contributions</p>
            <div className="content-container">
                {/* Left Panel: Reported Issues and Points */}
                <div className="panel left-panel">
                    <div className="panel-header">
                        <div className="header-item">Reported Issue</div>
                        <div className="header-item">Points</div>
                    </div>
                    {loading && (
                        <div className="list-item">
                            <div className="list-text">Loading your reported issues…</div>
                            <div className="list-text">—</div>
                        </div>
                    )}
                    {error && (
                        <div className="list-item" style={{ color: 'red' }}>
                            <div className="list-text">{error}</div>
                            <div className="list-text">—</div>
                        </div>
                    )}
                    {!loading && !error && computed.rows.length === 0 && (
                        <div className="list-item">
                            <div className="list-text">No reported issues yet</div>
                            <div className="list-text">0</div>
                        </div>
                    )}
                    {!loading && !error && computed.rows.map((row) => (
                        <div key={row.id} className="list-item">
                            <div className="list-text">{row.label}{row.emergency ? ' (Emergency)' : ''}</div>
                            <div className="list-text">{row.points}/{row.max}</div>
                        </div>
                    ))}

                    {/* Total points button (used for yearly award) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <button className="redeem-button" title="Total points used for yearly award">
                            Total Points: {computed.total}
                        </button>
                    </div>
                </div>

                {/* Right Panels: Awards and History */}
                <div className="right-panels">
                    {/* Top Right Panel: Cleanliness Awards */}
                    <div className="panel award-panel">
                        <h2 className="panel-title">CleanLiness Awards</h2>
                        <div className="award-item">
                            <div className="award-label">Clean Point</div>
                            <div className="award-value">{cleanPoints}</div>
                        </div>
                        <div className="award-item">
                            <div className="award-label">Redeemable</div>
                            <div className="award-value">{cleanRedeemable} Tk</div>
                        </div>
                        <button className="redeem-button" onClick={handleRedeemClick}>
                            Online Redeem Options
                        </button>
                    </div>

                    {/* Bottom Right Panel: History */}
                    <div className="panel history-panel">
                        <h2 className="panel-title">HISTORY</h2>
                        {historyData.map((item, index) => (
                            <div key={index} className="list-item">
                                <div className="list-text">{item.item}</div>
                                <div className="list-text">{item.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContributionPage;