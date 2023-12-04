import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MapView from "../comps/MapView";
import Feedback from "../comps/Feedback";
import ManageEmployees from "../comps/ManageEmployees";
import Routes from "../comps/Routes";
import Data from "../comps/Data.js";
import { devices } from "../aaa_samples/devices";
import { employees } from "../aaa_samples/employees";
import { feedbacks } from "../aaa_samples/feedbacks";
import styles from "../styles/Dashboard.module.css";
import 'bootstrap-icons/font/bootstrap-icons.css';


function AdminDashboard() {
  useEffect(() => {
    // Dynamically import the Bootstrap JS
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState("");
  const [cardContainerStyle, setCardContainerStyle] = useState({display: 'block'})

  const alerts = devices.filter((device) => device.level >= 80 || device.battery < 25);
  // Processing the real data for stats, activities, and alertsData
  const fullBins = devices.filter(device => device.level >= 80).length;
  const lowBattery = devices.filter(device => device.battery < 25).length;

  const AlertsPanel = ({ alerts }) => {
    return (
      <div className={styles.alerts_panel}>
        <h5>Alerts ({alerts.length})</h5>
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`
              ${styles.alert_item} 
              ${alert.message.includes('Full + Low Batt') ? styles.alert_combined : ''}
              ${alert.message.includes('Full') ? styles.alert_full : ''}
              ${alert.message.includes('Low Batt') ? styles.alert_low : ''}
            `}
          >
            {alert.message}
          </div>
        ))}
      </div>
    );
  };

  const QuickStats = ({ stats }) => {
    // stats
    return (
      <div className="quick-stats">
        {/* Render stats here */}
        <h5>Overview</h5>
        <div>Total Bins: {stats.totalBins}</div>
        <div>Full Bins: {stats.fullBins}</div>
        {/* any other stats */}
      </div>
    );
  };
  

  const RecentActivityFeed = ({ activities }) => {
    return (
      <div className="activity-feed">
        <h5>Recent Activity</h5>
        {activities.map((activity, index) => (
          <div key={index}>
            <div>Date: {activity.date}</div>
            <div>Bin: {activity.device}</div>
            <div>Description: {activity.description}</div>
          </div>
        ))}
      </div>
    );
  };

  // Dashboard cards
  const DashboardCards = () => (
    <div className={styles.dashboard}>

      {/* Card for MapView */}
      <div className={styles.card} onClick={() => setCurrentScreen("mapView")}>
      <i class="bi bi-trash"></i>
        <h3>Bins</h3>
      </div>

      {/* Card for Routes */}
      <div className={styles.card} onClick={() => setCurrentScreen("routes")}>
        <i className="bi bi-map"></i>
        <h3>Routes</h3>
      </div>

      {/* Card for Feedback */}
      <div className={styles.card} onClick={() => setCurrentScreen("feedback")}>
        <i className="bi bi-envelope-fill"></i>
        <h3>Feedback</h3>
      </div>

      {/* Additional cards as needed */}
    </div>
  );


  useEffect(() => {
    if (currentScreen === "") {
      setCardContainerStyle({ display: 'block' });
    } else {
      setCardContainerStyle({ display: 'none' });
    }
  }, [currentScreen]); // Only re-run the effect if currentScreen changes
  
  const showScreen = () => {
    switch (currentScreen) {
      case "mapView":
        return <MapView isAdmin={false} />;
      case "feedback":
        return <Feedback />;
      case "routes":
        return <Routes />;
      default:
        return null;
    }
  };

  // Call this function to go back to the dashboard view
  const goBackToDashboard = () => {
    setCurrentScreen("");
  };

  const stats = {
    totalBins: devices.length,
    fullBins: fullBins,
    lowBattery: lowBattery 
    // ... more stats
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const activities = feedbacks
  .filter(feedback => {
    const feedbackDate = new Date(feedback.date);
    return feedbackDate >= oneWeekAgo;
  })
  .map(feedback => ({
    date: feedback.date, // The date of the feedback
    device: feedback.device, // The device associated with the feedback
    description: feedback.description // The description of the feedback
  }));



  const alertsData = devices.map(device => {
    if (device.level >= 80 && device.battery < 25) {
      return { message: `Bin ${device.id}: Full + Low Batt` };
    } else if (device.level >= 80) {
      return { message: `Bin ${device.id}: Full` };
    } else if (device.battery < 25) {
      return { message: `Bin ${device.id}: Low Batt` };
    }
    return null;
  }).filter(alert => alert !== null); // Filter out the null entries

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" onClick={() => setCurrentScreen("")}href="#">WBM</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-center" id="navbarNavAltMarkup">
            <div className="navbar-nav">
            <button className="nav-link" onClick={() => setCurrentScreen("")}>
              <i className="bi bi-house"></i> Home
            </button>
            <button className="nav-link" aria-current="page" onClick={() => setCurrentScreen("mapView")}>
              <i className="bi bi-trash"></i>Bins
            </button>
            <button className="nav-link" aria-current="page" onClick={() => setCurrentScreen("routes")}>
              <i className="bi bi-map"></i> Routes
            </button>
            <button className="nav-link" onClick={() => setCurrentScreen("feedback")}>
              <i className="bi bi-envelope-fill"></i> Feedback
            </button>
            <button className="nav-link" onClick={() => router.push("/")}>
              <i className="bi bi-box-arrow-right"></i> Log Out
            </button>
            </div>
          </div>

        </div>
      </nav>

      {/* Sidebar with QuickStats, AlertsPanel, and RecentActivityFeed */}
      <div className={styles.sidebar}>
        {/* Quick Stats */}
        <div className={styles.stats_item}><QuickStats stats={stats} /></div>

      {/* Alerts Panel */}
      {alertsData.length > 0 && (
        <div className={styles.alerts_item}>
          <AlertsPanel alerts={alertsData} />
        </div>
      )}

      {/* Recent Activity Feed */}
      {activities.length > 0 && (
        <div className={styles.feed_item}>
          <RecentActivityFeed activities={activities} />
        </div>
      )}

      </div>

      
      <div className={`container ${styles.dashboardContainer}`}>
        <div className={styles.cardContainer} style={cardContainerStyle}>
        <DashboardCards />
          {/* ... */}
        </div>



        {/* Render the selected screen */}
        {showScreen()}
      </div>



      
    </>

  );
}

export default AdminDashboard;
