import React, { useState, useEffect } from "react";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,

);
import 'chartjs-adapter-date-fns';
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
    scales: {
      y: {
        beginAtZero: true
      },
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MM/dd/yyyy HH:mm',
          displayFormats: {
            hour: 'HH:mm',
            day: 'MM/dd/yyyy'
          }
        },
        ticks: {
          source: 'auto',
          autoSkip: true,
          maxTicksLimit: 20
        }
      }
    },
    animation: {
      duration: 5
    },
    hover: {
      animationDuration: 5
    },
    responsiveAnimationDuration: 0
  };
  
  const [mockData, setHistorical] = useState([]);
  const [activeTab, setActiveTab] = useState('fillLevels');
  const [fillLevelsOverTime, setFillLevelsOverTime] = useState({
    labels: [],
    datasets: []
  });
  const [lastSavedTimes, setLastSavedTimes] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  console.log(mockData);


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

            // Calculate start and end dates based on the fetched data
            const dates = data.data.map(item => new Date(item.saved_time));
            const minDate = dates.length ? new Date(Math.min(...dates)) : new Date();
            const maxDate = dates.length ? new Date(Math.max(...dates)) : new Date();

            setStartDate(minDate.toISOString().split('T')[0]);
            setEndDate(maxDate.toISOString().split('T')[0]);
          } else {
            console.log(data.msg);
          }
        })
        .catch(e => console.log(e));
    };

    getHistorical();
  }, []);


  const clearHistorical = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/clear-all-historical`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.status) {
          alert(data.msg);
        } else {
          getHistorical();
        }
      });
  };
 
  useEffect(() => {
    updateChartData();
  }, [mockData, startDate, endDate]);




  /////////////////////////////////////
  const updateChartData = () => {

    const filteredData = mockData.filter(item => {
      const itemDate = new Date(item.saved_time);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return itemDate >= start && itemDate <= end;
    });
    console.log(filteredData);
    const groupedByDevice = filteredData.reduce((acc, item) => {
      if (!acc[item.unique_id]) {
        acc[item.unique_id] = { data: [], lastSavedTime: null };
      }
      // Create a new Date object from the saved_time
      const itemDate = new Date(item.saved_time);
      // Calculate timezone offset in milliseconds
      const adjust = itemDate.getTimezoneOffset() * 60 * 1000;
      // Adjust the date by the timezone offset
      const dateToSave = new Date(itemDate.getTime() + adjust);
  
      acc[item.unique_id].data.push({
        ...item,
        saved_time: dateToSave // Store the adjusted date back in the item
      });
  
      // Check and update the last saved time for this device
      if (!acc[item.unique_id].lastSavedTime || dateToSave > acc[item.unique_id].lastSavedTime) {
        acc[item.unique_id].lastSavedTime = dateToSave;
      }
      return acc;
    }, {});
  
    const datasets = [];
    const lastTimes = {};
  
    for (const [unique_id, { data, lastSavedTime }] of Object.entries(groupedByDevice)) {
      const colorIndex = unique_id % colors.length;
      datasets.push({
        label: `Device ${unique_id}`,
        data: data.map(item => ({
          x: item.saved_time, // Use the adjusted timestamp
          y: item.level_in_percents // Data value
        })),
        borderColor: colors[colorIndex],
        backgroundColor: colors[colorIndex],
        fill: false,
        lineTension: 0.1
      });
      // Store the last saved time for display
      lastTimes[unique_id] = lastSavedTime.toLocaleString();
    }
  
    setFillLevelsOverTime({
      datasets
    });
    setLastSavedTimes(lastTimes); // Update state with the last saved times
  };

  return (
    <div className={styles.analytics_container}>
      <div className={styles.date_range_selector}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <button className={styles.red_button} onClick={clearHistorical}>
        Clear Historical Data
      </button>
      <div className={styles.chart_container}>
        {activeTab === 'fillLevels' && (
          <div className={styles.chart}>
            <h2>Average Fill Levels Over Time</h2>
            <Line data={fillLevelsOverTime} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}
export default Data;

