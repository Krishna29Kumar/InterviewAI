/**
 * FILE: server/routes/poseRoutes.js
 * ================================================================
 * YE FILE KYA HAI: React (webcam frame) → Express → Python FastAPI
 * (YOLOv8 pose detection) ke beech ka "bridge/proxy".
 *
 * KYU ZAROORI HAI: Camera ka posture/anomaly detection Python mein
 * chalta hai (YOLOv8 model, jo sirf Python mein achhe se available
 * hai). Lekin frontend seedha Python service se baat nahi karta —
 * pehle isi Express route pe aata hai, jo request ko Python ko
 * forward karke result wapas bhejta hai. Isse authentication aur
 * CORS handling ek hi jagah (Express) se manage hoti hai.
 *
 * ROUTES:
 *   POST /api/pose/analyze-frame → useAnomalyDetector.js (frontend
 *      hook) har 2-3 second mein ek webcam frame (base64 image)
 *      yahan bhejta hai. Ye Python FastAPI ke /anomaly/analyze ko
 *      forward karta hai, jo YOLOv8 se posture/multiple-people/
 *      no-person jaisi anomalies detect karke score deta hai.
 *
 *   GET  /api/pose/health → Python service online hai ya nahi, ye
 *      check karne ke liye (agar Python backend band ho, graceful
 *      "service_down" response milta hai, poori app crash nahi hoti).
 *
 * PROJECT MEIN ROLE: Interview aur DSA practice, dono ke proctored
 * sessions isi route se apna camera-based cheating detection chalate hain.
 */

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// Python FastAPI ka address — docker mein "backend" service name, local mein "localhost"
const PYTHON_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/pose/analyze-frame
 * React se webcam frame aata hai → Python YOLOv8n ko forward hota hai
 */
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
    // Python service band ho toh crash mat karo — graceful "everything is fine"
    // response bhej do taaki proctoring UI break na ho
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

/**
 * GET /api/pose/health
 * Python pose-detection service abhi online hai ya nahi, check karta hai
 */
router.get('/health', async (req, res) => {
  try {
    const r = await axios.get(`${PYTHON_URL}/anomaly/health`, { timeout: 3000 });
    return res.json({ pose_service: 'online', ...r.data });
  } catch {
    return res.json({ pose_service: 'offline' });
  }
});

module.exports = router;
