import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import Navbar from "./components/Navbar";
import LandingPage from "./components/pages/LandingPage";
import ProjectsPage from "./components/pages/ProjectsPage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import MapPage from "./components/pages/MapPage";
import UsersPage from "./components/pages/UsersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { UserProvider, UserContext } from "./context/UserContext";

// ✅ Admin-only route wrapper
function AdminRoute({ children }) {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <div className="text-center text-light mt-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2">Checking admin access...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}

// ✅ This inner component now has access to context safely
function AppContent({ api }) {
  const { showIdlePopup, setShowIdlePopup, logoutUser, resetIdleTimer } =
    useContext(UserContext);

  return (
    <>
      <Navbar />
      {showIdlePopup && (
        <Modal show centered backdrop="static">
          <Modal.Header className="bg-dark text-light border-secondary">
            <Modal.Title>Session Timeout</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark text-light">
            You’ve been inactive for a while. Would you like to continue your session?
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
            <Button
              variant="secondary"
              onClick={() => {
                setShowIdlePopup(false);
                resetIdleTimer();
              }}
            >
              Continue
            </Button>
            <Button variant="danger" onClick={logoutUser}>
              Logout
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <div className="container mt-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage api={api} />} />
          <Route path="/register" element={<RegisterPage api={api} />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LandingPage api={api} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage api={api} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage api={api} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage api={api} />
              </AdminRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

// ✅ Wrap the entire app with provider at the root level
function App() {
  const api = process.env.REACT_APP_API_URL || "http://localhost:8000";

  return (
    <UserProvider>
      <Router>
        <AppContent api={api} />
      </Router>
    </UserProvider>
  );
}

export default App;
