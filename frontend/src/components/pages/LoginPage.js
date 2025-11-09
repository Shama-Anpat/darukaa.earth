import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../../context/UserContext";

export default function LoginPage({ api }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginUser } = useContext(UserContext);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${api}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      loginUser({ access_token: data.access_token, ...data.user });
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  const pastelCard = "rgba(44, 44, 84, 0.85)";
  const pastelInputBg = "#3d3d5c";
  const pastelBtn = "#a29bfe";
  const pastelBtnHover = "#6c5ce7";

  const bgImage = "https://images.unsplash.com/photo-1501700493788-fa1a23d69b65?auto=format&fit=crop&w=1950&q=80";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(30, 30, 47, 0.5)",
          zIndex: 1,
        }}
      />

      {/* Card */}
      <div
        className="card shadow p-4"
        style={{
          width: "400px",
          backgroundColor: pastelCard,
          borderRadius: "12px",
          zIndex: 2,
        }}
      >
        <h3 className="text-center mb-3" style={{ color: "#ffeaa7" }}>Login</h3>

        {error && <div className="alert alert-danger py-1">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label style={{ color: "#dfe6e9" }}>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                backgroundColor: pastelInputBg,
                borderColor: "#6c5ce7",
                color: "#fff"
              }}
            />
          </div>

          <div className="mb-3">
            <label style={{ color: "#dfe6e9" }}>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                backgroundColor: pastelInputBg,
                borderColor: "#6c5ce7",
                color: "#fff"
              }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100"
            style={{
              backgroundColor: pastelBtn,
              color: "#1e1e2f",
              fontWeight: "bold",
              transition: "0.3s"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = pastelBtnHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = pastelBtn}
          >
            Login
          </button>
        </form>

        <p className="mt-3 text-center" style={{ color: "#dfe6e9" }}>
          Don’t have an account?{" "}
          <Link to="/register" style={{ color: "#74b9ff", textDecoration: "none" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
