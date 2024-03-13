import React, { useState } from "react";
import styles from "../styles/DevicesContainer.module.css";

function MockData() {
  const [devices, setDevices] = useState([]);
  const getDevices = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/mock_get-devices`)
      .then((res) => res.json())
      .then((data) => {
        setDevices(data.devices);
      });
  };

  return (
    <div>
      <h1>MockData</h1>
      <button onClick={getDevices}>Get Devices</button>
      <table className={styles.devices_table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Unique ID</th>
            <th>Bin Height</th>
            <th>Level - measuered distance</th>
            <th>Battery</th>
            <th>Reception</th>
            <th>Lat</th>
            <th>Lng</th>
            <th>Timestamp</th>
            <th>Is Registered</th>
          </tr>
        </thead>

        <tbody>
          {devices.map((device) => (
            <TableRow key={device.id} device={device} getDevices={getDevices} />
          ))}
          <RowToAddDevice getDevices={getDevices} />
        </tbody>
      </table>
    </div>
  );
}

export default MockData;

const TableRow = ({ device, getDevices }) => {
  const [toggle, setToggle] = useState(false);

  //
  const [unique_id, setunique_id] = useState(device.unique_id);
  const [bin_height, setbin_height] = useState(device.bin_height);
  const [level, setlevel] = useState(device.level);
  const [battery, setbattery] = useState(device.battery);
  const [reception, setreception] = useState(device.reception);
  const [lat, setlat] = useState(device.lat);
  const [lng, setlng] = useState(device.lng);
  const [is_registered, setis_registered] = useState(device.is_registered);

  //
  const updateValues = (id) => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/mock_update-values`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        unique_id,
        bin_height,
        level,
        battery,
        reception,
        lat,
        lng,
        is_registered,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          getDevices();
          setToggle(false);
        }
      });
  };

  return (
    <>
      {!toggle ? (
        <tr>
          <td>{device.id}</td>
          <td>{device.unique_id}</td>
          <td>{device.bin_height}</td>
          <td>{device.level}</td>
          <td>{device.battery}</td>
          <td>{device.reception}</td>
          <td>{device.lat}</td>
          <td>{device.lng}</td>
          <td>{new Date(device.timestamp).toLocaleString()}</td>
          <td>{device.is_registered ? "TRUE" : "FALSE"}</td>
          <td>
            <button onClick={() => setToggle(!toggle)}>Toggle</button>
          </td>
        </tr>
      ) : (
        <tr>
          <td>{device.id}</td>
          <td>
            <input
              type="text"
              value={unique_id}
              onChange={(e) => setunique_id(parseInt(e.target.value))}
            />
          </td>
          <td>
            <input
              type="text"
              value={bin_height}
              onChange={(e) => setbin_height(parseInt(e.target.value))}
            />
          </td>
          <td>
            <input
              type="text"
              value={level}
              onChange={(e) => setlevel(parseInt(e.target.value))}
            />
          </td>
          <td>
            <input
              type="text"
              value={battery}
              onChange={(e) => setbattery(parseInt(e.target.value))}
            />
          </td>
          <td>
            <input
              type="text"
              value={reception}
              onChange={(e) => setreception(parseInt(e.target.value))}
            />
          </td>
          <td>
            <input
              type="text"
              value={lat}
              onChange={(e) => setlat(parseFloat(e.target.value))}
            />
          </td>
          <td>
            <input
              type="text"
              value={lng}
              onChange={(e) => setlng(parseFloat(e.target.value))}
            />
          </td>
          <td>{new Date(device.timestamp).toLocaleString()}</td>
          <td>
            {is_registered ? (
              <button onClick={() => setis_registered(false)}>
                UNREGISTER
              </button>
            ) : (
              <button onClick={() => setis_registered(true)}>REGISTER</button>
            )}
          </td>
          <td>
            <button onClick={() => updateValues(device.id)}>
              UPDATE VALUES
            </button>
          </td>
        </tr>
      )}
    </>
  );
};

const RowToAddDevice = ({ getDevices }) => {
  const [unique_id, setunique_id] = useState("");
  const [bin_height, setbin_height] = useState("");
  const [level, setlevel] = useState("");
  const [battery, setbattery] = useState("");
  const [reception, setreception] = useState("");
  const [lat, setlat] = useState("");
  const [lng, setlng] = useState("");
  const [is_registered, setis_registered] = useState(false);
  //
  const addDevice = () => {
    if (
      !unique_id ||
      !bin_height ||
      !level ||
      !battery ||
      !reception ||
      !lat ||
      !lng
    ) {
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/mock_add-device`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unique_id,
        bin_height,
        level,
        battery,
        reception,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        is_registered,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          setunique_id("");
          setbin_height("");
          setlevel("");
          setbattery("");
          setreception("");
          setlat("");
          setlng("");
          getDevices();

          console.log(data.msg);
        }
      });
  };
  //
  return (
    <tr>
      <td></td>
      <td>
        <input
          type="text"
          value={unique_id}
          onChange={(e) => setunique_id(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="text"
          value={bin_height}
          onChange={(e) => setbin_height(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="text"
          value={level}
          onChange={(e) => setlevel(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="text"
          value={battery}
          onChange={(e) => setbattery(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="text"
          value={reception}
          onChange={(e) => setreception(parseInt(e.target.value))}
        />
      </td>
      <td>
        <input
          type="text"
          value={lat}
          onChange={(e) => setlat(e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          value={lng}
          onChange={(e) => setlng(e.target.value)}
        />
      </td>
      <td></td>
      <td>
        {is_registered ? (
          <button onClick={() => setis_registered(false)}>UNREGISTER</button>
        ) : (
          <button onClick={() => setis_registered(true)}>REGISTER</button>
        )}
      </td>
      <td>
        <button onClick={addDevice}>ADD DEVICE</button>
      </td>
    </tr>
  );
};
