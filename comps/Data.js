// Data.js
import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import styles from '../styles/Data.module.css';

function Data() {




  // State to hold selected date range for analytics
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  // Dummy data for the charts
  const fillLevelsOverTime = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [{ data: [65, 59, 80, 81] }]
  };

  const mostFrequentlyFilledBins = {
    labels: ["Bin 1", "Bin 2", "Bin 3", "Bin 4", "Bin 5"],
    datasets: [{ data: [20, 45, 55, 20, 79] }]
  };

  // Dummy data for the fill levels over time chart
  const fillLevelsData = {
    labels: fillLevelsOverTime.labels,
    datasets: [
      {
        label: 'Fill Level %',
        data: fillLevelsOverTime.datasets[0].data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Options for the fill levels over time chart
  const fillLevelsOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Dummy data for the most frequently filled bins chart
  const mostFrequentBinsData = {
    labels: mostFrequentlyFilledBins.labels,
    datasets: [
      {
        label: 'Number of Times Filled',
        data: mostFrequentlyFilledBins.datasets[0].data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Options for the most frequently filled bins chart
  const mostFrequentBinsOptions = {
    indexAxis: 'y', // Use the y-axis as the index axis (horizontal bar chart)
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };


  const calculateInsights = () => {
    const binData = mostFrequentlyFilledBins.datasets[0].data;
    const labels = mostFrequentlyFilledBins.labels;
    
    // Calculate the average fill level
    const averageFill = binData.reduce((sum, current) => sum + current, 0) / binData.length;
    // Define a threshold for what we consider an outlier, e.g., ~50% above the average
    const outlierThreshold = averageFill * 1.8;
  
    const mostFilledBins = labels.filter((_, index) => binData[index] === Math.max(...binData));
    const leastFilledBins = labels.filter((_, index) => binData[index] === Math.min(...binData));
    
    let suggestions = [];
    binData.forEach((fillLevel, index) => {
      if (fillLevel > outlierThreshold) {
        suggestions.push(`${labels[index]} is filled significantly more often than average. Consider adding another bin in its area.`);
      }
    });
  
    return {
      mostFilledBins: mostFilledBins.join(", "),
      leastFilledBins: leastFilledBins.join(", "),
      suggestions
    };
  };
  const insights = calculateInsights();
  

  return (
    <div className={styles.analytics_container}>
      {/* ... existing code for date range selectors ... */}

      {/* Placeholder for Graphs and Charts */}
      <div className={styles.chart_container}>
        {/* Chart for fill levels over time */}
        <div className={styles.chart}>
          <h2>Avg Fill Levels Over Time</h2>
          <Line data={fillLevelsData} options={fillLevelsOptions} />
        </div>

        {/* Chart for most frequently filled bins */}
        <div className={styles.chart}>
          <h2>Most Frequently Filled Bins</h2>
          <Bar data={mostFrequentBinsData} options={mostFrequentBinsOptions} />
        </div>

        {/* Additional charts as needed */}
      </div>

{/* Insights Section */}
<div className={styles.insights_container}>
  <h2 className={styles.insights_heading}>Insights</h2>
  
  <div className={styles.insight}>
    <h3>Bins Summary</h3>
    <div>
      <p>Most Filled:</p>
      <ul>
        {insights.mostFilledBins.split(", ").map((bin, index) => (
          <li key={index}>{bin}</li>
        ))}
      </ul>
    </div>
    <div>
      <p>Least Filled:</p>
      <ul>
        {insights.leastFilledBins.split(", ").map((bin, index) => (
          <li key={index}>{bin}</li>
        ))}
      </ul>
    </div>
  </div>

  {insights.suggestions.length > 0 && (
    <div className={styles.insight}>
      <h3>Suggestions</h3>
      {insights.suggestions.map((suggestion, index) => (
        <p key={index}>{suggestion}</p>
      ))}
    </div>
  )}
</div>

    </div>
  );
}

export default Data;