

import React, { useState } from "react";
import styles from "../styles/Feedback.module.css";
import { devices } from "../aaa_samples/devices";
import { feedbacks } from "../aaa_samples/feedbacks";

function Feedback() {


  const [sortedFeedbacks, setSortedFeedbacks] = useState(feedbacks);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredFeedbacks = searchTerm
  ? sortedFeedbacks.filter((feedback) =>
      Object.values(feedback).some((value) =>
        value.toString().toLowerCase().includes(searchTerm)
      )
    )
  : sortedFeedbacks;

  const sortFeedbacks = (key) => {
    let sortedData = [...feedbacks];
    let direction = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
      sortedData.reverse();
    } else {
      sortedData.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        
        // Check if the key is meant to be a number and parse it if so.
        if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
          valA = Number(valA);
          valB = Number(valB);
        }
        
        if (valA < valB) {
          return -1;
        }
        if (valA > valB) {
          return 1;
        }
        return 0;
      });
    }
  
    setSortedFeedbacks(sortedData);
    setSortConfig({ key, direction });
  };

  return (
<div>
{/* Feedback Form Container */}
<div className={styles.feedback_container}>
  <h1>Submit Feedback</h1>
  <select>
    <option value="">Select the device to report</option>
    {devices.map((device) => (
      <option key={device.id} value={device.id}>
        ID: {device.id}, Battery: {device.battery}%, Level: {device.level}%
      </option>
    ))}
  </select>
  <input type="text" placeholder="Issue Title..." />
  <textarea rows="5" placeholder="Describe the issue in detail..."></textarea>
  <button>Submit Feedback</button>
</div>

{/* Feedback Table and Search Container */}
<div className={styles.feedback_container}>
  <input
    type="text"
    placeholder="Search..."
    onChange={handleSearchChange}
    className={styles.search_input}
  />
  <table className={styles.feedback_table}>
    <thead>
      <tr>
        <th>Employee</th>
        <th onClick={() => sortFeedbacks('device')}>Device</th>
        <th onClick={() => sortFeedbacks('title')}>Title</th>
        <th>Description</th>
        <th onClick={() => sortFeedbacks('date')}>Date</th>
      </tr>
    </thead>
    <tbody>
      {filteredFeedbacks.length > 0 ? (
        filteredFeedbacks.map((feedback, index) => (
          <tr key={index}>
            <td>{feedback.employee}</td>
            <td>{feedback.device}</td>
            <td>{feedback.title}</td>
            <td>{feedback.description}</td>
            <td>{feedback.date}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="5" style={{ textAlign: 'center' }}>No feedback found.</td>
        </tr>
      )}
    </tbody>
  </table>
</div>
</div>
);
}
export default Feedback;



