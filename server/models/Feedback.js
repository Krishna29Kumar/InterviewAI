const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    technicalScore: {
      type: Number,
      default: 0,
    },
    communicationScore: {
      type: Number,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      default: 0,
    },
    grammarScore: {
      type: Number,
      default: 0,
    },
    problemSolvingScore: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    strengths: {
      type: String,
      default: '',
    },
    weaknesses: {
      type: String,
      default: '',
    },
    suggestions: {
      type: String,
      default: '',
    },
    feedbackDetails: [
      {
        questionText: {
          type: String,
        },
        answerText: {
          type: String,
        },
        score: {
          type: Number,
          default: 0,
        },
        strengths: {
          type: String,
          default: '',
        },
        weaknesses: {
          type: String,
          default: '',
        },
        suggestions: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
