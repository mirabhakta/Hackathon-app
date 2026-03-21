import { Router } from "express";
import { requestJson } from "../services/httpClient.js";

const router = Router();
const fatigueServiceUrl = process.env.FATIGUE_SERVICE_URL ?? "http://127.0.0.1:5002";

router.get("/status", async (_req, res) => {
  try {
    const data = await requestJson(`${fatigueServiceUrl}/status`, {
      method: "GET",
      timeout: 5000
    });

    return res.json({
      connected: true,
      fatigueDetected: Boolean(
        data.fatigueDetected ?? data.fatigue_detected ?? data.status === "fatigued"
      ),
      confidence: Number(data.confidence ?? 0),
      raw: data
    });
  } catch (error) {
    return res.json({
      connected: false,
      fatigueDetected: false,
      confidence: 0,
      warning: "Fatigue detection service unavailable."
    });
  }
});

export default router;
