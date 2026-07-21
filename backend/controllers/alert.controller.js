import Alert from "../models/Alert.js";
import Endpoint from "../models/Endpoint.js";

const getOwnedEndpointIds = async (userId) => {
  const endpoints = await Endpoint.find({ owner: userId }).select("_id");
  return endpoints.map((e) => e._id);
};

const getAlerts = async (req, res, next) => {
  try {
    const endpointIds = await getOwnedEndpointIds(req.user.id);

    const alerts = await Alert.find({ endpointId: { $in: endpointIds } })
      .sort({ triggeredAt: -1 })
      .populate("endpointId", "name url");

    return res.status(200).json({ alerts });
  } catch (err) {
    next(err);
  }
};

const getAlert = async (req, res, next) => {
  try {
    const endpointIds = await getOwnedEndpointIds(req.user.id);

    const alert = await Alert.findOne({
      _id: req.params.id,
      endpointId: { $in: endpointIds },
    }).populate("endpointId", "name url");

    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    return res.status(200).json({ alert });
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const endpointIds = await getOwnedEndpointIds(req.user.id);

    const alert = await Alert.findOne({
      _id: req.params.id,
      endpointId: { $in: endpointIds },
    });

    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    await alert.save();

    return res.status(200).json({ alert });
  } catch (err) {
    next(err);
  }
};

export { getAlerts, getAlert, resolveAlert };