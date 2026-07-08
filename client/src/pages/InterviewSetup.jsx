/**
 * FILE: client/src/pages/InterviewSetup.jsx
 * ===========================================
 * Saare scraped domains add kiye hain
 * Modern UI — industry level
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { startInterview } from '../redux/slices/interviewSlice';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sparkles, Loader2, ArrowLeft, Settings2,
  Code, Server, Database, Shield, Cpu, Cloud,
  Brain, BarChart2, Smartphone, Blocks, Eye,
  MessageSquare, Gamepad2, Terminal, Globe,
  ChevronDown, CheckCircle2,
} from 'lucide-react';

// ── All Domains (scraped data se match karta hai) ──
const DOMAINS = [
  {
    category: '🌐 Web Development',
    roles: [
      { label: 'Frontend Developer', icon: Globe, domain: 'frontend', desc: 'React, JS, HTML, CSS, Angular, Vue' },
      { label: 'Backend Developer', icon: Server, domain: 'backend', desc: 'Node.js, Express, REST APIs, Django' },
      { label: 'Full Stack Developer', icon: Code, domain: 'fullstack', desc: 'Frontend + Backend + System Design' },
    ]
  },
  {
    category: '🤖 AI & Data',
    roles: [
      { label: 'AI Engineer', icon: Brain, domain: 'ai_ml', desc: 'Machine Learning, Deep Learning, NLP' },
      { label: 'Data Scientist', icon: BarChart2, domain: 'data_science', desc: 'Pandas, NumPy, Statistics, Visualization' },
      { label: 'ML Engineer', icon: Brain, domain: 'ai_ml', desc: 'Model Training, MLOps, Deployment' },
      { label: 'NLP Engineer', icon: MessageSquare, domain: 'nlp', desc: 'Transformers, BERT, Text Processing' },
      { label: 'Computer Vision Eng.', icon: Eye, domain: 'computer_vision', desc: 'OpenCV, CNNs, Image Processing' },
    ]
  },
  {
    category: '🔒 Security & Systems',
    roles: [
      { label: 'Cybersecurity Analyst', icon: Shield, domain: 'cybersecurity', desc: 'Ethical Hacking, Network Security, Crypto' },
      { label: 'Ethical Hacker', icon: Shield, domain: 'cybersecurity', desc: 'Penetration Testing, CTF, Exploits' },
      { label: 'Embedded Eng.', icon: Cpu, domain: 'robotics', desc: 'Embedded C, Arduino, IoT, RTOS' },
      { label: 'Robotics Engineer', icon: Cpu, domain: 'robotics', desc: 'ROS, Control Systems, Sensors' },
    ]
  },
  {
    category: '☁️ Infrastructure',
    roles: [
      { label: 'DevOps Engineer', icon: Cloud, domain: 'devops', desc: 'Docker, K8s, CI/CD, AWS, Linux' },
      { label: 'Cloud Engineer', icon: Cloud, domain: 'devops', desc: 'AWS, Azure, GCP, Infrastructure' },
      { label: 'Database Admin', icon: Database, domain: 'database', desc: 'SQL, MongoDB, PostgreSQL, Redis' },
      { label: 'System Design Eng.', icon: Server, domain: 'system_design', desc: 'Scalability, Microservices, Architecture' },
    ]
  },
  {
    category: '📱 Mobile & Other',
    roles: [
      { label: 'Android Developer', icon: Smartphone, domain: 'mobile', desc: 'Java, Kotlin, Android SDK' },
      { label: 'iOS Developer', icon: Smartphone, domain: 'mobile', desc: 'Swift, UIKit, SwiftUI' },
      { label: 'Flutter Developer', icon: Smartphone, domain: 'mobile', desc: 'Dart, Flutter, Cross-platform' },
      { label: 'Blockchain Developer', icon: Blocks, domain: 'blockchain', desc: 'Solidity, Web3, Smart Contracts' },
      { label: 'Game Developer', icon: Gamepad2, domain: 'game_dev', desc: 'Unity, Unreal, C++, Physics' },
    ]
  },
  {
    category: '💻 Languages & CS',
    roles: [
      { label: 'Python Developer', icon: Terminal, domain: 'python', desc: 'Django, Flask, Scripting, Automation' },
      { label: 'Java Developer', icon: Terminal, domain: 'java', desc: 'Spring Boot, JVM, OOP, Microservices' },
      { label: 'C/C++ Developer', icon: Terminal, domain: 'cpp', desc: 'Memory Management, STL, Pointers' },
      { label: 'Software Engineer', icon: Code, domain: 'dsa', desc: 'DSA, Algorithms, OS, Networks, OOP' },
    ]
  },
];

const ALL_ROLES = DOMAINS.flatMap(d => d.roles);

const COMPANIES = [
  { label: 'Any Company', desc: 'General preparation' },
  { label: 'Google', desc: 'Focus on algorithms & system design' },
  { label: 'Microsoft', desc: 'OOP, problem solving, behavioral' },
  { label: 'Amazon', desc: 'Leadership principles + technical' },
  { label: 'Apple', desc: 'Deep technical + product thinking' },
  { label: 'Meta', desc: 'Systems, scale, product sense' },
  { label: 'Startup', desc: 'Versatility, ownership, speed' },
  { label: 'TCS / Infosys', desc: 'Core CS fundamentals' },
];

export default function InterviewSetup() {
  const [step, setStep] = useState(1); // 1=role, 2=config
  const [selectedRole, setSelectedRole] = useState(null);
  const [customRole, setCustomRole] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [level, setLevel] = useState('Mid');
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [company, setCompany] = useState('Any Company');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(s => s.interview);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsCustom(false);
    setStep(2);
  };

  const handleCustomRole = () => {
    setIsCustom(true);
    setSelectedRole({ label: 'Custom Role', icon: Code, domain: 'dsa', desc: 'Your custom role' });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roleName = isCustom ? customRole.trim() : selectedRole?.label;
    if (!roleName) return toast.error('Role select karo ya custom role enter karo');

    const result = await dispatch(startInterview({
      role: roleName,
      level, type, difficulty, numQuestions,
      company: company === 'Any Company' ? null : company,
    }));

    if (startInterview.fulfilled.match(result)) {
      toast.success('Interview questions ready!');
      navigate('/interview');
    } else {
      toast.error(result.payload || 'Failed to start. Try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10">
      <Link to="/dashboard" className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition">
        <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Dashboard</span>
      </Link>

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-neonPurple/10 border border-neonPurple/20 flex items-center justify-center text-neonPurple">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Configure Interview</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Step {step} of 2 — {step === 1 ? 'Select your domain' : 'Configure settings'}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-neonBlue text-black' : 'bg-white/10 text-gray-500'
              }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 2 && <div className={`h-0.5 w-16 transition-all ${step > s ? 'bg-neonBlue' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 1: Role Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {DOMAINS.map((cat) => (
              <div key={cat.category} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {cat.category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.label}
                        onClick={() => handleRoleSelect(role)}
                        className="role-card text-left p-4 rounded-xl border border-darkBorder bg-white/3 hover:border-neonBlue/40 hover:bg-neonBlue/5 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-neonBlue/10 border border-neonBlue/20 text-neonBlue group-hover:bg-neonBlue/20 transition">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-white">{role.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{role.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom Role */}
            <div className="pt-2">
              <button
                onClick={handleCustomRole}
                className="w-full p-4 rounded-xl border border-dashed border-white/20 hover:border-neonPurple/40 hover:bg-neonPurple/5 transition text-center text-sm text-gray-400 hover:text-white"
              >
                + Enter Custom Role
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Config */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-darkBorder space-y-6">

              {/* Selected Role Display */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neonBlue/5 border border-neonBlue/20">
                <div className="flex items-center gap-3">
                  {selectedRole && React.createElement(selectedRole.icon, { className: "w-5 h-5 text-neonBlue" })}
                  <div>
                    <p className="text-sm font-bold text-white">
                      {isCustom ? (customRole || 'Custom Role') : selectedRole?.label}
                    </p>
                    <p className="text-xs text-gray-400">{selectedRole?.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-neonBlue hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Custom role input */}
              {isCustom && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Custom Job Title
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
                    placeholder="e.g. Kubernetes Administrator / iOS Architect"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Experience Level */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Experience Level
                  </label>
                  <select value={level} onChange={e => setLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input">
                    <option value="Junior" className="bg-darkCard">Junior (0-2 yrs)</option>
                    <option value="Mid" className="bg-darkCard">Mid-Level (2-5 yrs)</option>
                    <option value="Senior" className="bg-darkCard">Senior (5+ yrs)</option>
                  </select>
                </div>

                {/* Interview Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Interview Type
                  </label>
                  <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input">
                    <option value="Technical" className="bg-darkCard">Technical</option>
                    <option value="Behavioral" className="bg-darkCard">Behavioral</option>
                    <option value="HR" className="bg-darkCard">HR Round</option>
                    <option value="Mixed" className="bg-darkCard">Mixed (Tech + HR)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Difficulty
                  </label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input">
                    <option value="Easy" className="bg-darkCard">Easy</option>
                    <option value="Medium" className="bg-darkCard">Medium</option>
                    <option value="Hard" className="bg-darkCard">Hard</option>
                  </select>
                </div>

                {/* Target Company */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    Target Company
                  </label>
                  <select value={company} onChange={e => setCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input">
                    {COMPANIES.map(c => (
                      <option key={c.label} value={c.label} className="bg-darkCard">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {company !== 'Any Company' && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      {COMPANIES.find(c => c.label === company)?.desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Number of Questions
                  </label>
                  <span className="text-sm font-bold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-3 py-0.5 rounded-full">
                    {numQuestions}
                  </span>
                </div>
                <input
                  type="range" min="3" max="15"
                  value={numQuestions}
                  onChange={e => setNumQuestions(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neonBlue"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>3 (Quick)</span>
                  <span>8 (Standard)</span>
                  <span>15 (Full)</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-neon-gradient text-white font-bold text-sm shadow-neon-blue hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Generating Questions with AI...</span></>
                ) : (
                  <><Sparkles className="w-5 h-5" /><span>Start Practice Session</span></>
                )}
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
