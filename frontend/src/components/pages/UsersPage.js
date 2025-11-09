import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../../context/UserContext";

export default function UsersPage({ api }) {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  async function fetchUsers() {
    if (!token) return setError("No authentication token found.");
    try {
      const res = await fetch(`${api}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(id, newRole) {
    try {
      const res = await fetch(`${api}/users/${id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="text-center text-light mt-5">
        <h4>🚫 Access Denied</h4>
        <p className="text-muted">Only admins can manage users.</p>
      </div>
    );
  }

  if (loading)
    return (
      <div className="text-center text-light mt-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2">Loading users...</p>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        {error}
      </div>
    );

  return (
    <div className="container mt-5 text-light">
      <h3 className="mb-4 text-success">User Management</h3>
      <div className="table-responsive">
        <table className="table table-dark table-striped table-bordered align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    className={`badge ${
                      u.role === "admin" ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="text-center">
                  {u.email !== user.email && (
                    <button
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() =>
                        changeRole(u.id, u.role === "admin" ? "user" : "admin")
                      }
                    >
                      Change Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
