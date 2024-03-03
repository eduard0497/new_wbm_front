import React, { useState, useEffect } from "react";
import styles from "../../styles/DevicesContainer.module.css";

import MapView from "./MapView";
import ListView from "./ListView";

function DevicesContainer({ isAdmin, devices }) {
  if (!devices) {
    return <h1>Unable to displaye the Devices Page</h1>;
  }

  const [view, setView] = useState("map");

  const map_list_toggle = () => {
    if (view === "map") {
      return <MapView devices={devices} />;
    } else if (view === "list") {
      return <ListView devices={devices} />;
    } else {
      return null;
    }
  };

  return (
    <div className={styles.map_container}>
      <RegisterNewBinModal />
      <div className={styles.view_toggle}>
        <button
          onClick={() => setView("map")}
          className={view === "map" ? styles.active : ""}
        >
          Map View
        </button>
        <button
          onClick={() => setView("list")}
          className={view === "list" ? styles.active : ""}
        >
          List View
        </button>
      </div>
      <MapLegend />
      {map_list_toggle()}
    </div>
  );
}

const MapLegend = () => (
  <div className={styles.mapLegend}>
    <div className={styles.legendItem}>
      <span
        className={styles.legendColorBox}
        style={{ backgroundColor: "orange" }}
      ></span>
      <span>Full bin + low battery</span>
    </div>
    <div className={styles.legendItem}>
      <span
        className={styles.legendColorBox}
        style={{ backgroundColor: "red" }}
      ></span>
      <span>Full bin</span>
    </div>
    <div className={styles.legendItem}>
      <span
        className={styles.legendColorBox}
        style={{ backgroundColor: "yellow" }}
      ></span>
      <span>Low battery</span>
    </div>
    <div className={styles.legendItem}>
      <span
        className={styles.legendColorBox}
        style={{ backgroundColor: "green" }}
      ></span>
      <span>No issues</span>
    </div>
  </div>
);

const RegisterNewBinModal = () => {
  const [showRegisterNewBinModal, setshowRegisterNewBinModal] = useState(false);
  const [loadingTempDevices, setloadingTempDevices] = useState(false);
  const [unknownDevices, setunknownDevices] = useState([]);

  const getTemporaryDevices = () => {
    setloadingTempDevices(true);
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-unknown-devices`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          console.log("Error");
        } else {
          setunknownDevices(data.unknown_devices);
        }
      });
    setloadingTempDevices(false);
  };

  useEffect(() => {
    getTemporaryDevices();
  }, []);

  return (
    <div className="container my-4">
      <div className={styles.register_button_container}>
        <button
          className={styles.active}
          onClick={() => setshowRegisterNewBinModal(!showRegisterNewBinModal)}
        >
          Register New Bin
        </button>

        {showRegisterNewBinModal && (
          <div className="container my-4">
            <button
              onClick={getTemporaryDevices}
              className={styles.green_button}
            >
              {loadingTempDevices ? <>Loading...</> : <>Refresh</>}
            </button>
            <br />
            <br />
            <div className={styles.unknown_devices_container}>
              {loadingTempDevices ? (
                <h1>Loading Unknown Devices...</h1>
              ) : (
                <>
                  {unknownDevices.length == 0 ? (
                    <h2>No unknown devices have been found yet</h2>
                  ) : (
                    unknownDevices.map((device) => {
                      return (
                        <UnknownBin
                          key={device.id}
                          device={device}
                          getTemporaryDevices={getTemporaryDevices}
                        />
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UnknownBin = ({ device, getTemporaryDevices }) => {
  const [lat, setlat] = useState("");
  const [lng, setlng] = useState("");
  const [binHeight, setbinHeight] = useState("");

  const clearInputs = () => {
    setlat("");
    setlng("");
    setbinHeight("");
  };

  const registerUnknownDevice = () => {
    fetch(
      `${process.env.NEXT_PUBLIC_SERVER_LINK}/employee-register-unknown-bin`,
      {
        method: "post",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: device.id,
          lat,
          lng,
          bin_height: parseInt(binHeight),
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          console.log(data.msg);
          getTemporaryDevices();
          clearInputs();
        }
      });
  };

  return (
    <div className={styles.unknown_devices_container_device}>
      <p>Device ID: {device.unique_id}</p>
      <p>Battery: {device.battery}</p>
      <p>Level: {device.level}</p>
      <p>Reception: {device.reception}</p>
      <p>Last Checked: {new Date(device.timestamp).toLocaleString()}</p>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setlat(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Longitude"
          value={lng}
          onChange={(e) => setlng(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Bin Height"
          value={binHeight}
          onChange={(e) => setbinHeight(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-between">
        <button className="btn btn-outline-secondary" onClick={clearInputs}>
          Clear
        </button>
        <button className="btn btn-primary" onClick={registerUnknownDevice}>
          Add Device
        </button>
      </div>
    </div>
  );
};

export default DevicesContainer;
