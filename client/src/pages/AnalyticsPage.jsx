import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, HelpCircle, Award, CheckCircle, Target, Zap, ArrowRight } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay } },
});

const METRICS = [
  { key: 'Technical', label: 'Technical', color: '#00f0ff' },
  { key: 'Communication', label: 'Communication', color: '#ab22ff' },
  { key: 'Grammar', label: 'Grammar', color: '#ff2a85' },
  { key: 'Confidence', label: 'Confidence', color: '#f59e0b' },
];

const PIE_COLORS = ['#00f0ff', '#ab22ff', '#ff2a85', '#f59e0b'];

function MetricBar({ label, value, color, isBest }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{label}</span>
          {isBest && (
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', fontWeight: 700 }}>BEST</span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{value ?? '—'}{value != null ? '%' : ''}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${value ?? 0}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s ease', opacity: 0.9 }} />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#00f0ff', fontWeight: 800 }}>{payload[0].value}%</div>
    </div>
  );
}

const AnalyticsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/interview/history');
        const completed = data.filter(i => i.status === 'completed');
        setInterviews(completed);

        const feedbacks = await Promise.all(
          completed.map(i => api.get(`/interview/feedback/${i._id}`).catch(() => null))
        );
        const valid = feedbacks
          .filter(r => r?.data)
          .map((r, i) => ({
            ...r.data,
            role: completed[i].role,
            date: new Date(completed[i].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          }));
        setFeedbackHistory(valid);
        setActiveIdx(Math.max(valid.length - 1, 0));
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const S = { fontFamily: 'Inter, system-ui, sans-serif' };
  const cardStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 };

  if (loading) return (
    <div style={{ ...S, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: '#4b5563', fontSize: 13 }}>
      <div style={{ width: 32, height: 32, border: '2px solid #00f0ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Compiling performance analytics...
    </div>
  );

  if (interviews.length === 0) return (
    <div style={{ ...S, textAlign: 'center', padding: '80px 20px', maxWidth: 420, margin: '0 auto' }}>
      <HelpCircle style={{ width: 48, height: 48, color: '#374151', margin: '0 auto 16px', opacity: 0.5 }} />
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>No Analytics Yet</h2>
      <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
        Complete at least one interview session to see your performance analytics.
      </p>
      <Link to="/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#00f0ff,#ab22ff)', color: 'black', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
        <Zap style={{ width: 14, height: 14 }} /> Start Practicing
      </Link>
    </div>
  );

  const lineData = [...feedbackHistory].reverse().map(f => ({ date: f.date, score: f.averageScore }));
  const barData = [...feedbackHistory].reverse().slice(-5).map((f, i) => ({
    name: `S${i + 1}`,
    Technical: f.technicalScore,
    Communication: f.communicationScore,
    Grammar: f.grammarScore,
    Confidence: f.confidenceScore,
  }));
  const typeCounts = interviews.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {});
  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  const session = barData[activeIdx] || {};
  const scores = METRICS.map(m => session[m.key] ?? null);
  const maxIdx = scores.reduce((best, s, i) => (s != null && (best === -1 || s > scores[best]) ? i : best), -1);
  const latest = feedbackHistory[0];
  const first = feedbackHistory[feedbackHistory.length - 1];
  const improvement = latest ? latest.averageScore - (first?.averageScore || 0) : 0;

  return (
    <div style={{ ...S, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp(0)} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 style={{ width: 20, height: 20, color: '#00f0ff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Performance Analytics</h1>
            <p style={{ color: '#4b5563', fontSize: 12, marginTop: 2 }}>Visualize your interview preparation history and skill development</p>
          </div>
        </div>
      </motion.div>

      {/* Top metric cards */}
      <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Sessions Done', value: interviews.length, color: '#00f0ff', icon: Target },
          { label: 'Latest Score', value: `${latest?.averageScore ?? 0}%`, color: '#ab22ff', icon: Award },
          { label: 'Improvement', value: `${improvement >= 0 ? '+' : ''}${improvement}%`, color: improvement >= 0 ? '#22c55e' : '#ef4444', icon: TrendingUp },
          { label: 'Best Metric', value: METRICS[maxIdx]?.label ?? '—', color: '#f59e0b', icon: Zap },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label} variants={fadeUp(i * 0.05)} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'white', lineHeight: 1 }}>{value}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>

        {/* Line Chart */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.2)} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Score Progression</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>Overall score over time</div>
            </div>
            <TrendingUp style={{ width: 16, height: 16, color: '#00f0ff' }} />
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#ab22ff" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#374151" fontSize={10} />
                <YAxis stroke="#374151" fontSize={10} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="url(#grad)" strokeWidth={3} dot={{ r: 4, fill: '#00f0ff', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.25)} style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 20 }}>Session Breakdown</div>
          <div style={{ flex: 1, minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {pieData.map((e, i) => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span style={{ color: '#6b7280' }}>{e.name} ({e.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Metric Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Granular Bars */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.3)} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Skill Breakdown</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {barData.map((_, i) => (
                <button key={i} onClick={() => setActiveIdx(i)} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: activeIdx === i ? 'rgba(171,34,255,0.2)' : 'rgba(255,255,255,0.05)', border: activeIdx === i ? '1px solid rgba(171,34,255,0.4)' : '1px solid rgba(255,255,255,0.08)', color: activeIdx === i ? '#ab22ff' : '#6b7280' }}>
                  S{i + 1}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {METRICS.map((m, i) => (
              <div key={m.key} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: `${m.color}10`, border: `1px solid ${m.color}20` }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{scores[i] ?? '—'}</div>
                <div style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>
          {METRICS.map((m, i) => <MetricBar key={m.key} {...m} value={scores[i]} isBest={i === maxIdx && scores[i] != null} />)}
        </motion.div>

        {/* Insights */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.35)} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Award style={{ width: 16, height: 16, color: '#22c55e' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>AI Insights</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                color: '#22c55e',
                title: 'Score Trend',
                text: improvement >= 0
                  ? `Your score improved by ${improvement}% since your first session. Great progress!`
                  : `Score drifted by ${Math.abs(improvement)}%. Review tips to reverse the trend.`,
              },
              latest && {
                color: '#00f0ff',
                title: 'Strongest Skill',
                text: `Your highest metric is ${latest.technicalScore >= latest.communicationScore ? 'Technical Accuracy' : 'Communication'} at ${Math.max(latest.technicalScore || 0, latest.communicationScore || 0)}%. Keep it up!`,
              },
              latest && {
                color: '#ab22ff',
                title: 'Focus Area',
                text: `Your weakest metric is ${(latest.grammarScore || 0) <= (latest.confidenceScore || 0) ? 'Grammar' : 'Confidence'} at ${Math.min(latest.grammarScore || 0, latest.confidenceScore || 0)}%. Practice more to improve.`,
              },
            ].filter(Boolean).map(({ color, title, text }, i) => (
              <div key={i} style={{ padding: '14px', borderRadius: 10, background: `${color}08`, border: `1px solid ${color}18`, display: 'flex', gap: 10 }}>
                <CheckCircle style={{ width: 16, height: 16, color, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{text}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Link to="/setup" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,240,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,240,255,0.06)'}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#00f0ff' }}>Practice Again</span>
                <ArrowRight style={{ width: 14, height: 14, color: '#00f0ff' }} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;