import React, { useState, useEffect } from "react";
import styles from "../styles/ManageEmployees.module.css";
import { employees } from "../aaa_samples/employees";

function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State to manage sorted data and sorting direction
  const [sortedEmployees, setSortedEmployees] = useState(employees);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Load employees data
  useEffect(() => {
    setIsLoading(true);

    const useFetchEmployees = () => {
      fetch("http://localhost:3000/get-employees")
        .then((res) => res.json())
        .then((info) => {
          setEmployees(info);
          setSortedEmployees(info);
        })
        .catch((e) => setError(e));
    };

    useFetchEmployees();
    setIsLoading(false);
  }, []);

  // Function to handle sorting
  const sortData = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    let sortedData = [...employees]; // Copy the original array to avoid mutating state directly
    sortedData.sort((a, b) => {
      if (key === "id") {
        // For numeric values
        return direction === "ascending" ? a[key] - b[key] : b[key] - a[key];
      } else if (key === "start_date") {
        // For dates
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return direction === "ascending" ? dateA - dateB : dateB - dateA;
      } else {
        // For strings
        const aValue =
          key === "lname" ? a.lname.toLowerCase() : a[key].toLowerCase();
        const bValue =
          key === "lname" ? b.lname.toLowerCase() : b[key].toLowerCase();
        if (aValue < bValue) {
          return direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "ascending" ? 1 : -1;
        }
      }
      return 0;
    });
    setSortedEmployees(sortedData);
    setSortConfig({ key, direction });
  };

  // Function to handle the Add Employee button click
  const handleAddEmployee = () => {
    //Logic for add employee
    console.log("Add Employee button clicked");
  };

  // Function to handle the View Logs button/link click
  const handleViewLogs = () => {
    //logic for view logs
    console.log("View Logs clicked");
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error loading data</p>;
  }

  return (
    <div className={styles.manage_employees_container}>
      <h1>Manage Employees</h1>
      <button className={styles.button} onClick={handleAddEmployee}>
        Add Employee
      </button>
      <button className={styles.button} onClick={handleViewLogs}>
        View Logs
      </button>
      <table className={styles.employees_table}>
        <thead>
          <tr>
            <th onClick={() => sortData("id")}>ID</th>
            <th onClick={() => sortData("lname")}>Name</th>
            <th onClick={() => sortData("email")}>Email</th>
            <th onClick={() => sortData("role")}>Role</th>
            <th onClick={() => sortData("start_date")}>Employee Since</th>
            {/* Add other headers here */}
          </tr>
        </thead>
        <tbody>
          {sortedEmployees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{`${employee.fname} ${employee.lname}`}</td>
              <td>{employee.email}</td>
              <td>{employee.role}</td>
              <td>{ new Date(employee.start_date).toLocaleDateString() }</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageEmployees;
