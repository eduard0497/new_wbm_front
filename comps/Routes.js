import React, { useState, useEffect } from "react";
import styles from "../styles/Routes.module.css";
import styles1 from "../styles/DevicesContainer.module.css";
import MapView from "./DevicesTab/MapView";
import {
  calculateFillRate,
  estimateHoursUntilFull,
  predictFullTime,
  binsDueForPickup,
  findLowFillRateBins
} from "../utils/binPredictions";

function Routes() {
  const [devices, setDevices] = useState([]);
  const [predictedDevices, setPredictedDevices] = useState([]);
  const [newPredicted, setNewPredicted] = useState([]);
  const [historical, setHistorical] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [travelMode, setTravelMode] = useState("WALKING");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [directions, setDirections] = useState(null);
  const [devicesToWorkOn, setDevicesToWorkOn] = useState(devices);
  const [allRoutes, setAllRoutes] = useState([]);
  let fillRates;
  let numHours;
  let predictedTimes;
  let lowFillRateBins;

  useEffect(() => {
    if (predictedDevices.length > 0 && allDevices.length > 0) {
      const updatedDevices = allDevices.filter(device =>
        predictedDevices.includes(device.unique_id)
      );
      setNewPredicted(updatedDevices);  // Thsis will update the map display
    }
  }, [predictedDevices, allDevices]);





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
          let tmpAll = helperToConvertLevelToPercentage(data.devices);
          setAllDevices(tmpAll);
          const filteredDevices = pickDevicesWithIssues(tmpAll);
          setDevices(filteredDevices);
        }
      })
      .catch((e) => console.log(e));
  };



  const getDevicesHistorical = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-historical-for-routes`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          setHistorical(data.data);
        }
      })
      .catch((e) => console.log(e));
  };


  useEffect(() => {
    if(historical.length > 0) {
      // console.log("Historical data: ", historical);
       fillRates = calculateFillRate(historical);
      // console.log("Fill rates: ", fillRates);
       numHours = estimateHoursUntilFull(historical, fillRates);
       //console.log("Num hours: ", numHours);
       predictedTimes = predictFullTime(historical, numHours);
       //console.log("Predicted tiemstamp: ", predictedTimes);
       let tmpArray = binsDueForPickup(predictedTimes, 6);
       setPredictedDevices(tmpArray);
       
       lowFillRateBins = findLowFillRateBins(fillRates);
       //console.log("Low fill rate: ", lowFillRateBins);
       
     }
  }, [historical])


  const mergeAndSetDevices = (filteredDevices) => {
    const filteredIds = new Set(filteredDevices.map((device) => device.unique_id));
    const uniquePredictedDevices = newPredicted.filter(device => !filteredIds.has(device.unique_id));
    const combinedDevices = [...filteredDevices, ...uniquePredictedDevices];
    setDevices(combinedDevices);
  }

  useEffect(() => {
    // Ensure both newPredicted and allDevices are not empty
    if (newPredicted.length > 0 && allDevices.length > 0) {
      const filteredDevices = pickDevicesWithIssues(allDevices);
      mergeAndSetDevices(filteredDevices);
    }
  }, [newPredicted, allDevices]); 

  useEffect(() => {
    getDevices();
    getDevicesHistorical();
  }, []);

  const [filters, setFilters] = useState({
    changeBattery: true,
    emptyBin: true,
  });

  const handleFilterChange = (e) => {
    const { name, checked, type } = e.target;
    console.log(`Filter changed: ${name}, Checked: ${checked}`);
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: type === "checkbox" ? checked : e.target.value,
    }));
  };
  


  useEffect(() => {
    const filterDevices = () => {

      const filtered = devices.filter((device) => {
        const needsBatteryChange = device.battery < 25;
        const needsEmptying = device.level >= 80;
        const isPredicted = predictedDevices.includes(device.unique_id);

        return (
          (filters.changeBattery && needsBatteryChange) ||
          (filters.emptyBin && (needsEmptying || isPredicted))
        );
      });
      setDevicesToWorkOn(filtered);
    };
    filterDevices();
  }, [filters, devices]);

  const fetchDirections = () => {
    if (devicesToWorkOn.length < 2) {
      setDirections(null);
      setEstimatedTime("");
      return;
    }

    const waypoints = devicesToWorkOn.slice(1, -1).map((bin) => ({
      location: { lat: bin.lat, lng: bin.lng },
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: devicesToWorkOn[0].lat, lng: devicesToWorkOn[0].lng },
        destination: {
          lat: devicesToWorkOn[devicesToWorkOn.length - 1].lat,
          lng: devicesToWorkOn[devicesToWorkOn.length - 1].lng,
        },
        waypoints: waypoints,
        travelMode: travelMode,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const duration = result.routes[0].legs.reduce(
            (total, leg) => total + leg.duration.value,
            0
          );
          setEstimatedTime(`${Math.floor(duration / 60)} minutes`);
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  };

  useEffect(() => {
    if (
      typeof window.google === "undefined" ||
      typeof window.google.maps === "undefined"
    ) {
      console.error("Google Maps API is not loaded yet.");
      return;
    } else {
      fetchDirections();
    }
  }, [devicesToWorkOn, travelMode, filters]);

  const decideWorkToDo = (bin) => {
    let emptyBin = false;
    let changeBattery = false;

    if (filters.emptyBin && bin.level >= 80) {
      emptyBin = true;
    }

    if (filters.changeBattery && bin.battery < 25) {
      changeBattery = true;
    }

    return {
      emptyBin,
      changeBattery,
    };
  };

  const renderWorkToDo = () => {
    if (!devicesToWorkOn.length) return;

    return devicesToWorkOn.map((device) => {
      return (
        <div key={device.id} className={styles.binItem}>
          <p>
            <strong>Device ID:</strong> {device.unique_id}
          </p>
          <div key={device.id} className={styles.workOrder}>
            {decideWorkToDo(device).emptyBin && (
              <div
                key={`${device.unique_id}-empty`}
                className={`${styles.workOrder} ${styles.emptyBin}`}
              >
                Empty Bin
              </div>
            )}
            {decideWorkToDo(device).changeBattery && (
              <div
                key={`${device.unique_id}-battery`}
                className={`${styles.workOrder} ${styles.lowBattery}`}
              >
                Change Battery
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const createRoute = () => {
    if (!devicesToWorkOn.length) return;

    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/create-route`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        route: devicesToWorkOn,
        whatToDo: filters,
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          console.log(data.msg);
          getRoutes();
        }
      });
  };



  const getRoutes = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-routes`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          setAllRoutes(data.routes);
        }
      });
  };

  useEffect(() => {
    getRoutes();
  }, []);

  const startRoute = (id) => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/start-route`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          console.log(data.msg);
          getRoutes();
        }
      });
  };

  const finishRoute = (id) => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/finish-route`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          console.log(data.msg);
          getRoutes();
        }
      });
  };

  const deleteRoute = (id) => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/delete-route`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          console.log(data.msg);
          getRoutes();
        }
      });
  };

  return (
    <div className={styles.routesContainer}>
      <h1>Manage Routes</h1>

      <div className={styles.routeSection}>
        <h2>Route #1</h2>
        <div className={styles.filtersContainer}>
          <label>
            <input
              type="checkbox"
              name="changeBattery"
              checked={filters.changeBattery}
              onChange={handleFilterChange}
            />
            Change Battery
          </label>
          <label>
            <input
              type="checkbox"
              name="emptyBin"
              checked={filters.emptyBin}
              onChange={handleFilterChange}
            />
            Empty Bin
          </label>
          <div className={styles.routeControls}>
            <div className={styles.estimatedTimeContainer}>
              Estimated time
              <select
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value)}
                className={styles.modeDropdown}
              >
                <option value="DRIVING">Driving</option>
                <option value="WALKING">Walking</option>
              </select>
              : {estimatedTime}
            </div>
          </div>
          <button
            onClick={createRoute}
            className={styles.startRouteButton}
            // disabled={activeRoute === 1}
          >
            Start Route
          </button>
        </div>

        <div className={styles.contentContainer}>
          <MapView
            devices={devices}
            mapWidth="600px"
            mapHeight="400px"
            directions={directions}
          />
          <div className={styles.routeSummaryAndControls}>
            <div className={styles.routeSummary}>
              <h3>Route Summary</h3>
              <p>Total Bins: {devices.length}</p>
              {renderWorkToDo()}
            </div>
          </div>
        </div>
      </div>

      <table className={styles1.devices_table}>
        <thead>
          <tr>
            <th>Route ID</th>
            <th>Created By</th>
            <th>Bin Id's</th>
            <th>Status</th>
            <th>Created at</th>
            <th>Started</th>
            <th>Finished</th>
            <th>Controls</th>
          </tr>
        </thead>
        <tbody>
          {allRoutes.map((route) => {
            return (
              <tr key={route.id} className={styles.inProgressRoute}>
                <td>{route.id}</td>
                <td>{route.fname + " " + route.lname}</td>
                <td>{route.deviceids.map((deviceid) => deviceid + " ")}</td>
                <td>{route.status}</td>
                <td>{new Date(route.timestamp).toLocaleString()}</td>
                <td>
                  {route.started !== null
                    ? new Date(route.started).toLocaleString()
                    : null}
                </td>
                <td>
                  {route.finished !== null
                    ? new Date(route.finished).toLocaleString()
                    : null}
                </td>
                <td>
                  {route.status === "pending" ? (
                    <button
                      onClick={() => {
                        startRoute(route.id);
                      }}
                    >
                      Start
                    </button>
                  ) : null}
                  {route.status === "started" ? (
                    <button onClick={() => finishRoute(route.id)}>
                      Complete
                    </button>
                  ) : null}
                  {route.status === "finished" ? (
                    <button onClick={() => deleteRoute(route.id)}>
                      Delete
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Routes;

const helperToConvertLevelToPercentage = (devices) => {
  let tmpDevices = devices.map((device) => {
    let distanceInCM = device.level;
    let binHeight = device.bin_height;
    let trashHeight = binHeight - distanceInCM;
    device.level = parseInt((trashHeight * 100) / binHeight);
    device.lat = parseFloat(device.lat);
    device.lng = parseFloat(device.lng);
    return device;
  });
  return tmpDevices;
};

const pickDevicesWithIssues = (devices) => {
  let tmpDevices = devices.filter((device) => {
    return device.level >= 80 || device.battery <= 25;
  });
  return tmpDevices;
};
