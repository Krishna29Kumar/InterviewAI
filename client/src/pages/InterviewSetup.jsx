import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { startInterview } from '../redux/slices/interviewSlice';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, ArrowLeft, ArrowRight, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const InterviewSetup = () => {
  const [role, setRole] = useState('Frontend Developer');
  const [customRole, setCustomRole] = useState('');
  const [level, setLevel] = useState('Mid');
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.interview);

  const rolesPool = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Product Manager',
    'Data Scientist',
    'Custom Role',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedRole = role === 'Custom Role' ? customRole : role;
    if (role === 'Custom Role' && !customRole.trim()) {
      return toast.error('Please input your custom job role title');
    }

    const configs = {
      role: selectedRole,
      level,
      type,
      difficulty,
      numQuestions,
    };

    const resultAction = await dispatch(startInterview(configs));

    if (startInterview.fulfilled.match(resultAction)) {
      toast.success('Interview questions generated successfully!');
      navigate('/interview');
    } else {
      toast.error(resultAction.payload || 'Failed to start interview. Try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative z-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition duration-200"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-neonPurple/10 border border-neonPurple/20 flex items-center justify-center text-neonPurple">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Configure Interview</h1>
          <p className="text-gray-400 text-xs mt-0.5">Customize your session variables to trigger AI questioning</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="glass-panel p-8 rounded-2xl border border-darkBorder space-y-6 shadow-glass"
      >
        {/* Job Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Target Job Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
            >
              {rolesPool.map((r) => (
                <option key={r} value={r} className="bg-darkCard text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Experience Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
            >
              <option value="Junior" className="bg-darkCard text-white">Junior (0-2 yrs)</option>
              <option value="Mid" className="bg-darkCard text-white">Mid-Level (2-5 yrs)</option>
              <option value="Senior" className="bg-darkCard text-white">Senior (5+ yrs)</option>
            </select>
          </div>
        </div>

        {/* Custom Role Input */}
        {role === 'Custom Role' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-1.5"
          >
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Custom Job Title
            </label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
              placeholder="e.g. Kubernetes Administrator / iOS Architect"
              required
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interview Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Interview Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
            >
              <option value="Technical" className="bg-darkCard text-white">Technical (Coding & System Design)</option>
              <option value="Behavioral" className="bg-darkCard text-white">Behavioral (Situational & Leadership)</option>
              <option value="HR" className="bg-darkCard text-white">HR (General Culture-Fit)</option>
            </select>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Difficulty Setting
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
            >
              <option value="Easy" className="bg-darkCard text-white">Easy</option>
              <option value="Medium" className="bg-darkCard text-white">Medium</option>
              <option value="Hard" className="bg-darkCard text-white">Hard</option>
            </select>
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Questions count
            </label>
            <span className="text-sm font-bold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-2 py-0.5 rounded">
              {numQuestions} questions
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="10"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neonBlue"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-neon-gradient text-white font-bold text-sm shadow-neon-blue bg-neon-gradient-hover hover:scale-[1.02] active:scale-[0.98] transition duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating AI Questions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-white" />
              <span>Start Practice Session</span>
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
};

export default InterviewSetup;
