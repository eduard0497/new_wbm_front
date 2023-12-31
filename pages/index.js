import React, { useEffect, useState } from "react";
import Login from "../comps/Login";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  console.log(errorMessage);

  useEffect(() => {
    setLoading(true);
    const checkIfLoggedInUserExists = () => {
      fetch(
        `${process.env.NEXT_PUBLIC_SERVER_LINK}/verify-user-upon-entering`,
        {
          method: "post",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      )
        .then((res) => res.json())
        .then(async (data) => {
          if (!data.status) {
            return;
          } else {
            await router.push("/admin-dashboard");
          }
        })
        .catch((e) => setErrorMessage(e));
    };

    checkIfLoggedInUserExists();
    setLoading(false);
  }, []);

  if (loading) {
    return <h1>LOADING...</h1>;
  }

  return (
    <div>
      <Login />
    </div>
  );
}
