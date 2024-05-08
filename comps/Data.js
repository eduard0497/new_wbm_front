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
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import 'jspdf-autotable';


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
  const [devicePings, setDevicePings] = useState({}); 
  const [deviceInsights, setDeviceInsights] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedPanel, setExpandedPanel] = useState(null);

  const togglePanel = (id) => {
    setExpandedPanel(expandedPanel === id ? null : id);
  };


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
    const pings = {}; // Object to track pings per device
    const insights = {};
  
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
      pings[unique_id] = data.length;

      // Analyze data for insights
      let anomalies = new Map();
      let rapidChanges = [];
      let previousItem = null;

      data.forEach(item => {
        if (item.level_in_percents < 0 || item.level_in_percents > 100) {
          anomalies.set(item.saved_time.toLocaleString(), `${item.level_in_percents}%`);
        }
        if (previousItem && Math.abs(previousItem.level_in_percents - item.level_in_percents) > 30) {
          rapidChanges.push({
            from: previousItem.level_in_percents,
            to: item.level_in_percents,
            start: previousItem.saved_time.toLocaleString(),
            end: item.saved_time.toLocaleString()
          });
        }
        previousItem = item;
      });

    // Summarize anomalies and rapid changes
    insights[unique_id] = {
      totalAnomalies: anomalies.size,
      totalRapidChanges: rapidChanges.length,
      commonAnomalies: summarizeAnomalies(anomalies),
      frequentRapidChangesSummary: summarizeRapidChanges(rapidChanges)
    };
    }
    
  
    setFillLevelsOverTime({
      datasets
    });
    setLastSavedTimes(lastTimes); // Update state with the last saved times
    setDevicePings(pings);
    setDeviceInsights(insights);
  };

  const summarizeAnomalies = (anomalies) => {
    const summary = {};
    anomalies.forEach((level, time) => {
      if (!summary[level]) {
        summary[level] = {
          count: 0,
          times: []
        };
      }
      summary[level].count++;
      summary[level].times.push(time);
    });
    return Object.entries(summary).map(([level, data]) => ({
      level: level,
      occurrences: data.count,
      times: data.times.join(", ") // Joining times into a string for display
    }));
  };
  
  const summarizeRapidChanges = (changes) => {
    const summary = {};
    changes.forEach(change => {
      const key = `${change.from}% to ${change.to}%`;
      if (!summary[key]) {
        summary[key] = []; // Initialize the array if it doesn't exist
      }
      summary[key].push(`between ${change.start} and ${change.end}`); // Now safely push the item
    });
    return summary;
  };

  const downloadCSV = (data, filename) => {
    const csvRows = ['Device ID,Type,Detail,Occurrences,Times']; // Added Device ID in header
    data.forEach(item => {
      const row = `${item.deviceId},${item.type},${item.detail},${item.occurrences},${item.times}`;
      csvRows.push(row);
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleDownload = async (deviceId) => {
    const zip = new JSZip();
    const currentDate = new Date().toISOString().slice(0, 10); // Format as YYYY-MM-DD
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    const pageHeight = pdf.internal.pageSize.height;
    
    // Setup PDF
    pdf.setFontSize(16);
    pdf.text('WBM Manager\'s Report', 105, 20, null, null, 'center');
    pdf.setFontSize(12);
    pdf.text(`Date Range: ${startDate} to ${endDate}`, 105, 30, null, null, 'center');
    pdf.setLineWidth(0.5);
    pdf.line(20, 35, 190, 35); // Add a line for separation

    
    // Add the chart
    const chart = document.querySelector('canvas');
    if (chart) {
      const chartImg = chart.toDataURL('image/png');
      pdf.addImage(chartImg, 'PNG', 15, 40, 180, 90);
    }
    
    let yPos = 140; // Start position for device insights
  
    // Generate device insights
    Object.keys(deviceInsights).forEach((id, index) => {
      const { commonAnomalies, frequentRapidChangesSummary } = deviceInsights[id];
      if (yPos >= 260) { // Check if near the end of the page
        pdf.addPage();
        yPos = 20; // Reset y position for new page
      }
  
      pdf.setFontSize(14);
      pdf.text(`Device ${id} Insights:`, 15, yPos);
      yPos += 10;
  
      pdf.setFontSize(11);
      pdf.text(`Total Pings: ${devicePings[id]}`, 15, yPos);
      yPos += 10;
  
      // Details of anomalies
      pdf.setFontSize(11);
      pdf.text('Out of Range:', 15, yPos);
      yPos += 5;
      pdf.setFontSize(10);
      pdf.autoTable({
        startY: yPos,
        theme: 'grid',
        head: [['Level', 'Occurrences', 'Times']],
        body: deviceInsights[id].commonAnomalies.map(anomaly => [anomaly.level, anomaly.occurrences, anomaly.times]),
        margin: { left: 15, right: 15 },
        tableWidth: 180,
        styles: {
          cellWidth: 'wrap',
          fontSize: 8,
          cellPadding: 1,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [74, 85, 104], // RGB equivalent of #4a5568
          textColor: [255, 255, 255], // White text color
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 110 }
        },
      });
      yPos = pdf.lastAutoTable.finalY + 10;
  
      if (yPos >= pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
  
      // Details of rapid changes
      pdf.text('Rapid Changes:', 15, yPos);
      yPos += 5;
      pdf.autoTable({
        startY: yPos,
        theme: 'grid',
        head: [['Change', 'Details']],
        body: Object.entries(deviceInsights[id].frequentRapidChangesSummary).map(([change, times]) => [change, times.join(", ")]),
        margin: { left: 15, right: 15 },
        tableWidth: 180,
        styles: {
          cellWidth: 'wrap',
          fontSize: 8,
          cellPadding: 1,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [74, 85, 104], // RGB equivalent of #4a5568
          textColor: [255, 255, 255], // White text color
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 120 }
        },
      });
      yPos = pdf.lastAutoTable.finalY + 10;
  
      // Add a footer on each page
      pdf.setFontSize(10);
      pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, 105, 287, null, null, 'center'); // Page number at the bottom
  
      // Generate CSV for each device
      const anomaliesData = commonAnomalies.map(anomaly => ({
        deviceId: id,
        type: 'Out of Range',
        detail: anomaly.level,
        occurrences: anomaly.occurrences,
        times: anomaly.times
      }));
      const changesData = Object.entries(frequentRapidChangesSummary).map(([change, times]) => ({
        deviceId: id,
        type: 'Rapid Change',
        detail: change,
        occurrences: times.length,
        times: times.join(", ")
      }));
      const combinedData = [...anomaliesData, ...changesData];
      const csvRows = ['Device ID,Type,Detail,Occurrences,Times'];
      combinedData.forEach(item => {
        csvRows.push(`${item.deviceId},${item.type},${item.detail},${item.occurrences},${item.times}`);
      });
      const csvString = csvRows.join('\n');
      zip.file(`Device_${id}_Insights_${currentDate}.csv`, csvString);
    });
  
    // Add PDF to ZIP
    const pdfBlob = pdf.output("blob");
    zip.file("WBM_Manager's_Report.pdf", pdfBlob);
  
    // Generate ZIP
    zip.generateAsync({ type: "blob" }).then(function(content) {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "WBM_Report.zip";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className={styles.analytics_container}>
      <div className={styles.date_range_selector}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <div className={styles.chart_container}>
        {activeTab === 'fillLevels' && (
          <div className={styles.chart}>
            <h2>Fill Levels Over Time</h2>
            <Line data={fillLevelsOverTime} options={chartOptions} />
          </div>
        )}
      </div>

        <div className={styles.insights_container}>


        <h2 className={styles.insights_heading}>Device Insights</h2>
        <div className={styles.downloadContainer}>
          <button className={styles.downloadButton} onClick={() => handleDownload(null)}>Download Summary Data</button>
          </div>

        {Object.entries(deviceInsights).map(([id, insight]) => (
          <div key={id} className={styles.insight}>
            <h3 onClick={() => togglePanel(id)}>
              Device {id} <span>{expandedPanel === id ? '-' : '+'}</span>
            </h3>
            {expandedPanel === id && (
              <div>
                <div>
                <strong>Total Pings:</strong> {devicePings[id]}
                  <h4>Out of Range</h4>
                  {/* <p><strong>Total Data Points Out of Range:</strong> {insight.totalAnomalies}</p> */}
                  <table className={styles.insights_table}>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Occurrences</th>
                      <th>Times</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insight.commonAnomalies.map(anomaly => (
                      <tr key={`${id}-${anomaly.level}`}>
                        <td>{anomaly.level}</td>
                        <td>{anomaly.occurrences}</td>
                        <td>{anomaly.times}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div>
                  <h4>Rapid Changes</h4>
                  {/* <p><strong>Total Rapid Changes:</strong> {insight.totalRapidChanges}</p> */}
                  <table className={styles.insights_table}>
                    <thead>
                      <tr>
                        <th>Change</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(insight.frequentRapidChangesSummary).map(([change, times]) => (
                        <tr key={change}>
                          <td>{change}</td>
                          <td>{times.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button className={styles.red_button} onClick={clearHistorical}>
        Clear Historical Data
      </button>
    </div>
  );
}
export default Data;

