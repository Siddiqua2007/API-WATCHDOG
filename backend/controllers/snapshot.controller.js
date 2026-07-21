import Endpoint from "../models/Endpoint.js";
import Snapshot from "../models/Snapshot.js";
import { getRollingStats } from "../services/anomalyDetection.js";

const verifyOwnership = async (endpointId, userId) => {
  return Endpoint.findOne({ _id: endpointId, owner: userId });
};

const getEndpointStats = async (req, res, next) => {
  try {
    const endpoint = await verifyOwnership(req.params.id, req.user.id);
    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    const stats = await getRollingStats(endpoint._id);
    const successCount = Math.round(stats.totalChecks * (1 - stats.errorRate));
    const uptimePercent = stats.totalChecks > 0
      ? Number(((successCount / stats.totalChecks) * 100).toFixed(2))
      : null;

    const latencySeries = stats.recentSnapshots
      .filter((s) => s.success && typeof s.latencyMs === "number")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map((s) => ({ timestamp: s.timestamp, latencyMs: s.latencyMs }));

    return res.status(200).json({
      endpointId: endpoint._id,
      window: "24h",
      totalChecks: stats.totalChecks,
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99,
      uptimePercent,
      latencySeries,
    });
  } catch (err) {
    next(err);
  }
};

const getEndpointSnapshots = async (req, res, next) => {
  try {
    const endpoint = await verifyOwnership(req.params.id, req.user.id);
    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [snapshots, total] = await Promise.all([
      Snapshot.find({ endpointId: endpoint._id }).sort({ timestamp: -1 }).skip(skip).limit(limit),
      Snapshot.countDocuments({ endpointId: endpoint._id }),
    ]);

    return res.status(200).json({ snapshots, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export { getEndpointStats, getEndpointSnapshots };
