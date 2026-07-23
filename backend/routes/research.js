import Incident from "../models/Incident.js";
import Endpoint from "../models/Endpoint.js";

const startIncident = async (req, res, next) => {
  try {
    const { endpointId, faultType, notes } = req.body;

    if (!endpointId || !faultType) {
      return res.status(400).json({ error: "endpointId and faultType are required." });
    }

    const endpoint = await Endpoint.findOne({ _id: endpointId, owner: req.user.id });
    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    const incident = await Incident.create({
      endpointId,
      faultType,
      startedAt: new Date(),
      notes: notes || "",
    });

    return res.status(201).json({ incident });
  } catch (err) {
    next(err);
  }
};

const endIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found." });
    }

    const endpoint = await Endpoint.findOne({ _id: incident.endpointId, owner: req.user.id });
    if (!endpoint) {
      return res.status(404).json({ error: "Incident not found." });
    }

    incident.endedAt = new Date();
    await incident.save();

    return res.status(200).json({ incident });
  } catch (err) {
    next(err);
  }
};

const listIncidents = async (req, res, next) => {
  try {
    const endpoints = await Endpoint.find({ owner: req.user.id }).select("_id");
    const endpointIds = endpoints.map((e) => e._id);

    const incidents = await Incident.find({ endpointId: { $in: endpointIds } })
      .populate("endpointId", "name url")
      .sort({ startedAt: -1 });

    return res.status(200).json({ incidents });
  } catch (err) {
    next(err);
  }
};

export { startIncident, endIncident, listIncidents };
