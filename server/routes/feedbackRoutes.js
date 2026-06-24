const express = require('express');
const router = express.Router();
const { getFeedbackByInterviewId } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:id', protect, getFeedbackByInterviewId);

module.exports = router;
