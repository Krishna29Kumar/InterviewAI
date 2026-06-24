import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { startInterview } from '../redux/slices/interviewSlice';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, Play, FileText, TrendingUp, Award, Clock, ArrowRight, UserCheck, Inbox } from 'lucide-react';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/interview/history');
        setHistory(response.data);
      } catch (err) {
        toast.error('Failed to load interview history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Compute stats
  const totalInterviews = history.length;
  const completedInterviews = history.filter((i) => i.status === 'completed');
  const avgScore = completedInterviews.length
    ? Math.round(completedInterviews.reduce((sum, i) => sum + i.score, 0) / completedInterviews.length)
    : 0;

  // Get most common role
  const roles = history.map((i) => i.role);
  const topRole = roles.length
    ? roles.sort((a, b) => roles.filter((v) => v === a).length - roles.filter((v) => v === b).length).pop()
    : 'None';

  // Format Recharts data (last 7 completed interviews chronologically)
  const chartData = [...completedInterviews]
    .reverse()
    .slice(-7)
    .map((item, index) => ({
      name: `Session ${index + 1}`,
      score: item.score,
      role: item.role,
    }));

  const handleResumeInterview = (interview) => {
    // Save to localStorage
    localStorage.setItem('currentInterview', JSON.stringify(interview));
    localStorage.setItem('interviewAnswers', JSON.stringify(interview.answers || []));
    localStorage.setItem('interviewIndex', (interview.answers?.length || 0).toString());
    
    // Hard refresh/routing to ensure slice re-hydration
    window.location.href = '/interview';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="space-y-8 relative z-10">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Welcome, {user?.name}!</h1>
          <p className="text-gray-400 text-sm">Here is a summary of your interview preparation activity.</p>
        </div>
        <Link
          to="/setup"
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-neon-gradient text-white font-semibold text-sm shadow-neon-blue bg-neon-gradient-hover hover:scale-105 active:scale-95 transition duration-300"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Start New Interview</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1 */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-neonBlue/10 border border-neonBlue/20 text-neonBlue">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Mock Sessions</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalInterviews}</h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-neonPurple/10 border border-neonPurple/20 text-neonPurple">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Average Score</p>
            <h3 className="text-2xl font-bold text-white mt-1">{avgScore}%</h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sessions Graded</p>
            <h3 className="text-2xl font-bold text-white mt-1">{completedInterviews.length}</h3>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-accentPink/10 border border-accentPink/20 text-accentPink">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Top Role Practice</p>
            <h3 className="text-lg font-bold text-white mt-1 truncate max-w-[150px]">{topRole}</h3>
          </div>
        </div>
      </div>

      {/* Analytics Graph & Summary */}
      {completedInterviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-darkBorder">
            <h3 className="text-lg font-bold text-white mb-4">Performance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ab22ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#131326',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="url(#colorScore)"
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#00f0ff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="glass-panel p-6 rounded-2xl border border-darkBorder flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Interview Guide</h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                To maximize your rating feedback, speak clearly and try to supply structured code blocks or architectural explanations if appropriate. Use the TTS speaker during session practice to listen to natural pronunciation.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
              <Link to="/setup" className="flex items-center justify-between text-xs text-neonBlue hover:underline">
                <span>Configure custom job roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/analytics" className="flex items-center justify-between text-xs text-neonPurple hover:underline">
                <span>View granular chart reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* History Log Table */}
      <div className="glass-panel p-6 rounded-2xl border border-darkBorder">
        <h3 className="text-lg font-bold text-white mb-6">Recent Sessions</h3>

        {loading ? (
          <div className="py-12 flex items-center justify-center space-x-2 text-gray-400 text-sm">
            <div className="w-6 h-6 border-2 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
            <span>Syncing history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center space-y-4 flex flex-col items-center">
            <Inbox className="w-12 h-12 text-gray-500 opacity-40" />
            <h4 className="text-gray-300 font-semibold">No interviews practiced yet</h4>
            <p className="text-gray-500 text-xs max-w-sm">
              Launch your first interactive mock session to generate AI questions and track performance indicators.
            </p>
            <Link
              to="/setup"
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-neonBlue/10 border border-neonBlue/20 text-neonBlue text-xs font-semibold hover:bg-neonBlue/20 transition duration-200"
            >
              <span>Setup Mock Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider pb-3">
                  <th className="pb-3 pr-4">Role / Type</th>
                  <th className="pb-3 px-4 hidden sm:table-cell">Details</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-center">Score</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((interview) => (
                  <tr key={interview._id} className="hover:bg-white/5 transition duration-150">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-white">{interview.role}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{interview.type} Interview</p>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className="text-xs text-gray-400 mr-2 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {interview.level}
                      </span>
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {interview.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {interview.status === 'completed' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {interview.status === 'completed' ? (
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${getScoreColor(interview.score)}`}>
                          {interview.score}%
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs font-light">N/A</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {interview.status === 'completed' ? (
                        <Link
                          to={`/feedback/${interview._id}`}
                          className="inline-flex items-center space-x-1 text-xs text-neonBlue hover:underline font-bold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Review</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleResumeInterview(interview)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-neonBlue/15 border border-neonBlue/30 text-neonBlue text-xs hover:bg-neonBlue/20 font-bold transition duration-200"
                        >
                          <Play className="w-3 h-3 fill-neonBlue" />
                          <span>Resume</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
