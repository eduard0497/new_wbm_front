import React from "react";
import styles from "../../styles/DevicesContainer.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBatteryQuarter, faTrash } from "@fortawesome/free-solid-svg-icons";

function ListView({ devices }) {
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

  return (
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
}

export default ListView;
