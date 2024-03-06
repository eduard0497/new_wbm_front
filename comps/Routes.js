import React, { useState, useEffect } from "react";
import styles from "../styles/Routes.module.css";
import MapView from "../comps/DevicesTab/MapView";

function Routes() {
  const [devices, setDevices] = useState([]);
  const [directions, setDirections] = useState(null);
  const [travelMode, setTravelMode] = useState("WALKING");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [activeRoute, setActiveRoute] = useState(null);
  const [inProgressRoutes, setInProgressRoutes] = useState([]);
  const [inProgressBins, setInProgressBins] = useState([]);
  const [filters, setFilters] = useState({
    changeBattery: true,
    emptyBin: true,
    location: "",
  });
  const [filteredBins, setFilteredBins] = useState([]);
  const [workOrdersInProgress, setWorkOrdersInProgress] = useState({});

  useEffect(() => {
    if (devices.length === 0) {
      fetchDevices();
    }
  }, []);

  const fetchDevices = () => {
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
          const allDevices = helperToConvertLevelToPercentage(data.devices);
          const filteredDevices = pickDevicesWithIssues(allDevices);
          setDevices(filteredDevices);
        }
      })
      .catch((e) => console.log(e));
  };

  useEffect(() => {
    const filtered = devices.filter((device) => {
      const isBatteryInProgress =
        workOrdersInProgress[device.unique_id]?.includes("Change Battery");
      const isFullInProgress =
        workOrdersInProgress[device.unique_id]?.includes("Empty Bin");

      const needsBatteryChange = !isBatteryInProgress && device.battery < 25;
      const needsEmptying = !isFullInProgress && device.level >= 80;

      return (
        (filters.changeBattery && needsBatteryChange) ||
        (filters.emptyBin && needsEmptying)
      );
    });

    setFilteredBins(filtered);
  }, [devices, filters, workOrdersInProgress]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const renderWorkOrders = (bin) => {
    const workOrders = [];

    if (filters.emptyBin && bin.level >= 80) {
      workOrders.push(
        <div
          key={`${bin.unique_id}-empty`}
          className={`${styles.workOrder} ${styles.emptyBin}`}
        >
          Empty Bin
        </div>
      );
    }

    if (filters.changeBattery && bin.battery < 25) {
      workOrders.push(
        <div
          key={`${bin.unique_id}-battery`}
          className={`${styles.workOrder} ${styles.lowBattery}`}
        >
          Change Battery
        </div>
      );
    }

    return workOrders;
  };

  const startRoute = () => {
    const newWorkOrdersInProgress = { ...workOrdersInProgress };
    const binIds = [];
    const workOrderTypes = new Set(); // To avoid duplicates

    filteredBins.forEach((bin) => {
      if (!newWorkOrdersInProgress[bin.unique_id]) {
        newWorkOrdersInProgress[bin.unique_id] = [];
      }
      binIds.push(bin.unique_id); // Collect bin IDs

      if (filters.changeBattery && bin.battery < 25) {
        newWorkOrdersInProgress[bin.unique_id].push("Change Battery");
        workOrderTypes.add("Change Battery");
      }
      if (filters.emptyBin && bin.level >= 80) {
        newWorkOrdersInProgress[bin.unique_id].push("Empty Bin");
        workOrderTypes.add("Empty Bin");
      }
    });

    // Assuming you have a way to get the current employee's information
    const currentEmployee = "EmployeeNameOrID"; // Placeholder for employee identification

    const routeData = {
      routeNumber: Math.max(0, ...inProgressRoutes) + 1,
      employee: currentEmployee,
      bin_ids: binIds,
      workOrderTypes: Array.from(workOrderTypes),
      start_time: new Date().toISOString(),
      status: "in progress",
    };

    console.log("Route Data:", JSON.stringify(routeData, null, 2));

    setWorkOrdersInProgress(newWorkOrdersInProgress);
    setActiveRoute(null); // Reset active route
    setInProgressBins((prevBins) => [
      ...prevBins,
      ...filteredBins.map((bin) => bin.unique_id),
    ]);
    // Add new route to in progress routes
    const newRouteId = routeData.routeNumber; // Use the generated route number
    setInProgressRoutes([...inProgressRoutes, newRouteId]);
  };

  const completeRoute = (routeId) => {
    // Mark route as completed
    setActiveRoute(null);
    setInProgressRoutes(inProgressRoutes.filter((id) => id !== routeId));
  };

  // Function to render in-progress routes
  const renderInProgressRoutes = () => {
    return inProgressRoutes.map((routeId) => (
      <div key={routeId} className={styles.inProgressRoute}>
        <div>Route #{routeId}</div>
        <button onClick={() => completeRoute(routeId)}>Complete Route</button>
      </div>
    ));
  };

  // Function to fetch directions
  const fetchDirections = () => {
    // Check if the Google Maps API is loaded
    if (
      typeof window.google === "undefined" ||
      typeof window.google.maps === "undefined"
    ) {
      console.error("Google Maps API is not loaded yet.");
      setTimeout(fetchDirections, 1000);
      return;
    }
    //Need at least two points for directions
    if (filteredBins.length < 2) {
      setDirections(null);
      setEstimatedTime("");
      return;
    }

    const waypoints = filteredBins.slice(1, -1).map((bin) => ({
      location: { lat: bin.lat, lng: bin.lng },
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: filteredBins[0].lat, lng: filteredBins[0].lng },
        destination: {
          lat: filteredBins[filteredBins.length - 1].lat,
          lng: filteredBins[filteredBins.length - 1].lng,
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
    fetchDirections();
  }, [filteredBins, travelMode]);

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
              onChange={handleChange}
            />
            Change Battery
          </label>
          <label>
            <input
              type="checkbox"
              name="emptyBin"
              checked={filters.emptyBin}
              onChange={handleChange}
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
            onClick={() => startRoute(1)}
            className={styles.startRouteButton}
            disabled={activeRoute === 1}
          >
            Start Route
          </button>
        </div>

        <div className={styles.contentContainer}>
          <MapView
            devices={filteredBins}
            mapWidth="600px"
            mapHeight="400px"
            directions={directions}
          />
          <div className={styles.routeSummaryAndControls}>
            <div className={styles.routeSummary}>
              <h3>Route Summary</h3>
              <p>Total Bins: {filteredBins.length}</p>

              <div className={styles.binsDetails}>
                {filteredBins.map((bin) => {
                  const workOrders = renderWorkOrders(bin);
                  return (
                    <div key={bin.id} className={styles.binItem}>
                      <p>
                        <strong>Device ID:</strong> {bin.unique_id}
                      </p>
                      {workOrders.map((order) => (
                        <p key={order.key} className={styles.workOrder}>
                          {order}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.inProgressContainer}>
        <h2>In Progress</h2>
        {renderInProgressRoutes()}
      </div>
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
