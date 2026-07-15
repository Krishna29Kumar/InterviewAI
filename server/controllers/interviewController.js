/**
 * FILE: server/controllers/interviewController.js
 * ================================================================
 * YE FILE KYA HAI: Normal AI-powered interview flow ka poora backend
 * logic — questions generate karna, answers evaluate karna, history
 * dikhana.
 *
 * FUNCTIONS:
 *   1. generateInterviewSession() → Role/Level/Type/Difficulty leke
 *      Ollama se questions banwata hai, ek naya 'active' Interview
 *      document DB mein create karta hai.
 *   2. submitInterviewSession()   → User ke answers leke Ollama se
 *      poora evaluation (scores + strengths/weaknesses/suggestions)
 *      leta hai, aur interview ko 'completed' mark karke feedback
 *      permanently save karta hai. ISME EK IMPORTANT SAFEGUARD hai
 *      (neeche explain kiya hai).
 *   3. getInterviewHistory()      → User ke saare past interviews
 *      list karta hai (Dashboard "Recent Sessions" isi se banta hai).
 *   4. transcribeAudioFile()      → Voice-answer audio ko text mein
 *      badalta hai (abhi Whisper disabled hai, isliye ye hamesha
 *      fallback signal bhejta hai taaki frontend browser ke apne
 *      Web Speech API pe switch kar jaaye).
 *   5. getInterviewFeedback()     → Ek specific completed interview
 *      ka saved feedback wapas deta hai (AnalyticsPage.jsx isi se
 *      apne charts banata hai).
 *
 * SAFEGUARD (submitInterviewSession ke andar) — KYU ZAROORI THA:
 *   Ollama (LLM) kabhi-kabhi khaali/placeholder answers ko bhi thoda-
 *   bahut score de deta tha (jaise 30-40%), jo galat hai — agar user ne
 *   kuch likha hi nahi, score 0 hona chahiye. Isliye submit hone ke
 *   baad, hum khud dobara check karte hain: jis bhi question ka answer
 *   khaali ya "No answer provided." hai, uska score forcibly 0 kar dete
 *   hain, aur overall averageScore ko in corrected scores se dobara
 *   calculate karte hain. Agar SAARE answers khaali the, toh saare
 *   sub-scores (technical/communication/confidence/grammar) bhi 0 kar
 *   dete hain. Ye ek extra layer of correctness hai jo AI ke output pe
 *   andha bharosa nahi karta.
 *
 * PROJECT MEIN ROLE: routes/interviewRoutes.js in functions ko
 * /api/interview/* endpoints se jodta hai. Frontend ki taraf se
 * interviewSlice.js (Redux) aur AnalyticsPage.jsx inhe call karte hain.
 */

const fs = require('fs');
const aiService = require('../services/aiService');
const Interview = require('../models/Interview');

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

    // Ollama (ya fallback question bank) se questions generate karo
    const questions = await aiService.generateQuestions(role, level, type, difficulty, count);

    // Naya 'active' interview session DB mein banao
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

    interview.answers = answers;
    interview.status = 'completed';

    // Ollama se poora evaluation lo (per-metric scores + insights)
    const evaluation = await aiService.analyzeInterview(
      interview.role,
      interview.level,
      interview.questions,
      answers
    );

    // ── SAFEGUARD ──
    // Ollama kabhi khaali/placeholder answers ko bhi galti se score de
    // sakta hai — hum khud yahan dobara verify karke correct karte hain,
    // AI ke output pe poora bharosa nahi karte.
    const isBlank = (text) => !text || !text.trim() || text.trim().toLowerCase() === 'no answer provided.';

    if (Array.isArray(evaluation.feedbackDetails)) {
      evaluation.feedbackDetails = evaluation.feedbackDetails.map((detail, idx) => {
        const ans = answers.find(a => a.questionIndex === idx);
        const answerText = ans ? ans.answerText : '';
        if (isBlank(answerText)) {
          return { ...detail, score: 0, weaknesses: 'No response provided.' };
        }
        return detail;
      });

      // Corrected per-question scores se overall average dobara nikalo
      const scores = evaluation.feedbackDetails.map(d => d.score || 0);
      const recomputedAvg = scores.length
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : 0;
      evaluation.averageScore = recomputedAvg;

      // Agar SAARE answers khaali the, toh saare sub-scores bhi 0 kar do
      const allBlank = answers.length === 0 || answers.every(a => isBlank(a.answerText));
      if (allBlank) {
        evaluation.technicalScore = 0;
        evaluation.communicationScore = 0;
        evaluation.confidenceScore = 0;
        evaluation.grammarScore = 0;
        evaluation.problemSolvingScore = 0;
        evaluation.averageScore = 0;
      }
    }

    // Overall score + poora feedback breakdown, dono permanently save karo
    interview.score = evaluation.averageScore || 0;
    interview.feedback = evaluation;
    await interview.save();

    res.status(200).json(evaluation);
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
    // Sabse naya interview sabse upar (Dashboard ki "Recent Sessions" list)
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
      // NOTE: aiService.transcribeAudio() abhi jaan-boojh kar error throw
      // karta hai (Whisper disabled hai) — isliye ye hamesha catch block
      // mein jaakar 'fallback: true' bhejega, jisse frontend browser ke
      // apne built-in Web Speech API pe switch kar jaata hai.
      const transcript = await aiService.transcribeAudio(req.file.path);

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path); // Temp audio file cleanup
      }

      res.json({ transcript });
    } catch (transcribeError) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(422).json({
        message: 'Whisper service unavailable. Fallback to client browser text recognition.',
        fallback: true
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get saved feedback for a completed interview
 * @route   GET /api/interview/feedback/:id
 * @access  Private
 */
const getInterviewFeedback = async (req, res) => {
  try {
    // user check bhi saath mein hai — koi doosre user ka feedback na dekh paaye
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    if (interview.status !== 'completed' || !interview.feedback) {
      return res.status(404).json({ message: 'Feedback not available for this interview' });
    }
    res.json(interview.feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateInterviewSession,
  submitInterviewSession,
  getInterviewHistory,
  transcribeAudioFile,
  getInterviewFeedback,
};
