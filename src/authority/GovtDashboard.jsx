import React from 'react'
import styles from './GovtDashboard.module.css'
import { useNavigate } from 'react-router-dom'

const GovtDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.wholeContainer}>
      <div className={styles.upperPart}>
        <h1>Government Dashboard</h1>
      </div>
      <div className={styles.mapPortion}>
        <div className={styles.map}>
        <h1>Map</h1>
      </div>
      <div className={styles.adminButton}>
        <button className={` btn btn-danger`} onClick={() => navigate('/govt-problem-page')} >Problems</button>
        <button className={` btn btn-outline-success`}  onClick={() => navigate('/govt-events')}>Events</button>
        <button className={` btn btn-outline-success`} onClick={() => navigate('/govt-reward-page')} >Reward</button>
      </div>
      </div>

    </div>
  )
}

export default GovtDashboard;
