import React, { useState, useEffect } from "react";
import {
  useLoadScript,
  GoogleMap,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import styles from "../styles/MapView.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBatteryQuarter, faTrash } from "@fortawesome/free-solid-svg-icons";
import socketIO from "socket.io-client";
const socket = socketIO.connect(process.env.NEXT_PUBLIC_SERVER_LINK);

function MapView({ isAdmin }) {
  const [showRegisterNewBinModal, setshowRegisterNewBinModal] = useState(false);

  // State for devices and loading/error handling
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // socket load devices data
  useEffect(() => {
    try {
      socket.on("request_data", (data) => {
        let tmpDevices = data;
        tmpDevices.map((device) => {
          let distanceInCM = device.level;
          let binHeight = device.bin_height;
          let trashHeight = binHeight - distanceInCM;
          device.level = trashHeight / binHeight;
          // if (trashHeight > binHeight) {
          //   device.level = 100;
          // } else {
          //   device.level = parseInt((trashHeight * 100) / binHeight);
          // }
        });
        setDevices(tmpDevices);
      });
    } catch (error) {
      setError(error);
    }
  }, [socket]);

  // Other existing state variables
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [view, setView] = useState("map"); // 'map' or 'list'
  //display list view
  const [activeDevice, setActiveDevice] = useState(null); // To track the active device for submenu

  const handleMarkerClick = (device) => {
    setSelectedMarker(device);
  };

  // Google Maps settings
  const zoomDistance = 16;
  const mapWidth = "800px";
  const mapHeight = "800px";
  const mapCenter = { lat: 34.242245312686954, lng: -118.53043313617162 };
  const mapOptions = {
    disableDefaultUI: true,
    clickableIcons: true,
    scrollwheel: true,
  };
  const libraries = ["places"];
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY,
    libraries,
  });

  // Function to determine the marker icon based on the bin's level and battery
  const getMarkerIcon = (level, battery) => {
    const color = getStatusColor(level, battery);
    // Return the marker configuration with the determined color
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      scale: 8,
      strokeColor: "white",
      strokeWeight: 2,
    };
  };

  const renderStatusIcons = (level, battery) => {
    const icons = [];
    if (battery <= 25) {
      icons.push(
        <FontAwesomeIcon
          key="battery"
          icon={faBatteryQuarter}
          className={styles.icon}
        />
      ); // Low battery icon
    }
    if (level >= 80) {
      icons.push(
        <FontAwesomeIcon key="bin" icon={faTrash} className={styles.icon} />
      ); // Full bin icon
    }
    return icons;
  };
  // or list: Updated function to determine the class based on device's level and battery
  const getListItemClass = (level, battery) => {
    if (level >= 80 && battery <= 25) {
      return styles.list_item_critical; // Both full bin and low battery
    } else if (level >= 80) {
      return styles.list_item_full; // Full bin
    } else if (battery <= 25) {
      return styles.list_item_low_battery; // Low battery
    } else {
      return styles.list_item_ok; // No issues
    }
  };

  //for map
  const getStatusColor = (level, battery) => {
    if (level >= 80 && battery <= 25) {
      return "orange"; // Both full bin and low battery
    } else if (level >= 80) {
      return "red"; // Full bin
    } else if (battery <= 25) {
      return "yellow"; // Low battery
    } else {
      return "green"; // No issues
    }
  };

  // render the legend for the map
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

  const renderListView = () => (
    <div className={styles.list_container}>
      {/*  */}
      <table className={styles.devices_table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Alerts</th>
            <th>Bin Height</th>
            <th>Level</th>
            <th>Battery</th>
            <th>Last Checked</th>
            <th>Reception</th>
            <th>Controls</th>
          </tr>
        </thead>

        <tbody>
          {devices.map((device) => (
            <tr
              key={device.id}
              className={`${getListItemClass(device.level, device.battery)}`}
            >
              <td>{device.unique_id}</td>
              <td>
                <div className={styles.list_item_icons}>
                  {renderStatusIcons(device.level, device.battery)}
                </div>
              </td>
              <td>{device.bin_height}</td>
              <td>{device.level}%</td>
              <td>{device.battery}%</td>
              <td>{new Date(device.timestamp).toLocaleString()}</td>
              <td>{device.reception}</td>
              <td className={styles.devices_table_control_buttons}>
                <button className={styles.submenu_button}>
                  Submit Feedback
                </button>
                <button className={styles.submenu_button}>
                  View Historical Data
                </button>
              </td>
              {/* Add other data cells here */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!isLoaded || isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error loading data</p>;
  }

  return (
    <div className={styles.map_container}>
      {/* Conditionally render the register button if isAdmin is true */}
      {isAdmin && (
        <div className={styles.register_button_container}>
          <button
            className={styles.active}
            onClick={() => setshowRegisterNewBinModal(!showRegisterNewBinModal)}
          >
            Register New Bin
          </button>
          {showRegisterNewBinModal && (
            <RegisterNewBinModal setDevices={setDevices} />
          )}
        </div>
      )}
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
      {/* Render the legend component */}
      <MapLegend />
      {view === "map" ? (
        <div style={{ width: mapWidth, height: mapHeight }}>
          <GoogleMap
            options={mapOptions}
            zoom={zoomDistance}
            center={mapCenter}
            mapTypeId={window.google.maps.MapTypeId.ROADMAP}
            mapContainerStyle={{ width: mapWidth, height: mapHeight }}
          >
            {devices.map((device) => {
              const icon = getMarkerIcon(device.level, device.battery);
              return (
                <React.Fragment key={device.id}>
                  <MarkerF
                    position={{
                      lat: parseFloat(device.lat),
                      lng: parseFloat(device.lng),
                    }}
                    icon={icon}
                    onClick={() => handleMarkerClick(device)}
                  />
                  {selectedMarker === device && (
                    <InfoWindowF
                      position={{
                        lat: parseFloat(device.lat),
                        lng: parseFloat(device.lng),
                      }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className={styles.infoWindow}>
                        {renderStatusIcons(device.level, device.battery)}
                        <p>ID: {device.unique_id}</p>
                        <p>Battery: {device.battery}%</p>
                        <p>Level: {device.level}%</p>
                        <p>Checked: {device.last_updated}</p>
                        <button className={styles.infoButton}>
                          Submit Feedback
                        </button>
                        <button className={styles.infoButton}>
                          View Historical Data
                        </button>
                      </div>
                    </InfoWindowF>
                  )}
                </React.Fragment>
              );
            })}
          </GoogleMap>
        </div>
      ) : (
        renderListView()
      )}
    </div>
  );
}

const RegisterNewBinModal = () => {
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
    <div className="container my-5">
      <div className={styles.unknown_devices_container}>
        {loadingTempDevices ? (
          <h1>Loading Unknown Devices...</h1>
        ) : (
          <>
            {unknownDevices.length == 0
              ? null
              : unknownDevices.map((device) => {
                  return (
                    <UnknownBin
                      key={device.id}
                      device={device}
                      getTemporaryDevices={getTemporaryDevices}
                    />
                  );
                })}
          </>
        )}
      </div>
    </div>
  );
};

export default MapView;

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
