import React, { useState } from "react";
import styles from "../../styles/DevicesContainer.module.css";
import {
  useLoadScript,
  GoogleMap,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer
} from "@react-google-maps/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBatteryQuarter, faTrash } from "@fortawesome/free-solid-svg-icons";


//Moved some map options outside functions to keep from refreshing to default every few seconds if changed by user
const mapCenter = { lat: 34.242245312686954, lng: -118.53043313617162 }; 
const mapOptions = {
  mapTypeId: 'satellite',
  clickableIcons: true,
  scrollwheel: true,
};

function MapView({ devices, mapWidth, mapHeight, directions }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const handleMarkerClick = (device) => {
    setSelectedMarker(device);
  };
  const zoomDistance = 16;


  const libraries = ["places"];
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY,
    libraries: libraries,
  });

  if (!isLoaded) {
    return <p>Loading...</p>;
  }

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

  const getStatusColor = (level, battery) => {
    if (level >= 80 && battery <= 25) {
      return "purple"; // Both full bin and low battery
    } else if (level >= 80) {
      return "red"; // Full bin
    } else if (battery <= 25) {
      return "orange"; // Low battery
    } else {
      return "green"; // No issues
    }
  };

  return (
    <div style={{ width: mapWidth, height: mapHeight }}>
      <GoogleMap
        options={mapOptions}
        zoom={zoomDistance}
        center={mapCenter}
        mapContainerStyle={{ width: mapWidth, height: mapHeight }}
        key={directions ? 'with-directions' : 'no-directions'}
      >
        {directions && <DirectionsRenderer directions={directions} />}
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
  );
}

export default MapView;
