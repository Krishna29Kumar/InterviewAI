import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state reading from localStorage for session persistence
let cachedInterview = null;
let cachedAnswers = [];
let cachedIndex = 0;

try {
  cachedInterview = JSON.parse(localStorage.getItem('currentInterview')) || null;
  cachedAnswers = JSON.parse(localStorage.getItem('interviewAnswers')) || [];
  cachedIndex = parseInt(localStorage.getItem('interviewIndex')) || 0;
} catch (e) {
  console.error('Failed to parse cached interview data:', e);
}

const initialState = {
  currentInterview: cachedInterview,
  currentIndex: cachedIndex,
  answers: cachedAnswers,
  loading: false,
  error: null,
  feedback: null,
};

// Start a new interview
export const startInterview = createAsyncThunk(
  'interview/generate',
  async (configs, { rejectWithValue }) => {
    try {
      const response = await api.post('/interview/generate', configs);
      localStorage.setItem('currentInterview', JSON.stringify(response.data));
      localStorage.setItem('interviewAnswers', JSON.stringify([]));
      localStorage.setItem('interviewIndex', '0');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start interview';
      return rejectWithValue(message);
    }
  }
);

// Submit interview answers
export const submitInterview = createAsyncThunk(
  'interview/submit',
  async ({ interviewId, answers }, { rejectWithValue }) => {
    try {
      const response = await api.post('/interview/submit', { interviewId, answers });
      // Clean up localStorage session cache upon submission
      localStorage.removeItem('currentInterview');
      localStorage.removeItem('interviewAnswers');
      localStorage.removeItem('interviewIndex');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to evaluate interview';
      return rejectWithValue(message);
    }
  }
);

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    saveAnswer(state, action) {
      const { questionIndex, answerText, audioUrl } = action.payload;
      const existingIdx = state.answers.findIndex((ans) => ans.questionIndex === questionIndex);

      if (existingIdx > -1) {
        state.answers[existingIdx] = { questionIndex, answerText, audioUrl };
      } else {
        state.answers.push({ questionIndex, answerText, audioUrl });
      }

      localStorage.setItem('interviewAnswers', JSON.stringify(state.answers));
    },
    nextQuestion(state) {
      if (state.currentInterview && state.currentIndex < state.currentInterview.questions.length - 1) {
        state.currentIndex += 1;
        localStorage.setItem('interviewIndex', state.currentIndex.toString());
      }
    },
    prevQuestion(state) {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        localStorage.setItem('interviewIndex', state.currentIndex.toString());
      }
    },
    setQuestionIndex(state, action) {
      state.currentIndex = action.payload;
      localStorage.setItem('interviewIndex', action.payload.toString());
    },
    clearActiveInterview(state) {
      state.currentInterview = null;
      state.currentIndex = 0;
      state.answers = [];
      state.error = null;
      state.feedback = null;
      localStorage.removeItem('currentInterview');
      localStorage.removeItem('interviewAnswers');
      localStorage.removeItem('interviewIndex');
    },
    clearFeedback(state) {
      state.feedback = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Start Interview
      .addCase(startInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.feedback = null;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInterview = action.payload;
        state.currentIndex = 0;
        state.answers = [];
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit Interview
      .addCase(submitInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = action.payload;
        state.currentInterview = null;
        state.currentIndex = 0;
        state.answers = [];
      })
      .addCase(submitInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  saveAnswer,
  nextQuestion,
  prevQuestion,
  setQuestionIndex,
  clearActiveInterview,
  clearFeedback,
} = interviewSlice.actions;

export default interviewSlice.reducer;
