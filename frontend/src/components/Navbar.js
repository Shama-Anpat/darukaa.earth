import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaUserCircle,
  FaMapMarkedAlt,
  FaProjectDiagram,
  FaChartLine,
  FaSignOutAlt,
  FaUsersCog,
} from "react-icons/fa";
import { UserContext } from "../context/UserContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useContext(UserContext);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm border-bottom border-secondary">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3104/3104938.png"
            alt="logo"
            width="35"
            height="35"
            className="me-2"
          />
          <strong className="text-light">Darukaa.Earth</strong>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {user ? (
              <>
                {/* Dashboard (All users) */}
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname === "/" ? "active text-success" : ""
                    }`}
                    to="/"
                  >
                    <FaChartLine className="me-1" /> Dashboard
                  </Link>
                </li>

                {/* Admin-only links */}
                {user.role === "admin" && (
                  <>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${
                          location.pathname === "/projects"
                            ? "active text-success"
                            : ""
                        }`}
                        to="/projects"
                      >
                        <FaProjectDiagram className="me-1" /> Projects
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        className={`nav-link ${
                          location.pathname === "/map"
                            ? "active text-success"
                            : ""
                        }`}
                        to="/map"
                      >
                        <FaMapMarkedAlt className="me-1" /> Map
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        className={`nav-link ${
                          location.pathname === "/users"
                            ? "active text-success"
                            : ""
                        }`}
                        to="/users"
                      >
                        <FaUsersCog className="me-1" /> Users
                      </Link>
                    </li>
                  </>
                )}

                {/* User dropdown */}
                <li className="nav-item dropdown ms-3">
                  <a
                    href="#"
                    className="nav-link dropdown-toggle d-flex align-items-center"
                    id="userDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <FaUserCircle size={22} className="me-2 text-info" />
                    {user.name}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end bg-dark text-light">
                    <li className="dropdown-item text-muted">
                      <small>
                        Role:{" "}
                        <span
                          className={`badge ${
                            user.role === "admin"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {user.role}
                        </span>
                      </small>
                    </li>
                    <li><hr className="dropdown-divider border-secondary" /></li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt className="me-2" /> Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <FaUserCircle className="me-1" /> Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
