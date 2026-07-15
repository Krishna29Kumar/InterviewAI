/**
 * FILE: server/routes/interviewRoutes.js
 * ================================================================
 * YE FILE KYA HAI: Normal AI-powered interview flow ke saare URL
 * endpoints — question generate karna, submit/evaluate karna,
 * history dekhna, feedback dekhna, audio transcribe karna.
 *
 * ROUTES:
 *   POST /api/interview/generate     → Naya interview start (questions banao)
 *   POST /api/interview/submit       → Answers submit karo, Ollama se evaluate ho
 *   GET  /api/interview/history      → Past sabhi interviews ki list
 *   GET  /api/interview/feedback/:id → Ek specific interview ka saved feedback
 *   POST /api/interview/transcribe   → Voice-answer audio ko text mein badlo
 *
 * PROJECT MEIN ROLE: server.js is router ko `/api/interview` prefix
 * ke saath mount karta hai. Frontend ka interviewSlice.js (Redux) aur
 * AnalyticsPage.jsx in endpoints ko call karte hain.
 */

const express = require('express');
const router = express.Router();
const {
  generateInterviewSession,
  submitInterviewSession,
  getInterviewHistory,
  transcribeAudioFile,
  getInterviewFeedback,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/generate', protect, generateInterviewSession);
router.post('/submit', protect, submitInterviewSession);
router.get('/history', protect, getInterviewHistory);
router.get('/feedback/:id', protect, getInterviewFeedback);
router.post('/transcribe', protect, upload.single('audio'), transcribeAudioFile); // 'audio' field se voice recording aati hai

module.exports = router;
