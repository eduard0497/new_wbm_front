import React, { useState, useEffect } from 'react';
import styles from '../styles/Routes.module.css';
import { devices } from '../aaa_samples/devices'; 

function Routes() {
    const [activeRoute, setActiveRoute] = useState(null);
    const [inProgressRoutes, setInProgressRoutes] = useState([]);
    const [inProgressBins, setInProgressBins] = useState([]);
    const [filters, setFilters] = useState({
        changeBattery: true,
        emptyBin: true,
        location: ''
    });
  const [filteredBins, setFilteredBins] = useState([]);

  const exampleLocations = ["North Section", "South Section", "East Section", "West Section"];
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
      workOrders.push(<div key={`${bin.id}-empty`}>Empty Bin</div>);
    }
    if (bin.battery < 25 && filters.changeBattery) {
      workOrders.push(<div key={`${bin.id}-battery`}>Change Battery</div>);
    }
    return workOrders.length > 0 ? workOrders : null;
  };

  const startRoute = () => {
    const newWorkOrdersInProgress = { ...workOrdersInProgress };
    filteredBins.forEach(bin => {
      if (!newWorkOrdersInProgress[bin.id]) {
        newWorkOrdersInProgress[bin.id] = [];
      }
      if (filters.changeBattery && bin.battery < 25) {
        newWorkOrdersInProgress[bin.id].push('Change Battery');
      }
      if (filters.emptyBin && bin.level >= 80) {
        newWorkOrdersInProgress[bin.id].push('Empty Bin');
      }
    });
    setWorkOrdersInProgress(newWorkOrdersInProgress);


    setActiveRoute(null); // Reset active route
    // Update in progress bins list
    setInProgressBins(prevBins => [...prevBins, ...filteredBins.map(bin => bin.id)]);
    // Add new route to in progress routes
    const newRouteId = Math.max(0, ...inProgressRoutes) + 1; // Generate new route ID
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

  return (
    <div className={styles.routesContainer}>
      <h1>Manage Routes</h1>
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
        <select name="location" value={filters.location} onChange={handleChange}>
          <option value="">All Locations</option>
          {exampleLocations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>

      <div className={styles.routeSection}>
        <h2>Route #1</h2>
        <div className={styles.binsList}>
          {filteredBins.map(bin => {
            const workOrders = renderWorkOrders(bin);
            return workOrders && (
              <div key={bin.id} className={styles.binItem}>
                <div>ID: {bin.id}</div>
                {workOrders}
              </div>
            );
          })}
        </div>
        <button 
          onClick={() => startRoute(1)} 
          className={styles.startRouteButton}
          disabled={activeRoute === 1}
        >
          Start Route
        </button>
      </div>
      {/* Additional routes can be added here */}

      <div className={styles.inProgressContainer}>
        <h2>In Progress</h2>
        {renderInProgressRoutes()}
      </div>
    </div>
  );
}

export default Routes;