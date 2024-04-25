import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import styles from "../styles/Data.module.css";

function Data() {
  const colors = [
    "rgba(255, 99, 132, 0.5)",  // red
    "rgba(54, 162, 235, 0.5)",  // blue
    "rgba(255, 206, 86, 0.5)",  // yellow
    "rgba(75, 192, 192, 0.5)",  // green
    "rgba(153, 102, 255, 0.5)", // purple
    "rgba(255, 159, 64, 0.5)"   // orange
  ];
  const chartOptions = {
    scales: { y: { beginAtZero: true } },
    animation: {
      duration: 5// general animation time
    },
    hover: {
      animationDuration: 5// duration of animations when hovering an item
    },
    responsiveAnimationDuration: 0 // animation duration after a resize
  };
  const [mockData, setHistorical] = useState([]);
  const [activeTab, setActiveTab] = useState('fillLevels');

  useEffect(() => {
    const getHistorical = () => {
      fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-historical-for-routes`, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          if (data.status) {
            setHistorical(data.data);
          } else {
            console.log(data.msg);
          }
        })
        .catch(e => console.log(e));
    };

    getHistorical();
  }, []);

 

  // function generateDynamicMockBins() {
  //   const currentDateTime = new Date();
  //   const startDateTime = new Date(currentDateTime.getTime() - 24 * 3600000);
  //   const mockBinsData = [];
  //   const binSpecifications = [
  //       { uniqueId: 56, fillRate: 1, startLevel: 9, hours: 6 },
  //       { uniqueId: 57, fillRate: 2, startLevel: 8, hours: 6 },
  //       { uniqueId: 58, fillRate: 9, startLevel: 10, hours: 6 },
  //       { uniqueId: 59, fillRate: 0.1, startLevel: 6, hours: 6 },
  //   ];
  
  //   binSpecifications.forEach(spec => {
  //       for (let i = 0; i <= spec.hours; i++) {
  //           let date = new Date(startDateTime.getTime() + i * 3600000);
  //           let level = Math.min(spec.startLevel + i * spec.fillRate, 75);
  //           mockBinsData.push({ unique_id: spec.uniqueId, level_in_percents: level, saved_time: date.toISOString() });
  //       }
  //   });
  //   return mockBinsData;
  // }
  // let mockData = generateDynamicMockBins();

  useEffect(() => {
    updateChartData();
  }, [mockData]);

  const updateChartData = () => {
    // Group data by unique_id to calculate average fill levels per device
    const groupedByDevice = mockData.reduce((acc, item) => {
      if (!acc[item.unique_id]) {
        acc[item.unique_id] = [];
      }
      acc[item.unique_id].push(item);
      return acc;
    }, {});
  
    // Create datasets for each unique device using a predefined color set
    const datasets = Object.keys(groupedByDevice).map((unique_id, index) => {
      const data = groupedByDevice[unique_id];
      const colorIndex = index % colors.length; // Cycle through colors if more devices than colors
      return {
        label: `Device ${unique_id}`,
        data: data.map(item => item.level_in_percents),
        borderColor: colors[colorIndex],
        backgroundColor: colors[colorIndex],
        fill: false,
        lineTension: 0.1
      };
    });
  
    setFillLevelsOverTime({
      labels: mockData.map(data => new Date(data.saved_time).toLocaleString()),
      datasets
    });
  
    // Update other charts as necessary
    const frequencyData = calculateFillEvents(mockData);
    setMostFrequentlyFilledBins({
      labels: Object.keys(frequencyData),
      datasets: [
        {
          label: "Number of Fill Cycles",
          data: Object.values(frequencyData),
          backgroundColor: "rgba(255, 205, 86, 0.2)",
          borderColor: "rgba(255, 205, 86, 1)",
        }
      ],
    });
  
    const pingCounts = mockData.reduce((acc, data) => {
      acc[data.unique_id] = (acc[data.unique_id] || 0) + 1;
      return acc;
    }, {});
  
    setPingsPerDevice({
      labels: Object.keys(pingCounts),
      datasets: [
        {
          label: "Number of Pings",
          data: Object.values(pingCounts),
          backgroundColor: "rgba(132, 99, 255, 0.2)",
          borderColor: "rgba(132, 99, 255, 1)",
        }
      ],
    });
  };
  

  const calculateFillEvents = (data) => {
    const events = {};
    data.forEach((point, index) => {
      if (point.level_in_percents < 10) {
        const next = data[index + 1];
        if (next && next.level_in_percents >= 75) {
          events[next.unique_id] = (events[next.unique_id] || 0) + 1;
        }
      }
    });
    return events;
  };

  const [fillLevelsOverTime, setFillLevelsOverTime] = useState({
    labels: [],
    datasets: []
  });

  const [mostFrequentlyFilledBins, setMostFrequentlyFilledBins] = useState({
    labels: [],
    datasets: []
  });

  const [pingsPerDevice, setPingsPerDevice] = useState({
    labels: [],
    datasets: []
  });

  return (
    <div className={styles.analytics_container}>
      <div className={styles.date_range_selector}>
        <button onClick={() => setActiveTab('fillLevels')}>Fill Levels Over Time</button>
        <button onClick={() => setActiveTab('frequentFills')}>Most Frequently Filled Bins</button>
        <button onClick={() => setActiveTab('pings')}>Number of Pings per Device</button>
      </div>
  
      <div className={styles.chart_container}>
        {activeTab === 'fillLevels' && (
          <div className={styles.chart}>
            <h2>Average Fill Levels Over Time</h2>
            <Line data={fillLevelsOverTime} options={chartOptions} />
          </div>
        )}
  
        {activeTab === 'frequentFills' && (
          <div className={styles.chart}>
            <h2>Most Frequently Filled Bins</h2>
            <Bar data={mostFrequentlyFilledBins} options={chartOptions} />
          </div>
        )}
  
        {activeTab === 'pings' && (
          <div className={styles.chart}>
            <h2>Number of Pings per Device</h2>
            <Bar data={pingsPerDevice} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Data;
