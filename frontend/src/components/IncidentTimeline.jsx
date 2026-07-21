import { useState } from "react";

const SEVERITY_STYLES = {
  warning: { color: "#a8641f", bg: "#fdf1e6" },
  critical: { color: "#a82f2f", bg: "#fbe9e9" },
};

const AlertRow = ({ alert, onResolve }) => {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.warning;

  return (
    <div style={{ borderBottom: "1px solid #e5e5e5", padding: "12px 0" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: style.color,
              backgroundColor: style.bg,
              marginRight: "8px",
            }}
          >
            {alert.severity}
          </span>
          <strong>{alert.type.replace("_", " ")}</strong>
          <span style={{ color: "#888", marginLeft: "8px", fontSize: "0.85rem" }}>
            {new Date(alert.triggeredAt).toLocaleString()}
          </span>
        </div>
        <div>
          {alert.resolved ? (
            <span style={{ color: "#1f7a4d", fontSize: "0.85rem" }}>Resolved</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(alert._id);
              }}
              style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            >
              Mark resolved
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: "8px", padding: "10px", backgroundColor: "#f7f8fa", borderRadius: "6px" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
            {alert.diagnosis || "No AI diagnosis recorded for this alert."}
          </p>
        </div>
      )}
    </div>
  );
};

const IncidentTimeline = ({ alerts, onResolve }) => {
  if (!alerts || alerts.length === 0) {
    return <p style={{ color: "#888", fontSize: "0.9rem" }}>No incidents recorded yet for this endpoint.</p>;
  }

  return (
    <div>
      {alerts.map((alert) => (
        <AlertRow key={alert._id} alert={alert} onResolve={onResolve} />
      ))}
    </div>
  );
};

export default IncidentTimeline;
