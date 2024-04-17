// Data.js
import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import styles from "../styles/Data.module.css";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";

function Data() {
  // State to hold selected date range for analytics

  const [fillLevelsOverTime, setfillLevelsOverTime] = useState({
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [{ data: [65, 59, 80, 81] }],
  });

  const [mostFrequentlyFilledBins, setmostFrequentlyFilledBins] = useState({
    labels: ["Bin 1", "Bin 2", "Bin 3", "Bin 4", "Bin 5"],
    datasets: [{ data: [20, 45, 55, 20, 79] }],
  });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allHistorical, setallHistorical] = useState([]);

  const getHistorical = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-historical`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        startDate: !startDate ? null : new Date(startDate),
        endDate: !endDate ? null : new Date(endDate),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          setallHistorical(data.historicalData);
        }
      });
  };

  useEffect(() => {
    getHistorical();
  }, []);

  const resetDates = () => {
    setStartDate("")
    setEndDate("")
    getHistorical()
  }

  //
  //
  //
  //
  //
  //
  //
  //

  const fillLevelsData = {
    labels: fillLevelsOverTime.labels,
    datasets: [
      {
        label: "Fill Level %",
        data: fillLevelsOverTime.datasets[0].data,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
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
        label: "Number of Times Filled",
        data: mostFrequentlyFilledBins.datasets[0].data,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(255, 159, 64, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Options for the most frequently filled bins chart
  const mostFrequentBinsOptions = {
    indexAxis: "y", // Use the y-axis as the index axis (horizontal bar chart)
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
    const averageFill =
      binData.reduce((sum, current) => sum + current, 0) / binData.length;
    // Define a threshold for what we consider an outlier, e.g., ~50% above the average
    const outlierThreshold = averageFill * 1.8;

    const mostFilledBins = labels.filter(
      (_, index) => binData[index] === Math.max(...binData)
    );
    const leastFilledBins = labels.filter(
      (_, index) => binData[index] === Math.min(...binData)
    );

    let suggestions = [];
    binData.forEach((fillLevel, index) => {
      if (fillLevel > outlierThreshold) {
        suggestions.push(
          `${labels[index]} is filled significantly more often than average. Consider adding another bin in its area.`
        );
      }
    });

    return {
      mostFilledBins: mostFilledBins.join(", "),
      leastFilledBins: leastFilledBins.join(", "),
      suggestions,
    };
  };
  const insights = calculateInsights();

  return (
    <div className={styles.analytics_container}>
      {/* ... existing code for date range selectors ... */}
      <div className={styles.date_range_selector}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={getHistorical}>Display</button>
        <button onClick={resetDates}>Reset</button>
      </div>

      {/*  */}
      <div className={styles.chart_container}>
        <div className={styles.chart}>
          <h2>Average Fill Levels Over Time</h2>
          {!allHistorical.length ? null : (
            <LineChartComponent data={allHistorical} />
          )}
        </div>

        <div className={styles.chart}>
          <h2>Most Frequently Filled Bins</h2>
        </div>
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

const LineChartComponent = ({ data }) => {
  // Extracting unique_ids and week_numbers
  const uniqueIds = [...new Set(data.map((item) => item.unique_id))];
  const weekNumbers = [...new Set(data.map((item) => item.week_number))];

  // Prepare datasets
  const datasets = uniqueIds.map((uniqueId) => {
    const filteredData = data.filter((item) => item.unique_id === uniqueId);
    const dataPoints = weekNumbers.map((weekNumber) => {
      const dataPoint = filteredData.find(
        (item) => item.week_number === weekNumber
      );
      return dataPoint ? dataPoint.level_in_percents : null;
    });
    return {
      label: `unique_id ${uniqueId}`,
      data: dataPoints,
      fill: false,
      // borderColor: "#" + Math.floor(Math.random() * 16777215).toString(16), // Random color
    };
  });

  // Chart data
  const chartData = {
    labels: weekNumbers.map(String),
    datasets: datasets,
  };

  // Chart options
  const chartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Week Number",
        },
      },
      y: {
        title: {
          display: true,
          text: "Level in Percents",
        },
      },
    },
  };

  return <Line data={chartData} options={chartOptions} />;
};

// const BarChartComponent = ({ data }) => {
//   return (
//     <BarChart width={600} height={400} data={data}>
//       <CartesianGrid strokeDasharray="3 3" />
//       <XAxis dataKey="week_number" />
//       <YAxis />
//       <Tooltip />
//       <Legend />
//       {data.map((item) => (
//         <Bar
//           key={item.unique_id}
//           dataKey={`level_in_percents_${item.unique_id}`}
//           fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
//         />
//       ))}
//     </BarChart>
//   );
// };
