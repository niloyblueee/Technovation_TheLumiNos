import React, { useState, useEffect } from "react";
import styles from "./AdminRewardPage.module.css";

const AdminRewardPage = () => {

  const [citizens, setCitizens] = useState([
    { id: 1, name: "Rahim Uddin", points: 2500 },
    { id: 2, name: "Karim Ali", points: 1800 },
    { id: 3, name: "Nasrin Akter", points: 3200 },
    { id: 4, name: "Hasan Mahmud", points: 2200 },
  ]);

  const [sortedCitizens, setSortedCitizens] = useState([]);

  useEffect(() => {
  
    const sorted = [...citizens].sort((a, b) => b.points - a.points);
    setSortedCitizens(sorted);
  }, [citizens]);

  const handleInvite = (citizen) => {
    alert(`Invitation sent to ${citizen.name} for the event!`);
    // here you could integrate API call for sending invite
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🏆 Admin Reward Dashboard</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Reward Points</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedCitizens.map((citizen, index) => (
            <tr key={citizen.id}>
              <td>{index + 1}</td>
              <td>{citizen.name}</td>
              <td>{citizen.points}</td>
              <td>
                <button
                  className={styles.inviteButton}
                  onClick={() => handleInvite(citizen)}
                >
                  Invite to Event
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRewardPage;
