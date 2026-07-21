import cron from "node-cron";
import Endpoint from "../models/Endpoint.js";
import runCheck from "./checker.js";
import { processAnomaliesAndAlerts } from "./anomalyDetection.js";

/**
 * Runs one endpoint's check, then runs the Day 3 anomaly/alert/AI pipeline
 * on the resulting snapshot.
 */
const checkAndAnalyze = async (endpoint) => {
  const snapshot = await runCheck(endpoint);
  try {
    await processAnomaliesAndAlerts(endpoint, snapshot);
  } catch (err) {
    console.error(`Anomaly pipeline failed for endpoint "${endpoint.name}":`, err.message);
  }
  return snapshot;
};

const startScheduler = () => {
  const cronExpression = process.env.SCHEDULER_CRON || "*/1 * * * *";

  if (!cron.validate(cronExpression)) {
    console.error(`Invalid SCHEDULER_CRON expression: "${cronExpression}" — scheduler not started.`);
    return;
  }

  console.log(`Scheduler starting with cron expression: ${cronExpression}`);

  cron.schedule(cronExpression, async () => {
    const tickStartedAt = Date.now();

    let endpoints;
    try {
      endpoints = await Endpoint.find({ active: true });
    } catch (err) {
      console.error("Scheduler tick failed to load endpoints:", err.message);
      return;
    }

    if (endpoints.length === 0) {
      console.log("Scheduler tick: no active endpoints registered.");
      return;
    }

    const results = await Promise.allSettled(endpoints.map((endpoint) => checkAndAnalyze(endpoint)));

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`Check crashed for endpoint "${endpoints[i].name}":`, result.reason?.message || result.reason);
      }
    });

    const durationMs = Date.now() - tickStartedAt;
    console.log(
      `Scheduler tick complete: ${succeeded}/${endpoints.length} checks recorded` +
      (failed > 0 ? ` (${failed} crashed unexpectedly)` : "") +
      ` in ${durationMs}ms.`
    );
  });
};

export default startScheduler;
