import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  Button,
  Form,
  Spinner,
  Modal,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import bbox from "@turf/bbox";
import { apiFetch } from "../../utils/api";

const MAPBOX_TOKEN =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1Ijoic2hhbWFhbnBhdCIsImEiOiJjbWhrOThiNmQxY2VmMmpxcWtkMHZhaWs0In0.pp8622GjFt1FjFK5f3CFCA";

export default function MapPage() {
  const api = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [siteName, setSiteName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [currentGeom, setCurrentGeom] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);

  const [toasts, setToasts] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editProject, setEditProject] = useState("");

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualProject, setManualProject] = useState("");
  const [manualCoords, setManualCoords] = useState([{ lat: "", lng: "" }]);

  // 🗺️ Initialize map
  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    if (!mapRef.current && mapContainer.current) {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [76.2673, 9.9312],
        zoom: 6,
      });
      mapRef.current = map;

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
      drawRef.current = draw;
      map.addControl(draw, "top-left");

      const updateGeom = () => {
        const data = draw.getAll();
        setCurrentGeom(data.features.length > 0 ? data.features[0].geometry : null);
      };
      map.on("draw.create", updateGeom);
      map.on("draw.update", updateGeom);
      map.on("draw.delete", updateGeom);

      return () => map.remove();
    }
  }, []);

  // 📦 Fetch projects
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/projects");
        setProjects(Array.isArray(data) ? data : []);
      } catch {
        setProjects([]);
      }
    })();
  }, []);

  // 📦 Fetch sites
  const fetchSites = async () => {
    setLoadingSites(true);
    try {
      const data = await apiFetch("/sites");
      setSites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sites:", err);
    } finally {
      setLoadingSites(false);
    }
  };
  useEffect(() => {
    fetchSites();
  }, []);

  // 🟩 Draw polygons for sites
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    sites.forEach((s) => {
      if (!s.geojson) return;

      const sourceId = `site-${s.id}`;
      const fillLayerId = sourceId;
      const borderLayerId = `${sourceId}-border`;

      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "Feature", geometry: s.geojson },
      });

      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: { "fill-color": "#3FB1CE", "fill-opacity": 0.4 },
      });

      map.addLayer({
        id: borderLayerId,
        type: "line",
        source: sourceId,
        paint: { "line-color": "#007bff", "line-width": 2 },
      });

      map.off("click", fillLayerId);
      map.on("click", fillLayerId, () => {
        setSelectedSite(s);
        setEditName(s.name);
        setEditProject(s.project_id);
        setShowModal(true);
      });
    });

    setLoadingSites(false);
  }, [sites]);

  // ✅ Toast
  const showToast = (variant, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // 💾 Save drawn polygon
  const saveSite = async () => {
    if (!siteName.trim() || !projectId || !currentGeom) {
      showToast("warning", "⚠️ Please fill all fields and draw a polygon.");
      return;
    }
    const coords = currentGeom.coordinates[0].map((c) => c.join(" ")).join(", ");
    const wkt = `POLYGON((${coords}))`;

    try {
      setSaving(true);
      await apiFetch("/sites", {
        method: "POST",
        body: JSON.stringify({
          project_id: parseInt(projectId),
          name: siteName,
          polygon_wkt: wkt,
        }),
      });
      showToast("success", "✅ Site saved successfully!");
      setSiteName("");
      setProjectId("");
      drawRef.current.deleteAll();
      await fetchSites();
    } catch (err) {
      showToast("danger", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✏️ Edit polygon
  const startPolygonEdit = () => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw || !selectedSite?.geojson) return;

    try {
      draw.deleteAll();

      const feature = {
        id: `edit-${selectedSite.id}`,
        type: "Feature",
        properties: {},
        geometry: selectedSite.geojson,
      };

      draw.add(feature);
      draw.changeMode("direct_select", { featureId: `edit-${selectedSite.id}` });

      const bounds = bbox(feature);
      map.fitBounds(bounds, { padding: 50, duration: 1000 });

      setEditing(true);
      showToast("info", "🟡 Polygon is now editable.");
    } catch (err) {
      console.error("Polygon edit error:", err);
      showToast("danger", "❌ Unable to start polygon edit.");
    }
  };

  // 💾 Update site
  const updateSite = async () => {
    if (!selectedSite) return;
    const siteId = selectedSite.id;
    const draw = drawRef.current;
    let polygon_wkt = null;

    const data = draw?.getAll();
    if (data?.features?.length > 0) {
      const geom = data.features[0].geometry;
      const coords = geom.coordinates[0].map((c) => c.join(" ")).join(", ");
      polygon_wkt = `POLYGON((${coords}))`;
    }

    try {
      await apiFetch(`/sites/${siteId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          project_id: editProject,
          polygon_wkt,
        }),
      });
      showToast("success", "✅ Site updated successfully!");
      setShowModal(false);
      setEditing(false);
      draw.deleteAll();
      await fetchSites();
    } catch (err) {
      showToast("danger", err.message);
    }
  };

  // 🗑️ Delete site
  const deleteSite = async (siteId) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;
    try {
      await apiFetch(`/sites/${siteId}`, { method: "DELETE" });
      showToast("success", "🗑️ Site deleted!");
      setShowModal(false);
      await fetchSites();
    } catch (err) {
      showToast("danger", err.message);
    }
  };

  // ➕ Manual input helpers
  const addManualCoordRow = () => setManualCoords([...manualCoords, { lat: "", lng: "" }]);
  const updateManualCoord = (i, field, value) => {
    const newCoords = [...manualCoords];
    newCoords[i][field] = value;
    setManualCoords(newCoords);
  };
  const removeManualCoordRow = (i) => {
    const newCoords = [...manualCoords];
    newCoords.splice(i, 1);
    setManualCoords(newCoords);
  };
  const clearManualPreview = () => {
    const map = mapRef.current;
    if (map.getSource("manual-preview")) {
      if (map.getLayer("manual-preview")) map.removeLayer("manual-preview");
      map.removeSource("manual-preview");
    }
  };

  // 🟢 Show live preview of manual polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    clearManualPreview();

    const validCoords = manualCoords
      .map((r) => [parseFloat(r.lng), parseFloat(r.lat)])
      .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat));

    if (validCoords.length < 3) return;
    validCoords.push(validCoords[0]); // close polygon

    const feature = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [validCoords] },
    };

    map.addSource("manual-preview", { type: "geojson", data: feature });
    map.addLayer({
      id: "manual-preview",
      type: "fill",
      source: "manual-preview",
      paint: { "fill-color": "#22ff88", "fill-opacity": 0.3 },
    });
  }, [manualCoords]);

  // 💾 Save manual site
  const saveManualSite = async () => {
    if (!manualName || !manualProject || manualCoords.length < 3) {
      showToast("warning", "⚠️ Please fill all details and add at least 3 coordinates.");
      return;
    }

    const validCoords = manualCoords
      .map((r) => [parseFloat(r.lng), parseFloat(r.lat)])
      .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat));

    if (validCoords.length < 3) return showToast("danger", "⚠️ Invalid coordinates!");
    validCoords.push(validCoords[0]);

    const coordsStr = validCoords.map((c) => c.join(" ")).join(", ");
    const wkt = `POLYGON((${coordsStr}))`;

    try {
      await apiFetch("/sites", {
        method: "POST",
        body: JSON.stringify({
          project_id: parseInt(manualProject),
          name: manualName,
          polygon_wkt: wkt,
        }),
      });
      showToast("success", "✅ Manual site saved!");
      setShowManualModal(false);
      setManualCoords([{ lat: "", lng: "" }]);
      await fetchSites(); // ✅ Refresh polygons
    } catch (err) {
      showToast("danger", err.message);
    }
  };

  // 🧱 UI
  return (
    <div className="container mt-4 text-light">
      <h3 className="text-center mb-3 fw-semibold text-info">🗺️ Projects & Sites Map</h3>

      {/* Controls */}
      <div className="card bg-dark border-secondary shadow p-3 mb-4">
        <div className="d-flex gap-3 flex-wrap align-items-end">
          <Form.Group className="flex-fill">
            <Form.Label>Site Name</Form.Label>
            <Form.Control
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter site name"
            />
          </Form.Group>

          <Form.Group className="flex-fill">
            <Form.Label>Select Project</Form.Label>
            <Form.Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Button variant="success" onClick={saveSite} disabled={saving} className="px-4">
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              "💾 Save Site"
            )}
          </Button>

          <Button variant="outline-info" onClick={() => setShowManualModal(true)}>
            ➕ Add Manual Site
          </Button>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: "relative" }}>
        <div
          ref={mapContainer}
          style={{ height: "75vh", borderRadius: "10px", overflow: "hidden" }}
          className="shadow border border-secondary"
        />
        {loadingSites && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "10px",
              background:
                "linear-gradient(110deg, rgba(255,255,255,0.05) 8%, rgba(255,255,255,0.15) 18%, rgba(255,255,255,0.05) 33%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s linear infinite",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#9ca3af",
              fontWeight: "600",
              fontSize: "1.1rem",
              zIndex: 5,
            }}
          >
            Loading sites on map...
          </div>
        )}
      </div>

      {/* Toasts */}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            show={true}
            bg="light"
            className="shadow-sm mb-2 border border-secondary"
          >
            <Toast.Header closeButton={false}>
              <strong className="me-auto text-dark">
                {t.variant === "success"
                  ? "Success"
                  : t.variant === "danger"
                  ? "Error"
                  : t.variant === "warning"
                  ? "Warning"
                  : "Info"}
              </strong>
            </Toast.Header>
            <Toast.Body className="text-dark fw-semibold">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {/* Manual Modal */}
      <Modal show={showManualModal} onHide={() => setShowManualModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-dark text-light border-secondary">
          <Modal.Title>➕ Add Site Manually</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          <Form.Group className="mb-2">
            <Form.Label>Site Name</Form.Label>
            <Form.Control
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="bg-secondary text-white border-0"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Select Project</Form.Label>
            <Form.Select
              value={manualProject}
              onChange={(e) => setManualProject(e.target.value)}
              className="bg-secondary text-white border-0"
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div>
            <label className="mb-2 d-block">
              Coordinates (lat / lng). Add at least 3 rows:
            </label>
            {manualCoords.map((r, i) => (
              <div key={i} className="d-flex gap-2 align-items-center mb-2">
                <input
                  className="form-control bg-secondary text-white"
                  placeholder="Latitude"
                  value={r.lat}
                  onChange={(e) => updateManualCoord(i, "lat", e.target.value)}
                />
                <input
                  className="form-control bg-secondary text-white"
                  placeholder="Longitude"
                  value={r.lng}
                  onChange={(e) => updateManualCoord(i, "lng", e.target.value)}
                />
                <div>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => removeManualCoordRow(i)}
                    disabled={manualCoords.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <div className="mt-2">
              <Button variant="outline-success" size="sm" onClick={addManualCoordRow}>
                ➕ Add Coordinate
              </Button>
            </div>

            <div className="mt-3 text-secondary">
              ✅ Polygon preview appears live as you enter coordinates.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button
            variant="secondary"
            onClick={() => {
              setShowManualModal(false);
              clearManualPreview();
            }}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={saveManualSite}>
            Save Manual Site
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
