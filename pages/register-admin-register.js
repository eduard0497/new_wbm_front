import React, { useState } from "react";

function RegisterAdminRegister() {
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
    if (keyToAddAdmin != process.env.NEXT_PUBLIC_KEY_TO_ADD_ADMIN) {
      console.log("Key does not match");
      return;
    }
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
          console.log(data.msg);
        }
      });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "600px",
        marginLeft: "100px",
      }}
    >
      <h1>Register Admin Here</h1>
      <input
        type="password"
        placeholder="KEY"
        value={keyToAddAdmin}
        onChange={(e) => setkeyToAddAdmin(e.target.value)}
      />
      <input
        type="text"
        placeholder="First Name"
        value={fname}
        onChange={(e) => setfname(e.target.value)}
      />
      <input
        type="text"
        placeholder="Last Name"
        value={lname}
        onChange={(e) => setlname(e.target.value)}
      />
      <input
        type="text"
        placeholder="Email"
        value={email}
        onChange={(e) => setemail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setpassword(e.target.value)}
      />

      <input
        type="text"
        placeholder="Start Date"
        value={start_date}
        onChange={(e) => setstart_date(e.target.value)}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button onClick={clearInputs}>Clear</button>
        <button onClick={addAdmin}>Add ADMIN</button>
      </div>
    </div>
  );
}

export default RegisterAdminRegister;
