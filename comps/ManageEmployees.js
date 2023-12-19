import React, { useState, useEffect } from "react";
import styles from "../styles/ManageEmployees.module.css";

function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State to manage sorted data and sorting direction
  const [sortedEmployees, setSortedEmployees] = useState(employees);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [showAddEmployee, setshowAddEmployee] = useState(false);

  const getAllEmployees = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-employees`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((info) => {
        setEmployees(info);
        setSortedEmployees(info);
      })
      .catch((e) => setError(e));
  };

  // Load employees data
  useEffect(() => {
    setIsLoading(true);

    const useFetchEmployees = () => {
      fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/get-employees`, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
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

  const handleViewLogs = () => {
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
      <button
        className={styles.button}
        onClick={() => setshowAddEmployee(!showAddEmployee)}
      >
        Add Employee
      </button>
      <button className={styles.button} onClick={handleViewLogs}>
        View Logs
      </button>
      {showAddEmployee && (
        <AddEmployeeModal getAllEmployees={getAllEmployees} />
      )}
      <table className={styles.employees_table}>
        <thead>
          <tr>
            <th onClick={() => sortData("id")}>ID</th>
            <th onClick={() => sortData("lname")}>Name</th>
            <th onClick={() => sortData("email")}>Email</th>
            <th onClick={() => sortData("role")}>Role</th>
            <th onClick={() => sortData("start_date")}>Employee Since</th>
          </tr>
        </thead>
        <tbody>
          {sortedEmployees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{`${employee.fname} ${employee.lname}`}</td>
              <td>{employee.email}</td>
              <td>{employee.role}</td>
              <td>{new Date(employee.start_date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const AddEmployeeModal = ({ getAllEmployees }) => {
  const [fname, setfname] = useState("");
  const [lname, setlname] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [start_date, setstart_date] = useState("");
  const [keyToAddAdmin, setkeyToAddAdmin] = useState("");

  const clearInputs = () => {
    setfname("");
    setlname("");
    setemail("");
    setpassword("");
    setstart_date("");
    setkeyToAddAdmin("");
  };

  const addAdmin = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/register_admin`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fname,
        lname,
        email,
        password,
        start_date,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          clearInputs();
          getAllEmployees();
          console.log(data.msg);
        }
      });
  };

  const addEmployee = () => {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/register_employee`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fname,
        lname,
        email,
        password,
        start_date,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          console.log(data.msg);
        } else {
          clearInputs();
          getAllEmployees();
          console.log(data.msg);
        }
      });
  };

  return (
    <div className="container my-5">
      <div className="card mx-auto">
        <div className="card-body">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="First Name"
              value={fname}
              onChange={(e) => setfname(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Last Name"
              value={lname}
              onChange={(e) => setlname(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setemail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setpassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="KEY"
              value={keyToAddAdmin}
              onChange={(e) => setkeyToAddAdmin(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Start Date"
              value={start_date}
              onChange={(e) => setstart_date(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-between">
            <button className="btn btn-outline-secondary" onClick={clearInputs}>
              Clear
            </button>
            {keyToAddAdmin === process.env.NEXT_PUBLIC_KEY_TO_ADD_ADMIN ? (
              <button className="btn btn-primary" onClick={addAdmin}>
                Add ADMIN
              </button>
            ) : (
              <button className="btn btn-primary" onClick={addEmployee}>
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEmployees;
