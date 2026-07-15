/**
 * FILE: server/models/Interview.js
 * ================================================================
 * YE FILE KYA HAI: Har normal (Technical/Behavioral/HR) AI interview
 * session ka schema — MongoDB mein ek interview kaisa store hota hai.
 *
 * LIFECYCLE (kaise data bharta hai):
 *   1. `status: 'active'` ke saath banta hai jab user "Start Practice"
 *      dabata hai (questions AI se generate hokar yahan save hote hain)
 *   2. User answers deta jaata hai (`answers` array mein index-wise fill hota hai)
 *   3. Submit hone pe `status: 'completed'` ho jaata hai, aur Ollama se
 *      mila poora `feedback` object (per-metric scores + insights) yahin
 *      permanently save ho jaata hai
 *
 * PROJECT MEIN ROLE:
 *   - interviewController.js is model ko create/update/read karta hai
 *   - AnalyticsPage.jsx (frontend) `feedback` field se hi apne saare
 *     charts (Score Progression, Skill Breakdown, AI Insights) banata hai
 *   - Dashboard "Recent Sessions" list bhi isi model se aati hai
 */

const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: [true, 'Please specify the job role'],
    },
    level: {
      type: String,
      required: [true, 'Please specify the experience level'],
      enum: ['Junior', 'Mid', 'Senior'],
    },
    difficulty: {
      type: String,
      required: [true, 'Please specify the difficulty level'],
      enum: ['Easy', 'Medium', 'Hard'],
    },
    type: {
      type: String,
      required: [true, 'Please specify the interview type'],
      enum: ['Technical', 'Behavioral', 'HR'],
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    // AI (Ollama) se generate hue questions
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
      },
    ],
    // User ke diye hue jawab, questionIndex se link hote hain
    answers: [
      {
        questionIndex: {
          type: Number,
          required: true,
        },
        answerText: {
          type: String,
          required: true,
        },
        audioUrl: {
          type: String,
          default: '', // Agar voice se answer diya ho toh recorded audio ka URL
        },
      },
    ],
    // Quick-access overall score (feedback.averageScore ka hi copy, list views ke liye)
    score: {
      type: Number,
      default: 0,
    },
    // Ollama se mila poora detailed evaluation — Analytics page isi se banti hai
    feedback: {
      technicalScore: Number,
      communicationScore: Number,
      confidenceScore: Number,
      grammarScore: Number,
      problemSolvingScore: Number,
      averageScore: Number,
      strengths: String,
      weaknesses: String,
      suggestions: String,
      feedbackDetails: [
        {
          questionText: String,
          answerText: String,
          score: Number,
          strengths: String,
          weaknesses: String,
          suggestions: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Interview', interviewSchema);
