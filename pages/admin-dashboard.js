import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DevicesContainer from "../comps/DevicesTab/DevicesContainer";
import Feedback from "../comps/Feedback";
import ManageEmployees from "../comps/ManageEmployees";
import Data from "../comps/Data.js";
import Routes from "../comps/Routes";
// import { devices } from "../aaa_samples/devices";
import { feedbacks } from "../aaa_samples/feedbacks";
import styles from "../styles/Dashboard.module.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import socketIO from "socket.io-client";
const socket = socketIO.connect(process.env.NEXT_PUBLIC_SERVER_LINK);

function AdminDashboard() {
  const [currentUser, setcurrentUser] = useState(null);
  const [devices, setdevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("");
  const [cardContainerStyle, setCardContainerStyle] = useState({
    display: "block",
  });

  useEffect(() => {
    setLoading(true);
    // Dynamically import the Bootstrap JS
    import("bootstrap/dist/js/bootstrap.bundle.min.js");

    const getUserInfo = () => {
      fetch(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/verify-user-upon-entering`,
        {
          method: "post",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setcurrentUser(data.userInfo);
        })
        .catch((e) => console.log(e));
    };

    getUserInfo();
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleData = (data) => {
      try {
        let tmpDevices = data.map((device) => {
          let distanceInCM = device.level;
          let binHeight = device.bin_height;
          let trashHeight = binHeight - distanceInCM;
          device.level = parseInt((trashHeight * 100) / binHeight);
          return device;
        });
        setdevices(tmpDevices);
      } catch (error) {
        console.log(error);
      }
    };

    socket.on("request_data", handleData);

    return () => {
      socket.off("request_data", handleData);
    };
  }, [socket]);

  useEffect(() => {
    if (currentScreen === "") {
      setCardContainerStyle({ display: "block" });
    } else {
      setCardContainerStyle({ display: "none" });
    }
  }, [currentScreen]);

  const showScreen = () => {
    switch (currentScreen) {
      case "mapView":
        return <DevicesContainer isAdmin={true} devices={devices} />;
      case "routes":
        return <Routes />;
      case "employees":
        return <ManageEmployees />;
      case "feedback":
        return <Feedback />;
      case "data":
        return <Data />;
      default:
        return null;
    }
  };

  if (loading || !currentUser) {
    return <h1>LOADING...</h1>;
  }

  return (
    <>
      <Navbar currentUser={currentUser} setCurrentScreen={setCurrentScreen} />

      {/* Sidebar with QuickStats, AlertsPanel, and RecentActivityFeed */}
      <div className={styles.sidebar}>
        <QuickStats devices={devices} />
        <AlertsPanel devices={devices} />
        <RecentActivityFeed feedbacks={feedbacks} />
      </div>

      <div className={`container ${styles.dashboardContainer}`}>
        <div className={styles.cardContainer} style={cardContainerStyle}>
          <DashboardCards
            role={currentUser.role}
            setCurrentScreen={setCurrentScreen}
          />
        </div>

        {/* Render the selected screen */}
        {showScreen()}
      </div>
    </>
  );
}

export default AdminDashboard;

const Navbar = ({ currentUser, setCurrentScreen }) => {
  const router = useRouter();
  const logout = async () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/logout`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => response.json())
      .then(async (data) => {
        console.log(data.msg);
        await router.push("/");
      });
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <a
          className="navbar-brand"
          onClick={() => setCurrentScreen("")}
          href="#"
        >
          WBM
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className="collapse navbar-collapse justify-content-center"
          id="navbarNavAltMarkup"
        >
          <div className="navbar-nav">
            <button className="nav-link" onClick={() => setCurrentScreen("")}>
              <i className="bi bi-house"></i> Home
            </button>
            {currentUser.role === "admin" ? (
              <button
                className="nav-link"
                onClick={() => setCurrentScreen("data")}
              >
                <i className="bi bi-bar-chart-fill"></i> Data
              </button>
            ) : null}
            <button
              className="nav-link"
              aria-current="page"
              onClick={() => setCurrentScreen("mapView")}
            >
              <i className="bi bi-trash"></i> Bins
            </button>
            <button
              className="nav-link"
              aria-current="page"
              onClick={() => setCurrentScreen("routes")}
            >
              <i className="bi bi-map"></i> Routes
            </button>
            {currentUser.role === "admin" ? (
              <button
                className="nav-link"
                onClick={() => setCurrentScreen("employees")}
              >
                <i className="bi bi-people-fill"></i> Employees
              </button>
            ) : null}
            <button
              className="nav-link"
              onClick={() => setCurrentScreen("feedback")}
            >
              <i className="bi bi-envelope-fill"></i> Feedback
            </button>
            <button className="nav-link" onClick={logout}>
              <i className="bi bi-box-arrow-right"></i> Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const DashboardCards = ({ role, setCurrentScreen }) => (
  <div className={styles.dashboard}>
    {/* Card for Data */}
    {role === "admin" ? (
      <div className={styles.card} onClick={() => setCurrentScreen("data")}>
        <i className="bi bi-bar-chart-fill"></i>
        <h3>Data</h3>
      </div>
    ) : null}

    {/* Card for MapView */}
    <div className={styles.card} onClick={() => setCurrentScreen("mapView")}>
      <i className="bi bi-trash"></i>
      <h3>Bins</h3>
    </div>

    {/* Card for Routes */}
    <div className={styles.card} onClick={() => setCurrentScreen("routes")}>
      <i className="bi bi-map"></i>
      <h3>Routes</h3>
    </div>

    {/* Card for Employees */}
    {role === "admin" ? (
      <div
        className={styles.card}
        onClick={() => setCurrentScreen("employees")}
      >
        <i className="bi bi-people-fill"></i>
        <h3>Employees</h3>
      </div>
    ) : null}

    {/* Card for Feedback */}
    <div className={styles.card} onClick={() => setCurrentScreen("feedback")}>
      <i className="bi bi-envelope-fill"></i>
      <h3>Feedback</h3>
    </div>

    {/* Additional cards as needed */}
  </div>
);

const AlertsPanel = ({ devices }) => {
  const alerts = devices
    .map((device) => {
      if (device.level >= 80 && device.battery < 25) {
        return { message: `Bin ${device.unique_id}: Full + Low Batt` };
      } else if (device.level >= 80) {
        return { message: `Bin ${device.unique_id}: Full` };
      } else if (device.battery < 25) {
        return { message: `Bin ${device.unique_id}: Low Batt` };
      }
      return null;
    })
    .filter((alert) => alert !== null); // Filter out the null entries

  if (alerts.length > 0) {
    return (
      <div className={styles.alerts_item}>
        <div className={styles.alerts_panel}>
          <h5>Alerts ({alerts.length})</h5>
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`
                ${styles.alert_item} 
                ${
                  alert.message.includes("Full + Low Batt")
                    ? styles.alert_combined
                    : ""
                }
                ${alert.message.includes("Full") ? styles.alert_full : ""}
                ${alert.message.includes("Low Batt") ? styles.alert_low : ""}
              `}
            >
              {alert.message}
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    return null;
  }
};

const QuickStats = ({ devices }) => {
  const fullBins = devices.filter((device) => device.level >= 80).length;
  const lowBattery = devices.filter((device) => device.battery < 25).length;
  const stats = {
    totalBins: devices.length,
    fullBins: fullBins,
    lowBattery: lowBattery,
  };
  // stats
  return (
    <div className={styles.stats_item}>
      <div className="quick-stats">
        {/* Render stats here */}
        <h5>Overview</h5>
        <div>Total Bins: {stats.totalBins}</div>
        <div>Full Bins: {stats.fullBins}</div>
        {/* add any other stats */}
      </div>
    </div>
  );
};

const RecentActivityFeed = ({ feedbacks }) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const activities = feedbacks
    .filter((feedback) => {
      const feedbackDate = new Date(feedback.date);
      return feedbackDate >= oneWeekAgo;
    })
    .map((feedback) => ({
      date: feedback.date, // The date of the feedback
      device: feedback.device, // The device associated with the feedback
      description: feedback.description, // The description of the feedback
    }));

  if (activities.length > 0) {
    return (
      <div className={styles.feed_item}>
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
      </div>
    );
  } else {
    return null;
  }
};
