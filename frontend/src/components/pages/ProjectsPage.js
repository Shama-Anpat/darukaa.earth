import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { apiFetch } from "../../utils/api";


const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1.439 1.439-2.122-2.122L13.38.524a.5.5 0 0 1 .706 0l1.416 1.416zM1 13.5V16h2.5L14.873 4.627l-2.122-2.122L1 13.5z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-1 0zm4 0v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-1 0z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 1 1 0-2H6l1-1h2l1 1h3.5a1 1 0 0 1 1 1z"/>
  </svg>
);

export default function ProjectsPage({ api }) {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Add new project modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");


  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => {
    setFiltered(projects.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, projects]);

  async function fetchProjects() {
    setLoading(true);
    try {
      const data = await apiFetch("/projects");
      setProjects(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return alert("Please enter a project name");
    setCreating(true);
    try {
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      setShowAdd(false);
      setNewName("");
      setNewDesc("");
      fetchProjects();
    } catch (err) {
      alert("Error creating project: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate() {
    if (!editName.trim()) return alert("Project name is required!");
    try {
      await apiFetch(`/projects/${editProject.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      alert("Error updating project: " + err.message);
    }
  }

  async function deleteProject(id) {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await apiFetch(`/projects/${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (err) {
      alert("Error deleting project: " + err.message);
    }
  }

  function openEditModal(p) {
    setEditProject(p);
    setEditName(p.name);
    setEditDesc(p.description || "");
    setShowModal(true);
  }

  function fmt(d) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  function timeAgo(d) {
    if (!d) return "-";
    const diff = Date.now() - new Date(d).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(d).toLocaleDateString();
  }

  return (
    <div className="container mt-4 text-light">
      {/* Header + Add Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-success fw-bold mb-0">📁 Manage Projects</h2>
        <Button variant="success" className="fw-semibold" onClick={() => setShowAdd(true)}>
          ➕ Add New Project
        </Button>
      </div>

      <div className="mb-3 col-md-6">
        <input
          type="text"
          className="form-control bg-dark text-light border-secondary"
          placeholder="🔍 Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Project Table */}
      <div className="card bg-dark border-secondary shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Sites</th>
                  <th>Area (sq.km)</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center text-success py-4">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="8" className="text-center text-muted py-4">No projects found</td></tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td style={{ color: "#34d399", fontWeight: 600 }}>{p.name}</td>
                      <td>{p.description || "-"}</td>
                      <td>{p.sites?.length || 0}</td>
                      <td>{p.total_area_sqkm?.toFixed(2) || "0.00"}</td>
                      <td>{timeAgo(p.created_at)}</td>
                      <td>{timeAgo(p.updated_at)}</td>
                      <td className="d-flex gap-2">
                        <button
                          aria-label="Edit project"
                          className="btn btn-sm btn-outline-light flex-fill"
                          onClick={() => openEditModal(p)}
                        ><EditIcon /></button>
                        <button
                          aria-label="Delete project"
                          className="btn btn-sm btn-outline-danger flex-fill"
                          onClick={() => deleteProject(p.id)}
                        ><DeleteIcon /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New Project Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Modal.Header closeButton className="bg-dark text-light border-secondary">
          <Modal.Title>Add New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          <Form.Group className="mb-3">
            <Form.Label>Project Name</Form.Label>
            <Form.Control
              type="text"
              className="bg-secondary text-white border-0"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="bg-secondary text-white border-0"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCreate} disabled={creating}>
            {creating ? <Spinner size="sm" animation="border" /> : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-dark text-light border-secondary">
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          <Form.Group className="mb-3">
            <Form.Label>Project Name</Form.Label>
            <Form.Control
              type="text"
              className="bg-secondary text-white border-0"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="bg-secondary text-white border-0"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleUpdate}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
