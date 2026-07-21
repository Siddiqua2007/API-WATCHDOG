import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.js";
import LatencySparkline from "../components/LatencySparkline.jsx";
import IncidentTimeline from "../components/IncidentTimeline.jsx";

const EndpointDetail = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        api.get(`/endpoints/${id}/stats`),
        api.get("/alerts"),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data.alerts.filter((a) => a.endpointId?._id === id));
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load endpoint data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleResolve = async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/resolve`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resolve alert.");
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/dashboard">&larr; Back to dashboard</Link>
      </header>

      {error && <p className="auth-error">{error}</p>}

      {stats && (
        <>
          <section className="card">
            <h2>Latency (last 24h)</h2>
            <div className="stats-row">
              <div><span className="stat-label">p50</span><span className="stat-value">{stats.p50 ?? "—"}ms</span></div>
              <div><span className="stat-label">p95</span><span className="stat-value">{stats.p95 ?? "—"}ms</span></div>
              <div><span className="stat-label">p99</span><span className="stat-value">{stats.p99 ?? "—"}ms</span></div>
              <div><span className="stat-label">Uptime</span><span className="stat-value">{stats.uptimePercent ?? "—"}%</span></div>
              <div><span className="stat-label">Total checks</span><span className="stat-value">{stats.totalChecks}</span></div>
            </div>
            <LatencySparkline latencySeries={stats.latencySeries} />
          </section>

          <section className="card">
            <h2>Incident timeline</h2>
            <IncidentTimeline alerts={alerts} onResolve={handleResolve} />
          </section>
        </>
      )}
    </div>
  );
};

export default EndpointDetail;
