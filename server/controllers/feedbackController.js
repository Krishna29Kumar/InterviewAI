const Feedback = require('../models/Feedback');
const Interview = require('../models/Interview');

/**
 * @desc    Get feedback by Interview ID
 * @route   GET /api/feedback/:id
 * @access  Private
 */
const getFeedbackByInterviewId = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ interview: req.params.id });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found for this interview' });
    }

    // Verify ownership of the interview
    const interview = await Interview.findById(feedback.interview);
    if (!interview || interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this feedback' });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFeedbackByInterviewId,
};
