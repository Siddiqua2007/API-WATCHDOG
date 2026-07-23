import Endpoint from "../models/Endpoint.js";
import Snapshot from "../models/Snapshot.js";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const createEndpoint = async (req, res, next) => {
  try {
    const { name, url, method, expectedStatus, intervalMins, headers } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: "name and url are required." });
    }

    if (method && !ALLOWED_METHODS.includes(method.toUpperCase())) {
      return res.status(400).json({ error: `method must be one of: ${ALLOWED_METHODS.join(", ")}` });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "url must be a valid absolute URL, e.g. https://example.com/health" });
    }

    const endpoint = await Endpoint.create({
      owner: req.user.id,
      name,
      url,
      method: method ? method.toUpperCase() : "GET",
      expectedStatus: expectedStatus || 200,
      intervalMins: intervalMins || 5,
      headers: headers || {},
    });

    return res.status(201).json({ endpoint });
  } catch (err) {
    next(err);
  }
};

const getEndpoints = async (req, res, next) => {
  try {
    const endpoints = await Endpoint.find({ owner: req.user.id }).sort({ createdAt: -1 });

    const endpointsWithStatus = await Promise.all(
      endpoints.map(async (endpoint) => {
        const latestSnapshot = await Snapshot.findOne({ endpointId: endpoint._id }).sort({ timestamp: -1 });
        return {
          ...endpoint.toObject(),
          latestStatus: latestSnapshot
            ? {
                success: latestSnapshot.success,
                statusCode: latestSnapshot.statusCode,
                latencyMs: latestSnapshot.latencyMs,
                timestamp: latestSnapshot.timestamp,
              }
            : null,
        };
      })
    );

    return res.status(200).json({ endpoints: endpointsWithStatus });
  } catch (err) {
    next(err);
  }
};

const updateEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url, method, expectedStatus, intervalMins, headers, active } = req.body;

    const endpoint = await Endpoint.findOne({ _id: id, owner: req.user.id });
    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    if (url !== undefined) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "url must be a valid absolute URL." });
      }
      endpoint.url = url;
    }

    if (method !== undefined) {
      if (!ALLOWED_METHODS.includes(method.toUpperCase())) {
        return res.status(400).json({ error: `method must be one of: ${ALLOWED_METHODS.join(", ")}` });
      }
      endpoint.method = method.toUpperCase();
    }

    if (name !== undefined) endpoint.name = name;
    if (expectedStatus !== undefined) endpoint.expectedStatus = expectedStatus;
    if (intervalMins !== undefined) endpoint.intervalMins = intervalMins;
    if (headers !== undefined) endpoint.headers = headers;
    if (active !== undefined) endpoint.active = active;

    await endpoint.save();

    return res.status(200).json({ endpoint });
  } catch (err) {
    next(err);
  }
};

const deleteEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;

    const endpoint = await Endpoint.findOne({ _id: id, owner: req.user.id });
    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    await endpoint.deleteOne();
    return res.status(200).json({ message: "Endpoint deleted." });
  } catch (err) {
    next(err);
  }
};

export { createEndpoint, getEndpoints, updateEndpoint, deleteEndpoint };