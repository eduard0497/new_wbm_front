import React, { useState } from "react";
import styles from "../styles/Login.module.css";
import { useRouter } from "next/router";

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const login = () => {
    if (!email || !password) {
      setErrorMessage("Fields are empty...");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_SERVER_LINK}/login`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (!data.status) {
          setErrorMessage(data.msg);
        } else {
          await router.push("/admin-dashboard");
        }
      });
  };

  const clearInputs = () => {
    setEmail("");
    setPassword("");
    setErrorMessage("");
  };

  return (
    <div className="container my-5">
      <div className="card mx-auto" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <h1 className="card-title text-center mb-4">Waste Bin Management</h1>
          <h2 className="h4 card-subtitle text-center mb-4">Login</h2>
          {errorMessage && (
            <div className="alert alert-danger">{errorMessage}</div>
          )}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
