import axios from "axios";
import crypto from "crypto";
import Snapshot from "../models/Snapshot.js";
import Endpoint from "../models/Endpoint.js";

/**
 * Recursively extracts just the *shape* of a JSON value — key names and value
 * types, not the actual data — so two responses with the same structure but
 * different data hash identically, and a structural change (a field added,
 * removed, or changing type) produces a different hash.
 */
const extractShape = (value) => {
  if (Array.isArray(value)) {
    return ["array", value.length > 0 ? extractShape(value[0]) : "empty"];
  }

  if (value !== null && typeof value === "object") {
    const sortedKeys = Object.keys(value).sort();
    return sortedKeys.map((key) => [key, extractShape(value[key])]);
  }

  return typeof value;
};

const computeSchemaHash = (responseData) => {
  const shape = extractShape(responseData);
  const shapeString = JSON.stringify(shape);
  return crypto.createHash("sha256").update(shapeString).digest("hex");
};

/**
 * Fires a single health check against one Endpoint document, records the
 * result as a Snapshot, and updates the endpoint's lastCheckedAt.
 * Never throws — a failed/timed-out request is itself a valid, recorded
 * result (success: false), not a crash of the scheduler.
 */
const runCheck = async (endpoint) => {
  const startedAt = Date.now();

  let statusCode = null;
  let latencyMs = null;
  let responseSize = null;
  let schemaHash = null;
  let success = false;
  let errorMessage = null;

  try {
    const headers = endpoint.headers instanceof Map
      ? Object.fromEntries(endpoint.headers)
      : (endpoint.headers || {});

    const response = await axios.request({
      url: endpoint.url,
      method: endpoint.method || "GET",
      headers,
      timeout: 10000,
      validateStatus: () => true,
    });

    latencyMs = Date.now() - startedAt;
    statusCode = response.status;

    const rawBody = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
    responseSize = Buffer.byteLength(rawBody, "utf8");

    try {
      schemaHash = computeSchemaHash(response.data);
    } catch {
      schemaHash = null;
    }

    success = statusCode === endpoint.expectedStatus;
    if (!success) {
      errorMessage = `Expected status ${endpoint.expectedStatus}, got ${statusCode}.`;
    }
  } catch (err) {
    latencyMs = Date.now() - startedAt;
    success = false;
    errorMessage = err.code === "ECONNABORTED"
      ? "Request timed out after 10s."
      : err.message;
  }

  const snapshot = await Snapshot.create({
    endpointId: endpoint._id,
    statusCode,
    latencyMs,
    responseSize,
    schemaHash,
    success,
    error: errorMessage,
    timestamp: new Date(),
  });

  await Endpoint.findByIdAndUpdate(endpoint._id, { lastCheckedAt: new Date() });

  return snapshot;
};

export default runCheck;
export { computeSchemaHash };
