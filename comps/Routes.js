import React, { useState, useEffect, useLoadScript } from 'react';
import styles from '../styles/Routes.module.css';
import { devices } from '../aaa_samples/devices';
import MapView from '../comps/DevicesTab/MapView';

function Routes() {

    const [directions, setDirections] = useState(null);
    const [travelMode, setTravelMode] = useState('WALKING');
    const [estimatedTime, setEstimatedTime] = useState('');

    const [activeRoute, setActiveRoute] = useState(null);
    const [inProgressRoutes, setInProgressRoutes] = useState([]);
    const [inProgressBins, setInProgressBins] = useState([]);
    const [filters, setFilters] = useState({
        changeBattery: true,
        emptyBin: true,
        location: ''
    });
  const [filteredBins, setFilteredBins] = useState([]);


    // State to keep track of bins and their work orders in progress
  const [workOrdersInProgress, setWorkOrdersInProgress] = useState({});

  useEffect(() => {
    let filtered = devices.filter(device => {
      const isBatteryInProgress = workOrdersInProgress[device.id]?.includes('Change Battery');
      const isFullInProgress = workOrdersInProgress[device.id]?.includes('Empty Bin');

      const needsBatteryChange = !isBatteryInProgress && device.battery < 25;
      const needsEmptying = !isFullInProgress && device.level >= 80;

      return (filters.changeBattery && needsBatteryChange) ||
             (filters.emptyBin && needsEmptying);
    });

    setFilteredBins(filtered);
  }, [filters, workOrdersInProgress]); // Add workOrdersInProgress as a dependency

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderWorkOrders = (bin) => {
    const workOrders = [];
    if (bin.level >= 80 && filters.emptyBin) {
      workOrders.push(<div key={`${bin.id}-empty`} className={`${styles.workOrder} ${styles.emptyBin}`}>Empty Bin</div>);
    }
    if (bin.battery < 25 && filters.changeBattery) {
      workOrders.push(<div key={`${bin.id}-battery`} className={`${styles.workOrder} ${styles.lowBattery}`}>Change Battery</div>);
    }
    return workOrders;
  };

  const startRoute = () => {
    const newWorkOrdersInProgress = { ...workOrdersInProgress };
    const binIds = [];
    const workOrderTypes = new Set(); // To avoid duplicates

    filteredBins.forEach(bin => {
      if (!newWorkOrdersInProgress[bin.id]) {
        newWorkOrdersInProgress[bin.id] = [];
      }
      binIds.push(bin.id); // Collect bin IDs

      if (filters.changeBattery && bin.battery < 25) {
        newWorkOrdersInProgress[bin.id].push('Change Battery');
        workOrderTypes.add('Change Battery');
      }
      if (filters.emptyBin && bin.level >= 80) {
        newWorkOrdersInProgress[bin.id].push('Empty Bin');
        workOrderTypes.add('Empty Bin');
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
        status: 'in progress'
    };

    console.log("Route Data:", JSON.stringify(routeData, null, 2));

    setWorkOrdersInProgress(newWorkOrdersInProgress);
    setActiveRoute(null); // Reset active route
    setInProgressBins(prevBins => [...prevBins, ...filteredBins.map(bin => bin.id)]);
    // Add new route to in progress routes
    const newRouteId = routeData.routeNumber; // Use the generated route number
    setInProgressRoutes([...inProgressRoutes, newRouteId]);
  };


  const completeRoute = (routeId) => {
    // Mark route as completed
    setActiveRoute(null);
    setInProgressRoutes(inProgressRoutes.filter(id => id !== routeId));
  };

  // Function to render in-progress routes
  const renderInProgressRoutes = () => {
    return inProgressRoutes.map(routeId => (
      <div key={routeId} className={styles.inProgressRoute}>
        <div>Route #{routeId}</div>
        <button onClick={() => completeRoute(routeId)}>Complete Route</button>
      </div>
    ));
  };


  // Function to fetch directions
  const fetchDirections = () => {
      // Check if the Google Maps API is loaded
    if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined') {
      console.error('Google Maps API is not loaded yet.');
      setTimeout(fetchDirections, 1000);
      return; 
    }
    //Need at least two points for directions
    if (filteredBins.length < 2) {
      setDirections(null);
      setEstimatedTime('');
      return; 
    }
    
    const waypoints = filteredBins.slice(1, -1).map(bin => ({
      location: { lat: bin.lat, lng: bin.lng },
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route({
      origin: { lat: filteredBins[0].lat, lng: filteredBins[0].lng },
      destination: { lat: filteredBins[filteredBins.length - 1].lat, lng: filteredBins[filteredBins.length - 1].lng },
      waypoints: waypoints,
      travelMode: travelMode,
    }, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {

        setDirections(result);
        const duration = result.routes[0].legs.reduce((total, leg) => total + leg.duration.value, 0);
        setEstimatedTime(`${Math.floor(duration / 60)} minutes`);
      } else {
        console.error(`Directions request failed due to ${status}`);
      }
    });
  };


  // Fetch directions when the component mounts or when filteredBins or travelMode changes
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
        <MapView devices={filteredBins} mapWidth="600px" mapHeight="400px" directions={directions} />
        <div className={styles.routeSummaryAndControls}>

          <div className={styles.routeSummary}>
            <h3>Route Summary</h3>
            <p>Total Bins: {filteredBins.length}</p>

            <div className={styles.binsDetails}>
              {filteredBins.map(bin => {
                const workOrders = renderWorkOrders(bin);
                return (
                  <div key={bin.id} className={styles.binItem}>
                    <p><strong>Device ID:</strong> {bin.id}</p>
                    {workOrders.map(order => (
                      <p key={order.key} className={styles.workOrder}>{order}</p>
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


