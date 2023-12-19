import React, { useState, useEffect } from "react";
import styles from "../styles/Feedback.module.css";
// import { devices } from "../aaa_samples/devices";
import { feedbacks } from "../aaa_samples/feedbacks";

function Feedback() {
  const [devices, setdevices] = useState([]);
  const [sortedFeedbacks, setSortedFeedbacks] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [searchTerm, setSearchTerm] = useState("");

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
    let direction = "ascending";

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
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

  const [deviceIdForFeedback, setdeviceIdForFeedback] = useState("");
  const [deviceTitleForFeedback, setdeviceTitleForFeedback] = useState("");
  const [deviceDescriptionForFeedback, setdeviceDescriptionForFeedback] =
    useState(``);

  const clearInputs = () => {
    setdeviceIdForFeedback("");
    setdeviceTitleForFeedback("");
    setdeviceDescriptionForFeedback(``);
  };

  const getDevices = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-devices`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          setdevices(data.devices);
        }
      })
      .catch((e) => setError(e));
  };

  const getFeedbacks = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-feedbacks`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setSortedFeedbacks(data.feedbacks);
      });
  };

  const addFeedback = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/add-feedback`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        uniqueID: deviceIdForFeedback,
        title: deviceTitleForFeedback,
        description: deviceDescriptionForFeedback,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          setSortedFeedbacks(data.feedbacks);
          console.log(data.msg);
          clearInputs();
        }
      });
  };

  useEffect(() => {
    try {
      getDevices();
      getFeedbacks();
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <div>
      {/* Feedback Form Container */}
      <div className={styles.feedback_container}>
        <h1>Submit Feedback</h1>
        <select
          value={deviceIdForFeedback}
          onChange={(e) => setdeviceIdForFeedback(e.target.value)}
        >
          <option value="">Select the device to report</option>
          {devices.map((device) => (
            <option key={device.id} value={device.unique_id}>
              ID: {device.unique_id}, Battery: {device.battery}%, Level:{" "}
              {device.level}%
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Issue Title..."
          value={deviceTitleForFeedback}
          onChange={(e) => setdeviceTitleForFeedback(e.target.value)}
        />
        <textarea
          rows="5"
          placeholder="Describe the issue in detail..."
          value={deviceDescriptionForFeedback}
          onChange={(e) => setdeviceDescriptionForFeedback(e.target.value)}
        ></textarea>
        <button onClick={addFeedback}>Submit Feedback</button>
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
              <th onClick={() => sortFeedbacks("device")}>Device</th>
              <th onClick={() => sortFeedbacks("title")}>Title</th>
              <th>Description</th>
              <th onClick={() => sortFeedbacks("date")}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((feedback) => (
                <tr key={feedback.id}>
                  <td>{feedback.reported_by_name}</td>
                  <td>{feedback.device_id}</td>
                  <td>{feedback.title}</td>
                  <td>{feedback.description}</td>
                  <td>{new Date(feedback.timestamp).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No feedback found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Feedback;
