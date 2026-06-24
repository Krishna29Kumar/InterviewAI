const fs = require('fs');
const aiService = require('../services/aiService');
const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');

/**
 * @desc    Start an interview & generate questions
 * @route   POST /api/interview/generate
 * @access  Private
 */
const generateInterviewSession = async (req, res) => {
  try {
    const { role, level, type, difficulty, numQuestions } = req.body;

    if (!role || !level || !type || !difficulty) {
      return res.status(400).json({ message: 'Please select all configuration settings' });
    }

    const count = parseInt(numQuestions) || 5;

    // Generate questions using AI service
    const questions = await aiService.generateQuestions(role, level, type, difficulty, count);

    // Save active interview
    const interview = await Interview.create({
      user: req.user._id,
      role,
      level,
      difficulty,
      type,
      questions,
      answers: [],
      status: 'active',
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Submit candidate answers & evaluate using AI
 * @route   POST /api/interview/submit
 * @access  Private
 */
const submitInterviewSession = async (req, res) => {
  try {
    const { interviewId, answers } = req.body;

    if (!interviewId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Missing interview credentials or responses' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'This interview has already been submitted and graded' });
    }

    // Save responses to interview record
    interview.answers = answers;
    interview.status = 'completed';

    // Get feedback analysis from OpenAI GPT-4o
    const evaluation = await aiService.analyzeInterview(
      interview.role,
      interview.level,
      interview.questions,
      answers
    );

    // Save overall score to the interview record
    interview.score = evaluation.averageScore || 0;
    await interview.save();

    // Create Feedback document
    const feedback = await Feedback.create({
      interview: interviewId,
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      confidenceScore: evaluation.confidenceScore,
      grammarScore: evaluation.grammarScore,
      problemSolvingScore: evaluation.problemSolvingScore,
      averageScore: evaluation.averageScore,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestions: evaluation.suggestions,
      feedbackDetails: evaluation.feedbackDetails,
    });

    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error submitting interview:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user interview history list
 * @route   GET /api/interview/history
 * @access  Private
 */
const getInterviewHistory = async (req, res) => {
  try {
    const history = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Transcribe recorded audio file
 * @route   POST /api/interview/transcribe
 * @access  Private
 */
const transcribeAudioFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an audio file response' });
    }

    try {
      const transcript = await aiService.transcribeAudio(req.file.path);
      
      // Clean up temp file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({ transcript });
    } catch (transcribeError) {
      // Clean up temp file on error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      // Send fallback status code so the client switches to Web Speech API fallback
      res.status(422).json({
        message: 'Whisper service unavailable. Fallback to client browser text recognition.',
        fallback: true
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateInterviewSession,
  submitInterviewSession,
  getInterviewHistory,
  transcribeAudioFile,
};
