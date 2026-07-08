/**
 * FILE: server/routes/poseRoutes.js
 * ===================================
 * React → Express → FastAPI (Python) bridge
 *
 * React frame bhejta hai → Express receive karta hai →
 * Python FastAPI ko forward karta hai → result wapas bhejta hai
 */

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// Python FastAPI ka address (docker mein "backend", local mein "localhost")
const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// ──────────────────────────────────────────
// POST /api/pose/analyze-frame
// React webcam frame → Python YOLOv8n
// ──────────────────────────────────────────
router.post('/analyze-frame', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'image field required hai' });
    }

    const response = await axios.post(
      `${PYTHON_URL}/anomaly/analyze`,
      { image },
      { timeout: 7000 }
    );

    return res.json(response.data);

  } catch (err) {
    // Python service band hai — crash mat karo, graceful response do
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return res.json({
        anomalies:    [],
        score:        100,
        details:      { msg: 'Pose service offline hai' },
        person_count: 1,
        service_down: true,
      });
    }
    console.error('[PoseRoute] Error:', err.message);
    return res.status(500).json({ error: 'Pose analysis fail ho gayi' });
  }
});

// ──────────────────────────────────────────
// GET /api/pose/health
// Python service online check
// ──────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const r = await axios.get(`${PYTHON_URL}/anomaly/health`, { timeout: 3000 });
    return res.json({ pose_service: 'online', ...r.data });
  } catch {
    return res.json({ pose_service: 'offline' });
  }
});

module.exports = router;
