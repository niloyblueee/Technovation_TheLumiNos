import React, { useState } from 'react'
import styles from './GovtProblemPage.module.css'

const GovtProblemPage = () => {
  // sample issues
  const issues = [
    { name: 'Fire', status: 'Verified' },
    { name: 'Water Leakage', status: 'Assigned' },
    { name: 'Gas Leakage', status: 'In Progress' },
    { name: 'Road Broken', status: 'Resolved' },
    { name: 'Road Blockage', status: 'Verified' },
    { name: 'Moving Difficulty', status: 'Assigned' }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Problems</h2>
      </div>

      <div className={styles.body}>
        <div className={styles.heatmap}>
          <p>HeatMap</p>
        </div>

        <div className={styles.issueList}>
          <h4>Issues & Progress</h4>
          {issues.map((issue) => (
            <div className={styles.issueRow} key={issue.name}>
              <button className={`${styles.listBtn} btn btn-outline-danger`}>
                {issue.name}
              </button>
              <span className={styles.progressText}>
                {issue.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GovtProblemPage
