const getStatus = (latestStatus) => {
  if (!latestStatus) return "unknown";
  if (!latestStatus.success) return "down";
  if (latestStatus.latencyMs && latestStatus.latencyMs > 2000) return "degraded";
  return "up";
};

const STATUS_STYLES = {
  up: { label: "Up", color: "#1f7a4d", bg: "#e6f4ec" },
  degraded: { label: "Degraded", color: "#a8641f", bg: "#fdf1e6" },
  down: { label: "Down", color: "#a82f2f", bg: "#fbe9e9" },
  unknown: { label: "No data yet", color: "#666", bg: "#eee" },
};

const StatusBadge = ({ latestStatus }) => {
  const status = getStatus(latestStatus);
  const style = STATUS_STYLES[status];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: style.color,
        backgroundColor: style.bg,
      }}
    >
      {style.label}
    </span>
  );
};

export default StatusBadge;
