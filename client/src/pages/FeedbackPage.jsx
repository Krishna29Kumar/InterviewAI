import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Award,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const FeedbackPage = () => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(0);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await api.get(`/feedback/${id}`);
        setFeedback(response.data);
      } catch (error) {
        toast.error('Failed to load feedback details');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-2 text-gray-400 text-sm">
        <div className="w-8 h-8 border-3 border-neonPurple border-t-transparent rounded-full animate-spin"></div>
        <span>Compiling grading metrics...</span>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="text-center py-20 space-y-4">
        <HelpCircle className="w-12 h-12 text-gray-500 mx-auto opacity-40" />
        <h2 className="text-xl font-bold text-white">Feedback Not Found</h2>
        <p className="text-gray-400 text-sm">Could not find feedback records referencing this interview ID.</p>
        <Link to="/dashboard" className="inline-block text-neonBlue text-sm font-semibold hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Scores metadata list
  const metrics = [
    { label: 'Technical Score', score: feedback.technicalScore, color: '#00f0ff' },
    { label: 'Communication', score: feedback.communicationScore, color: '#ab22ff' },
    { label: 'Grammar Accuracy', score: feedback.grammarScore, color: '#ff2a85' },
    { label: 'Confidence level', score: feedback.confidenceScore, color: '#fbbf24' },
    { label: 'Problem Solving', score: feedback.problemSolvingScore, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 relative z-10 max-w-5xl mx-auto">
      {/* Return header */}
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition duration-200"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Hero Score card */}
      <div className="glass-panel p-8 rounded-3xl border border-darkBorder flex flex-col md:flex-row items-center justify-between gap-8 shadow-glass relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-neonPurple/20 blur-2xl"></div>

        <div className="space-y-3 flex-grow text-center md:text-left">
          <span className="text-xs text-neonBlue font-semibold uppercase tracking-widest">Grading Certificate</span>
          <h1 className="text-3xl font-extrabold text-white">Interview Assessment</h1>
          <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
            Congratulations on completing your session practice. Below is your detailed performance grading based on structural and contextual analysis.
          </p>
        </div>

        {/* Avg Score circle gauge */}
        <div className="flex-shrink-0 w-36 h-36 rounded-full bg-darkCard border-4 border-neonBlue/40 shadow-neon-blue flex flex-col items-center justify-center relative">
          <span className="text-4xl font-extrabold text-white">{feedback.averageScore}%</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Average Score</span>
        </div>
      </div>

      {/* Grid: Metric progress & Strengths/Weaknesses summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Bars */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder lg:col-span-1 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Performance breakdown</h3>
          {metrics.map((m) => (
            <div key={m.label} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-400">{m.label}</span>
                <span style={{ color: m.color }} className="font-bold">{m.score}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${m.score}%`, backgroundColor: m.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed text boxes */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Overall AI Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 bg-white/3 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 uppercase">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Primary Strengths</span>
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">{feedback.strengths}</p>
            </div>

            <div className="space-y-2 bg-white/3 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-rose-400 flex items-center space-x-1.5 uppercase">
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Areas to Improve</span>
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">{feedback.weaknesses}</p>
            </div>
          </div>

          <div className="space-y-2 bg-neonBlue/5 p-4 rounded-xl border border-neonBlue/10">
            <h4 className="text-xs font-bold text-neonBlue flex items-center space-x-1.5 uppercase">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Actionable Suggestions</span>
            </h4>
            <p className="text-gray-300 text-xs leading-relaxed">{feedback.suggestions}</p>
          </div>
        </div>
      </div>

      {/* Per Question Accordion */}
      <div className="glass-panel p-6 rounded-2xl border border-darkBorder">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Question-by-Question breakdown</h3>

        <div className="space-y-4">
          {feedback.feedbackDetails.map((item, idx) => {
            const isExpanded = expandedQuestion === idx;

            return (
              <div
                key={idx}
                className={`rounded-xl border transition-all duration-300 ${
                  isExpanded ? 'bg-white/5 border-neonBlue/30' : 'bg-darkCard/25 border-darkBorder'
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? -1 : idx)}
                  className="w-full px-5 py-4 flex justify-between items-center text-left"
                >
                  <div className="pr-4 space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Question {idx + 1}</span>
                    <p className="text-sm font-bold text-white truncate max-w-xl md:max-w-2xl">{item.questionText}</p>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-xs font-extrabold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-2 py-0.5 rounded">
                      {item.score}%
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Body Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4 text-xs">
                    {/* Candidate Answer */}
                    <div className="space-y-1.5 bg-darkBg/50 p-3.5 rounded-lg border border-white/5">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Your Response:</span>
                      <p className="text-gray-300 leading-relaxed font-light">{item.answerText}</p>
                    </div>

                    {/* Question evaluation metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Strengths */}
                      <div className="space-y-1 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                        <span className="font-bold text-emerald-400 text-[10px] uppercase">Strength</span>
                        <p className="text-gray-300 leading-relaxed font-light">{item.strengths}</p>
                      </div>

                      {/* Weaknesses */}
                      <div className="space-y-1 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                        <span className="font-bold text-rose-400 text-[10px] uppercase">Improvement</span>
                        <p className="text-gray-300 leading-relaxed font-light">{item.weaknesses}</p>
                      </div>

                      {/* Suggestions */}
                      <div className="space-y-1 bg-neonPurple/5 p-3 rounded-lg border border-neonPurple/10">
                        <span className="font-bold text-neonPurple text-[10px] uppercase">How to polish</span>
                        <p className="text-gray-300 leading-relaxed font-light">{item.suggestions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
