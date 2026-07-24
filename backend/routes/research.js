import express from "express";
import authMiddleware from "../middleware/auth.js";
import { startIncident, endIncident, listIncidents } from "../controllers/incident.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", startIncident);
router.patch("/:id/end", endIncident);
router.get("/", listIncidents);

export default router;