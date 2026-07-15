/**
 * FILE: client/src/redux/slices/dsaSlice.js
 * ================================================================
 * YE FILE KYA HAI: Company-Specific DSA Practice feature ka poora
 * frontend state — "dsa" slice of the Redux store.
 *
 * DO ASYNC ACTIONS:
 *   1. fetchCompanies()       → Backend se un saari companies ki list
 *      leta hai jinke DSA questions seed hain (abhi 59 companies).
 *      CompanyDSASetup.jsx isse dropdown banata hai.
 *   2. fetchCompanyProblems() → Ek specific company + difficulty +
 *      count ke random questions leta hai. Ye action fulfill hote hi
 *      `config` bhi save ho jaata hai (kaunsi company/difficulty
 *      select hui thi) — taaki session page pe wo info dikha sakein.
 *
 * SYNC REDUCERS:
 *   nextDSAQuestion / prevDSAQuestion → Questions ke beech navigate
 *   saveDSAAnswer                    → Ek question ka likha hua code save karo
 *   clearDSASession                  → Session khatam hone ke baad sab reset
 *
 * PROJECT MEIN ROLE: CompanyDSASetup.jsx (company/difficulty select
 * karke fetchCompanyProblems call karta hai) aur CompanyDSASession.jsx
 * (poora strict-mode practice session yahin se driven hota hai) dono
 * is slice ko use karte hain.
 *
 * NOTE: Is slice mein localStorage persistence NAHI hai (jaan-boojh
 * kar) — DSA practice session refresh hone pe restart hota hai, kyunki
 * ye "strict mode" session hai (fullscreen/camera enforcement), aur
 * beech mein resume karna security-model ke against jaata.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Saari seeded companies ki list mangwao (dropdown banane ke liye)
export const fetchCompanies = createAsyncThunk('dsa/fetchCompanies', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/dsa/companies');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Companies load nahi hui');
  }
});

// Ek specific company ke random DSA questions mangwao
export const fetchCompanyProblems = createAsyncThunk(
  'dsa/fetchProblems',
  async ({ company, difficulty, count }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/dsa/companies/${encodeURIComponent(company)}/problems`, {
        params: { difficulty, count },
      });
      return { company, difficulty, count, problems: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Questions load nahi hue');
    }
  }
);

const initialState = {
  companies: [],
  problems: [],
  currentIndex: 0,
  config: null, // { company, difficulty, count } — jo setup page pe select hua tha
  answers: [],
  loading: false,
  error: null,
};

const dsaSlice = createSlice({
  name: 'dsa',
  initialState,
  reducers: {
    nextDSAQuestion(state) {
      if (state.currentIndex < state.problems.length - 1) state.currentIndex += 1;
    },
    prevDSAQuestion(state) {
      if (state.currentIndex > 0) state.currentIndex -= 1;
    },
    // Ek problem ka likha hua code save/update karo
    saveDSAAnswer(state, action) {
      const { problemId, code } = action.payload;
      const idx = state.answers.findIndex((a) => a.problemId === problemId);
      if (idx > -1) state.answers[idx].code = code;
      else state.answers.push({ problemId, code });
    },
    // Session poori tarah khatam — sab reset (naya session start karne ke liye ready)
    clearDSASession(state) {
      state.problems = [];
      state.currentIndex = 0;
      state.config = null;
      state.answers = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.companies = action.payload;
      })
      .addCase(fetchCompanyProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyProblems.fulfilled, (state, action) => {
        state.loading = false;
        state.problems = action.payload.problems;
        state.config = {
          company: action.payload.company,
          difficulty: action.payload.difficulty,
          count: action.payload.count,
        };
        state.currentIndex = 0;
        state.answers = [];
      })
      .addCase(fetchCompanyProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { nextDSAQuestion, prevDSAQuestion, saveDSAAnswer, clearDSASession } = dsaSlice.actions;
export default dsaSlice.reducer;
