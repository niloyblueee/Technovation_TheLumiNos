import React from 'react'
import styles from './AdminDashboard.module.css'
const AdminDashboard = () => {
  return (
    <div className={styles.wholeContainer}>
      <div className={styles.upperPart}>
        <h1>Admin Panel</h1>
      </div>
      <div className={styles.mapPortion}>
        <div className={styles.map}>
        <h1>Map</h1>
      </div>
      <div className={styles.adminButton}>
        <button className={` btn btn-danger`}>Problems</button>
        <button className={` btn btn-outline-success`}>Events</button>
        <button className={` btn btn-outline-success`}>Reward</button>
      </div>
      </div>

    </div>
  )
}

export default AdminDashboard
