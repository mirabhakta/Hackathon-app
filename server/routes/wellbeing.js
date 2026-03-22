const express  = require("express");
const fetch    = require("node-fetch"); 

const router = express.Router();

const BURNOUT_SERVICE_URL = process.env.BURNOUT_SERVICE_URL ?? "http://localhost:5001";
const FATIGUE_SERVICE_URL = process.env.FATIGUE_SERVICE_URL ?? "http://localhost:5002";

// Feature flag — set FATIGUE_ENABLED=true in .env only for local demo with the Python service running
const FATIGUE_ENABLED = process.env.FATIGUE_ENABLED === "true";

// ── Health ────────────────────────────────────────────────────────────────────

router.get("/health", (_req, res) => {
  res.json({ status: "ok", fatigueEnabled: FATIGUE_ENABLED });
});

// ── Workload score (was: burnout predict) ────────────────────────────────────

async function proxyWorkloadScore(req, res) {
  try {
    const upstream = await fetch(`${BURNOUT_SERVICE_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(req.body),
      timeout: 4000,
    });
    const data = await upstream.json();
    // Normalise field name: the Python service returns "burnout_rate" or "score"
    const rawScore = data.burnout_rate ?? data.score ?? 0;
    res.json({ workloadBalanceScore: rawScore });
  } catch (err) {
    console.warn("[wellbeing] Workload score service unavailable:", err.message);
    // Graceful fallback — return a neutral mid-range value so the UI doesn't crash
    res.json({ workloadBalanceScore: 0.3, fallback: true });
  }
}

// New canonical route
router.post("/workload/score", proxyWorkloadScore);

// Backward-compat alias (keep so old frontend code doesn't 404 before you update it)
router.post("/burnout/predict", proxyWorkloadScore);

// ── Fatigue detection (opt-in, experimental) ─────────────────────────────────

router.get("/fatigue/status", async (_req, res) => {
  if (!FATIGUE_ENABLED) {
    // Feature disabled — return a clearly labelled "not available" response
    return res.json({
      enabled: false,
      message: "Fatigue detection is not enabled in this environment.",
    });
  }

  try {
    const upstream = await fetch(`${FATIGUE_SERVICE_URL}/status`, {
      timeout: 3000,
    });
    const data = await upstream.json();
    res.json({ enabled: true, ...data });
  } catch (err) {
    console.warn("[wellbeing] Fatigue service unavailable:", err.message);
    res.json({
      enabled: true,
      available: false,
      message: "Fatigue service is not reachable right now.",
    });
  }
});

module.exports = router;
