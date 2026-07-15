/**
 * NEW FILE
 * SAVE AT: InterviewAI/client/src/pages/CompanyDSASetup.jsx
 * ===========================================================
 * Setup page: Company + Difficulty + Number of Questions selection.
 * On submit -> navigates to /dsa-practice/session
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Loader2, Building2, Code2 } from 'lucide-react';
import { fetchCompanies, fetchCompanyProblems } from '../redux/slices/dsaSlice';

const FALLBACK_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Adobe'];

const CompanyDSASetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companies, loading } = useSelector((state) => state.dsa);

  const [company, setCompany] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [numQuestions, setNumQuestions] = useState(5);

  useEffect(() => { dispatch(fetchCompanies()); }, [dispatch]);

  const companyList = companies.length ? companies : FALLBACK_COMPANIES;

  useEffect(() => {
    if (!company && companyList.length) setCompany(companyList[0]);
  }, [companyList, company]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return toast.error('Company select karo pehle');

    const result = await dispatch(fetchCompanyProblems({ company, difficulty, count: numQuestions }));
    if (fetchCompanyProblems.fulfilled.match(result)) {
      navigate('/dsa-practice/session');
    } else {
      toast.error(result.payload || 'Questions load nahi hue');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl border border-darkBorder p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-neonBlue/10 border border-neonBlue/30 flex items-center justify-center">
            <Code2 className="w-7 h-7 text-neonBlue" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Company-Specific DSA Practice</h2>
          <p className="text-sm text-gray-400">
            Company select karo, difficulty aur questions count set karo — strict proctored session start hoga.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5 inline mr-1" /> Company
            </label>
            <select value={company} onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input">
              {companyList.map((c) => (
                <option key={c} value={c} className="bg-darkCard">{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input">
                <option value="Easy" className="bg-darkCard">Easy</option>
                <option value="Medium" className="bg-darkCard">Medium</option>
                <option value="Hard" className="bg-darkCard">Hard</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Questions</label>
                <span className="text-sm font-bold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-3 py-0.5 rounded-full">
                  {numQuestions}
                </span>
              </div>
              <input type="range" min="1" max="10" value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neonBlue" />
            </div>
          </div>

          <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            ⚠️ Ye session standard practice interview se zyada strict hai — fullscreen mandatory hai,
            tab switch ya copy-paste pe session turant terminate ho jayega.
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-neon-gradient text-white font-bold text-sm shadow-neon-blue hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center space-x-2">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Loading Questions...</span></>
            ) : (
              <span>Start Strict Practice Session</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CompanyDSASetup;
