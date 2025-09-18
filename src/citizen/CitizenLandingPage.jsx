import React from "react";
import './CitizenLandingPage.css';
import { useNavigate } from 'react-router-dom';

function CitizenLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="dashboardContainer">
        <header>
          <h1 className="dashboardTitle">Welcome To Your Dashboard</h1>
          <button className="notifications" onClick={() => {}}> 🔔 </button>
        </header>
        <div className="buttonRow">
          <button className="TrackProgress" onClick={() => navigate('/trackprogress')}>Track Progress</button>
          <button className="IssueSubmission" onClick={() => navigate('/issue-submission')}>Issue Submission</button>
          <button className="Contribution" onClick={() => navigate('/contribution')}>Contribution</button>
        </div>
      </div>
    </>
  )
}
export default CitizenLandingPage;