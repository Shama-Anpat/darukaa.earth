import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LandingPage({ api }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${api}/projects`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) throw new Error("Failed to fetch projects");

      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }
  
  const PASTEL_COLORS = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#fdbf6f", "#cab2d6"];

  const areaData = projects.map(p => ({ name: p.name, area: p.total_area_sqkm || 0 }));
  const siteData = projects.map(p => ({ name: p.name, sites: p.site_count || 0 }));

  return (
    <div className="container mt-5" style={{ minHeight: "100vh" }}>
      <h2 className="mb-4 fw-bold text-center text-info">Dashboard</h2>

      {projects.length === 0 ? (
        <p className="text-center text-muted fs-5">No projects yet — add some from the Map page.</p>
      ) : (
        <div className="row g-4">

          {/* Total Area per Project */}
          <div className="col-12 col-md-6">
            <div className="card shadow-lg border-0 h-100 bg-dark">
              <div className="card-body">
                <h5 className="card-title text-light fw-bold mb-4">Total Area per Project (sq.km)</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={areaData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#ddd" angle={-30} textAnchor="end" interval={0} />
                    <YAxis stroke="#ddd" />
                    <Tooltip 
                      wrapperStyle={{ backgroundColor: '#222', borderRadius: '5px', color: '#fff' }} 
                    />
                    <Bar dataKey="area" fill="#a6cee3" label={{ position: 'top', fill: '#fff', fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Number of Sites per Project */}
          <div className="col-12 col-md-6">
            <div className="card shadow-lg border-0 h-100 bg-dark">
              <div className="card-body">
                <h5 className="card-title text-light fw-bold mb-4">Number of Sites per Project</h5>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={siteData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#ddd" angle={-30} textAnchor="end" interval={0} />
                    <YAxis stroke="#ddd" />
                    <Tooltip 
                      wrapperStyle={{ backgroundColor: '#222', borderRadius: '5px', color: '#fff' }} 
                    />
                    <Bar dataKey="sites" fill="#b2df8a" label={{ position: 'top', fill: '#fff', fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pie Chart: Project Area Distribution */}
          <div className="col-12">
            <div className="card shadow-lg border-0 bg-dark">
              <div className="card-body d-flex">
                {/* Labels on left */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {areaData.map((entry, i) => (
                    <div key={i} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, backgroundColor: PASTEL_COLORS[i % PASTEL_COLORS.length], marginRight: 8 }}></div>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{entry.name}</span>
                    </div>
                  ))}
                </div>

                {/* Pie Chart */}
                <div style={{ flex: 2 }}>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={areaData}
                        dataKey="area"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        label={false} // hide internal labels
                        isAnimationActive
                      >
                        {areaData.map((_, i) => (
                          <Cell key={i} fill={PASTEL_COLORS[i % PASTEL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} sq.km (${((value / areaData.reduce((sum, a) => sum + a.area, 0)) * 100).toFixed(1)}%)`, 
                          props.name
                        ]} 
                        wrapperStyle={{ backgroundColor: '#222', borderRadius: '5px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
