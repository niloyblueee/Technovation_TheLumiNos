import React from "react";
import './CitizenLandingPage.css';
function CitizenLandingPage() {
return (
  <>
    <div className="dashboardContainer">
      <header>
      <h1 className="dashboardTitle">Welcome To Your Dashboard</h1>
      <button className="notifications" onClick={() => {}}> 🔔 </button>
      </header>
      <div className="buttonRow">
      <button className="TrackProgress" onClick={() => {}}>Track Progress</button>
      <button className="IssueSubmission" onClick={() => {}}>Issue Submission</button>
      <button className="Contribution" onClick={() => {}}>Contribution</button>
      </div>
    </div>
  </>
)
}
export default CitizenLandingPage;