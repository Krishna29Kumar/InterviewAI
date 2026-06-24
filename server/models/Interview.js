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
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
      },
    ],
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
          default: '',
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Interview', interviewSchema);
