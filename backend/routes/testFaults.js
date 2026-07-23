import express from "express";

const router = express.Router();

router.get("/normal", (req, res) => {
  res.status(200).json({ status: "ok", value: Math.random() });
});

router.get("/slow", async (req, res) => {
  const delayMs = Math.min(parseInt(req.query.delayMs, 10) || 2000, 15000);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  res.status(200).json({ status: "ok", delayedMs: delayMs });
});

router.get("/broken", (req, res) => {
  res.status(500).json({ error: "Simulated internal server error." });
});

router.get("/schema-drift", (req, res) => {
  const variant = req.query.variant === "b" ? "b" : "a";

  if (variant === "a") {
    return res.status(200).json({ status: "ok", userId: 123, name: "Test User" });
  }

  return res.status(200).json({ status: "ok", userId: "123", name: "Test User", role: "admin" });
});

export default router;
