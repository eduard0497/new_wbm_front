import React, { useEffect, useState } from "react";
import Login from "../comps/Login";
import styles from "../styles/ManageEmployees.module.css";

export default function Home() {
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    const getEmployees = () => {
      fetch("http://localhost:3000/get-employees")
        .then((res) => res.json())
        .then((item) => setEmployees(item));
    };

    getEmployees();
  }, []);

  console.log(employees);

  return (
    <div>
      <Login />
      <table className={styles.employees_table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Since</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => {
            return (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{`${employee.fname} ${employee.lname}`}</td>
                <td>{employee.email}</td>
                <td>{employee.role}</td>
                <td>{employee.start_date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
