import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createEndpoint,
  getEndpoints,
  updateEndpoint,
  deleteEndpoint,
} from "../controllers/endpoint.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createEndpoint);
router.get("/", getEndpoints);
router.patch("/:id", updateEndpoint);
router.delete("/:id", deleteEndpoint);

export default router;