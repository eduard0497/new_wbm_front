import React, { useState, useEffect } from "react";
import styles from "../styles/Routes.module.css";
import MapView from "../comps/DevicesTab/MapView";

function Routes() {
  useEffect(() => {
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
            let devices = helperToConvertLevelToPercentage(data.devices);
            console.log(devices);
          }
        })
        .catch((e) => console.log(e));
    };
    getDevices();
  }, []);

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
              // checked={filters.changeBattery}
              // onChange={handleChange}
            />
            Change Battery
          </label>
          <label>
            <input
              type="checkbox"
              name="emptyBin"
              // checked={filters.emptyBin}
              // onChange={handleChange}
            />
            Empty Bin
          </label>
          <div className={styles.routeControls}>
            <div className={styles.estimatedTimeContainer}>
              Estimated time
              <select
                // value={travelMode}
                // onChange={(e) => setTravelMode(e.target.value)}
                className={styles.modeDropdown}
              >
                <option value="DRIVING">Driving</option>
                <option value="WALKING">Walking</option>
              </select>
              {/* : {estimatedTime} */}
            </div>
          </div>
          <button
            // onClick={() => startRoute(1)}
            className={styles.startRouteButton}
            // disabled={activeRoute === 1}
          >
            Start Route
          </button>
        </div>

        {/* <div className={styles.contentContainer}>
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
                        <strong>Device ID:</strong> {bin.id}
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
        </div> */}
      </div>

      {/* <div className={styles.inProgressContainer}>
        <h2>In Progress</h2>
        {renderInProgressRoutes()}
      </div> */}
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
    return device;
  });
  return tmpDevices;
};
