/**
 * FILE: client/src/redux/slices/interviewSlice.js
 * ================================================================
 * YE FILE KYA HAI: Normal AI-powered interview session ka poora
 * frontend state — "interview" slice of the Redux store.
 *
 * DO ASYNC ACTIONS:
 *   1. startInterview()  → Role/Level/Type/Difficulty backend ko
 *      bhejta hai, Ollama-generated questions wapas milte hain
 *   2. submitInterview()  → Saare answers backend ko bhejta hai,
 *      Ollama ka poora evaluation (feedback) wapas milta hai
 *
 * LOCALSTORAGE PERSISTENCE (bahut important feature):
 *   Current interview, uske answers, aur current question index —
 *   teeno localStorage mein save hote hain real-time (har answer
 *   save hone pe). Isliye agar user galti se tab band kar de ya
 *   browser refresh ho jaaye interview ke beech mein, poora session
 *   (kaunsa question tha, kya answers diye the) wapas load ho jaata
 *   hai — koi data loss nahi hota.
 *
 * SYNC REDUCERS:
 *   saveAnswer         → Ek question ka answer save/update karta hai
 *   nextQuestion / prevQuestion → Question navigate karte hain
 *   setQuestionIndex   → Directly kisi bhi question pe jump karo
 *   clearActiveInterview → Interview khatam hone ke baad sab reset
 *   clearFeedback      → Purana feedback clear karo (naya interview shuru karne se pehle)
 *
 * PROJECT MEIN ROLE: InterviewSetup.jsx (start karta hai),
 * InterviewSession.jsx (poora session yahin manage hota hai),
 * dono is slice ko heavily use karte hain.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Page load hote hi localStorage se koi in-progress interview session
// (agar tab crash/refresh hua ho) wapas restore karo
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

// Naya interview start karo — Ollama se questions generate hoke aate hain
export const startInterview = createAsyncThunk(
  'interview/generate',
  async (configs, { rejectWithValue }) => {
    try {
      const response = await api.post('/interview/generate', configs);
      // Fresh session localStorage mein persist karo
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

// Interview submit karo — Ollama evaluate karke poora feedback deta hai
export const submitInterview = createAsyncThunk(
  'interview/submit',
  async ({ interviewId, answers }, { rejectWithValue }) => {
    try {
      const response = await api.post('/interview/submit', { interviewId, answers });
      // Interview complete ho gaya — localStorage cache cleanup karo
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
    // Ek question ka answer save/update karo (aur localStorage sync bhi)
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
    // Interview poori tarah khatam — sab kuch (state + localStorage) reset karo
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
      // startInterview lifecycle
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
      // submitInterview lifecycle
      .addCase(submitInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = action.payload; // Yehi feedback InterviewSession.jsx report screen pe dikhata hai
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
