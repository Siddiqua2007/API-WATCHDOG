import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getAlerts, getAlert, resolveAlert } from "../controllers/alert.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAlerts);
router.get("/:id", getAlert);
router.patch("/:id/resolve", resolveAlert);

export default router;
