import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const LatencySparkline = ({ latencySeries }) => {
  if (!latencySeries || latencySeries.length === 0) {
    return <p style={{ color: "#888", fontSize: "0.9rem" }}>No latency data yet — checks will appear here once the scheduler runs.</p>;
  }

  const chartData = latencySeries.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    latencyMs: point.latencyMs,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} unit="ms" />
        <Tooltip formatter={(value) => [`${value}ms`, "Latency"]} />
        <Line type="monotone" dataKey="latencyMs" stroke="#1f5fa8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LatencySparkline;
