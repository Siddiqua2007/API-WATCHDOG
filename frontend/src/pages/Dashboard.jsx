import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import AddEndpointForm from "../components/AddEndpointForm.jsx";

const Dashboard = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();

  const fetchEndpoints = useCallback(async () => {
    try {
      const { data } = await api.get("/endpoints");
      setEndpoints(data.endpoints);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load endpoints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
    const interval = setInterval(fetchEndpoints, 30000);
    return () => clearInterval(interval);
  }, [fetchEndpoints]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this endpoint? This cannot be undone.")) return;
    try {
      await api.delete(`/endpoints/${id}`);
      fetchEndpoints();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete endpoint.");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>API Watchdog</h1>
        <div>
          <span style={{ marginRight: "16px", color: "#666" }}>{user?.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="card">
        <h2>Add an endpoint to monitor</h2>
        <AddEndpointForm onCreated={fetchEndpoints} />
      </section>

      <section className="card">
        <h2>Your endpoints</h2>

        {error && <p className="auth-error">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : endpoints.length === 0 ? (
          <p style={{ color: "#888" }}>No endpoints registered yet — add one above to start monitoring.</p>
        ) : (
          <table className="endpoint-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>URL</th>
                <th>Status</th>
                <th>Last latency</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={endpoint._id}>
                  <td>
                    <Link to={`/endpoints/${endpoint._id}`}>{endpoint.name}</Link>
                  </td>
                  <td style={{ color: "#666", fontSize: "0.85rem" }}>{endpoint.url}</td>
                  <td>
                    <StatusBadge latestStatus={endpoint.latestStatus} />
                  </td>
                  <td>{endpoint.latestStatus?.latencyMs ? `${endpoint.latestStatus.latencyMs}ms` : "—"}</td>
                  <td>
                    <button onClick={() => handleDelete(endpoint._id)} style={{ fontSize: "0.8rem" }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
