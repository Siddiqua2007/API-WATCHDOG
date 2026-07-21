import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getEndpointStats, getEndpointSnapshots } from "../controllers/snapshot.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/stats", getEndpointStats);
router.get("/snapshots", getEndpointSnapshots);

export default router;
