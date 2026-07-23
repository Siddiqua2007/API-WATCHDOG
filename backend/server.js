import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import startScheduler from "./services/scheduler.js";

import authRoutes from "./routes/auth.js";
import endpointRoutes from "./routes/endpoints.js";
import alertRoutes from "./routes/alerts.js";
import snapshotRoutes from "./routes/snapshots.js";

import testFaultRoutes from "./routes/testFaults.js";
import researchRoutes from "./routes/research.js";
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});
app.get("/", (req, res) => {
  res.status(200).json({ message: "API Watchdog backend is running." });
});
app.use("/api/auth", authRoutes);
app.use("/api/endpoints", endpointRoutes);
app.use("/api/endpoints/:id", snapshotRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/test", testFaultRoutes);
app.use("/api/research/incidents", researchRoutes);
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const start = async () => {
  await connectDB();
  startScheduler();
  app.listen(port, () => {
    console.log(`API Watchdog backend listening on port ${port}`);
  });
};

start();