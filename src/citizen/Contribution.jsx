// src/ContributionPage.jsx

import React from 'react';
import './Contribution.css';

const ContributionPage = () => {
    // Hardcoded data based on the image provided
    const pointsData = [
        { issue: 'Reported Fire', points: 50 },
        { issue: 'Reported RoadBlock', points: 10 },
        { issue: 'Reported DrainBlock', points: 20 },
    ];

    const historyData = [
        { item: 'plastic', count: 10 },
        { item: 'Bottle', count: 20 },
        { item: 'Chips Packet', count: 5 },
    ];

    const totalPoints = 150;
    const redeemableValue = 75;

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
                    {pointsData.map((item, index) => (
                        <div key={index} className="list-item">
                            <div className="list-text">{item.issue}</div>
                            <div className="list-text">{item.points} points</div>
                        </div>
                    ))}
                </div>

                {/* Right Panels: Awards and History */}
                <div className="right-panels">
                    {/* Top Right Panel: Cleanliness Awards */}
                    <div className="panel award-panel">
                        <h2 className="panel-title">CleanLiness Awards</h2>
                        <div className="award-item">
                            <div className="award-label">Total Points</div>
                            <div className="award-value">{totalPoints}</div>
                        </div>
                        <div className="award-item">
                            <div className="award-label">Redeemable</div>
                            <div className="award-value">{redeemableValue} Tk</div>
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