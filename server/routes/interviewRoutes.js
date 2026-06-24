const express = require('express');
const router = express.Router();
const {
  generateInterviewSession,
  submitInterviewSession,
  getInterviewHistory,
  transcribeAudioFile,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/generate', protect, generateInterviewSession);
router.post('/submit', protect, submitInterviewSession);
router.get('/history', protect, getInterviewHistory);
router.post('/transcribe', protect, upload.single('audio'), transcribeAudioFile);

module.exports = router;
