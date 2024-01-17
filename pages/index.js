import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Login from "../comps/Login";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const checkIfLoggedInUserExists = () => {
      let currentSetCookieID = Cookies.get("user_id");
      let currentSetCookieJWT = Cookies.get("jwt");
      if (
        !currentSetCookieID ||
        !currentSetCookieJWT ||
        currentSetCookieJWT.includes("maxAge")
      ) {
        return;
      } else {
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
              console.log(data.msg);
              return;
            } else {
              await router.push("/admin-dashboard");
            }
          })
          .catch((e) => console.log(e));
      }
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
