import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { BarChart3, TrendingUp, HelpCircle, Activity, Award, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AnalyticsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const intRes = await api.get('/interview/history');
        const completed = intRes.data.filter((i) => i.status === 'completed');
        setInterviews(completed);

        // Fetch detailed feedback documents for all completed sessions to populate categories
        const feedbackPromises = completed.map((i) => api.get(`/feedback/${i._id}`).catch(() => null));
        const resolvedFeedbacks = await Promise.all(feedbackPromises);
        
        const validFeedbacks = resolvedFeedbacks
          .filter((res) => res && res.data)
          .map((res, index) => ({
            ...res.data,
            role: completed[index].role,
            date: new Date(completed[index].createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            }),
          }));

        setFeedbackHistory(validFeedbacks);
      } catch (error) {
        toast.error('Failed to load performance analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-2 text-gray-400 text-sm">
        <div className="w-8 h-8 border-3 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
        <span>Compiling performance analytics...</span>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4 relative z-10">
        <HelpCircle className="w-12 h-12 text-gray-500 mx-auto opacity-40" />
        <h2 className="text-xl font-bold text-white">No Analytics Available</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Practicing mock interviews is required to generate performance trend metrics. Get started with your first configuration!
        </p>
        <Link
          to="/setup"
          className="mt-2 inline-flex px-5 py-3 rounded-xl bg-neon-gradient text-white text-xs font-semibold shadow-neon-blue transition duration-200"
        >
          Setup Mock Session
        </Link>
      </div>
    );
  }

  // 1. Line Chart Data (Scores chronologically)
  const lineData = [...feedbackHistory].reverse().map((f) => ({
    date: f.date,
    score: f.averageScore,
    role: f.role,
  }));

  // 2. Bar Chart Data (Comparison of subscores across the last 4 interviews)
  const barData = [...feedbackHistory].reverse().slice(-4).map((f, idx) => ({
    name: `Session ${idx + 1}`,
    Technical: f.technicalScore,
    Communication: f.communicationScore,
    Grammar: f.grammarScore,
    Confidence: f.confidenceScore,
  }));

  // 3. Pie Chart Data (Distribution of Interview Types)
  const typeCounts = interviews.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(typeCounts).map((key) => ({
    name: key,
    value: typeCounts[key],
  }));

  const COLORS = ['#00f0ff', '#ab22ff', '#ff2a85', '#fbbf24'];

  // 4. Calculate Insights
  const latestFeedback = feedbackHistory[0];
  const firstFeedback = feedbackHistory[feedbackHistory.length - 1];
  const improvement = latestFeedback ? latestFeedback.averageScore - (firstFeedback?.averageScore || 0) : 0;

  return (
    <div className="space-y-8 relative z-10 max-w-6xl mx-auto">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-neonBlue/10 border border-neonBlue/20 flex items-center justify-center text-neonBlue">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Performance Analytics</h1>
          <p className="text-gray-400 text-xs mt-0.5">Visualize your interview preparation history and skill development</p>
        </div>
      </div>

      {/* Grid: Trend Line & Skill Comparison Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-neonBlue" />
              <span>Overall Score Progression</span>
            </h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Historical Trend</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
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
                  stroke="#00f0ff"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#00f0ff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-neonPurple" />
              <span>Granular Metric Comparison</span>
            </h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Last 4 sessions</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: '#131326',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Technical" fill="#00f0ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Communication" fill="#ab22ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Grammar" fill="#ff2a85" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Confidence" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Pie Distribution & Insights panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Session Type Breakdown</h3>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Custom Legends list */}
          <div className="flex justify-center space-x-4 flex-wrap pt-4 border-t border-white/5 text-[10px] font-semibold">
            {pieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <div style={{ backgroundColor: COLORS[idx % COLORS.length] }} className="w-2.5 h-2.5 rounded-full"></div>
                <span className="text-gray-400">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight report */}
        <div className="glass-panel p-6 rounded-2xl border border-darkBorder lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Preparation Insights</span>
          </h3>

          <div className="space-y-4">
            {/* Insight item 1 */}
            <div className="flex items-start space-x-3 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-white">Score Improvement</h4>
                <p className="text-gray-400 leading-relaxed font-light">
                  {improvement >= 0
                    ? `Your average score has increased by ${improvement}% since your very first mock session. Great progress!`
                    : `Your score has drifted slightly by ${Math.abs(improvement)}% compared to your starting baseline. Review critical tips to reverse the trend.`}
                </p>
              </div>
            </div>

            {/* Insight item 2 */}
            {latestFeedback && (
              <div className="flex items-start space-x-3 bg-neonBlue/5 p-4 rounded-xl border border-neonBlue/10">
                <CheckCircle className="w-5 h-5 text-neonBlue flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-white">Latest Focus Area</h4>
                  <p className="text-gray-400 leading-relaxed font-light">
                    Your highest scoring metric is{' '}
                    <span className="font-bold text-white">
                      {latestFeedback.technicalScore >= latestFeedback.communicationScore ? 'Technical Accuracy' : 'Communication Pace'}
                    </span>{' '}
                    at {Math.max(latestFeedback.technicalScore, latestFeedback.communicationScore)}%. Excellent vocabulary and framework definitions!
                  </p>
                </div>
              </div>
            )}

            {/* Insight item 3 */}
            {latestFeedback && (
              <div className="flex items-start space-x-3 bg-neonPurple/5 p-4 rounded-xl border border-neonPurple/10">
                <CheckCircle className="w-5 h-5 text-neonPurple flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-white">Primary Bottleneck</h4>
                  <p className="text-gray-400 leading-relaxed font-light">
                    Your lowest scoring metric is{' '}
                    <span className="font-bold text-white">
                      {latestFeedback.grammarScore <= latestFeedback.confidenceScore ? 'Grammar Accuracy' : 'Confidence Level'}
                    </span>{' '}
                    at {Math.min(latestFeedback.grammarScore, latestFeedback.confidenceScore)}%. We suggest reviewing active speech patterns and organizing responses clearly.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
