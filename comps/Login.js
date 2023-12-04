import React, { useState } from "react";
import styles from "../styles/Login.module.css";
import { useRouter } from "next/router";

const defaultCredsForAdmins = {
  username: "1234",
  password: "1234",
};
const defaultCredsForEmployees = {
  username: "qwerty",
  password: "qwerty",
};

function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const login = () => {
    if (!username || !password) {
      setErrorMessage("Fields are empty...");
      return;
    } else if (
      username == defaultCredsForAdmins.username &&
      password == defaultCredsForAdmins.password
    ) {
      router.push("/admin-dashboard");
    } else if (
      username == defaultCredsForEmployees.username &&
      password == defaultCredsForEmployees.password
    ) {
      router.push("/employee-dashboard");
    }
  };

  const clearInputs = () => {
    setUsername('');
    setPassword('');
    setErrorMessage('');
  };

  return (
    <div className="container my-5">
      <div className="card mx-auto" style={{ maxWidth: '400px' }}>
        <div className="card-body">
          <h1 className="card-title text-center mb-4">Waste Bin Management</h1>
          <h2 className="h4 card-subtitle text-center mb-4">Login</h2>
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-between">
            <button className="btn btn-outline-secondary" onClick={clearInputs}>
              Clear
            </button>
            <button className="btn btn-primary" onClick={login}>
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;