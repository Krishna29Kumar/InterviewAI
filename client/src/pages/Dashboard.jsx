import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { startInterview } from '../redux/slices/interviewSlice';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import {
  Play, TrendingUp, Award, Clock, ArrowRight,
  UserCheck, Inbox, Zap, Target, BarChart3,
  ChevronRight, Sparkles, Brain, Shield,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay } },
});

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay, isLight }) {
  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.02)';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)';
  const cardShadow = isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none';
  const labelColor = isLight ? '#64748b' : '#4b5563';
  const valueColor = isLight ? '#0f172a' : 'white';
  const resetBorder = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)';

  return (
    <motion.div variants={fadeUp(delay)} style={{
      background: cardBg,
      border: cardBorder,
      borderRadius: 16, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'border-color 0.3s',
      boxShadow: cardShadow,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}33`}
      onMouseLeave={e => e.currentTarget.style.borderColor = resetBorder}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: 22, height: 22, color }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: valueColor, lineHeight: 1 }}>{value}</div>
      </div>
    </motion.div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999,
      background: `${color}15`, border: `1px solid ${color}30`,
      color, fontSize: 12, fontWeight: 800,
    }}>
      {score}%
    </span>
  );
}

// ─── Quick Action Card ────────────────────────────────────────
function QuickAction({ icon: Icon, title, desc, to, color, delay, isLight }) {
  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.02)';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)';
  const hoverBg = isLight ? `${color}08` : `${color}08`;
  const resetBorder = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)';
  const titleColor = isLight ? '#1e293b' : 'white';
  const descColor = isLight ? '#94a3b8' : '#4b5563';
  const chevronColor = isLight ? '#cbd5e1' : '#374151';

  return (
    <motion.div variants={fadeUp(delay)}>
      <Link to={to} style={{ textDecoration: 'none' }}>
        <div style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 12, padding: '16px',
          display: 'flex', alignItems: 'center', gap: 12,
          transition: 'all 0.2s', cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.background = hoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = resetBorder; e.currentTarget.style.background = cardBg; }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon style={{ width: 16, height: 16, color }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: titleColor }}>{title}</div>
            <div style={{ fontSize: 11, color: descColor }}>{desc}</div>
          </div>
          <ChevronRight style={{ width: 14, height: 14, color: chevronColor }} />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label, isLight }) {
  if (!active || !payload?.length) return null;
  const tooltipBg = isLight ? '#ffffff' : '#0d0d1a';
  const tooltipBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)';
  const tooltipShadow = isLight ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.3)';
  const labelColor = isLight ? '#64748b' : '#6b7280';
  const valueColor = isLight ? '#4f46e5' : '#00f0ff';

  return (
    <div style={{ background: tooltipBg, border: tooltipBorder, borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: tooltipShadow }}>
      <div style={{ color: labelColor, marginBottom: 4 }}>{label}</div>
      <div style={{ color: valueColor, fontWeight: 800 }}>{payload[0].value}%</div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useSelector(s => s.auth);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    api.get('/interview/history')
      .then(r => setHistory(r.data))
      .catch(() => toast.error('Failed to load interview history'))
      .finally(() => setLoading(false));
  }, []);

  const completed = history.filter(i => i.status === 'completed');
  const avgScore = completed.length ? Math.round(completed.reduce((s, i) => s + i.score, 0) / completed.length) : 0;
  const roles = history.map(i => i.role);
  const topRole = roles.length ? roles.sort((a, b) => roles.filter(v => v === a).length - roles.filter(v => v === b).length).pop() : 'None';
  const chartData = [...completed].reverse().slice(-7).map((item, i) => ({ name: `S${i + 1}`, score: item.score, role: item.role }));

  const getScoreColor = s => s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';

  const S = { fontFamily: 'Inter, system-ui, sans-serif' };

  // Theme-aware colors
  const accent = isLight ? '#4f46e5' : '#00f0ff';
  const accentGrad = isLight ? '#4f46e5' : 'linear-gradient(135deg,#00f0ff,#ab22ff)';
  const headingColor = isLight ? '#0f172a' : 'white';
  const bodyColor = isLight ? '#64748b' : '#4b5563';
  const mutedColor = isLight ? '#94a3b8' : '#374151';
  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.02)';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)';
  const cardShadow = isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none';
  const ctaBg = isLight ? '#4f46e5' : 'linear-gradient(135deg,#00f0ff,#ab22ff)';
  const ctaColor = isLight ? '#ffffff' : 'black';
  const ctaShadow = isLight ? '0 4px 14px rgba(79,70,229,0.25)' : '0 0 24px rgba(0,240,255,0.25)';
  const gridStroke = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.04)';
  const axisStroke = isLight ? '#94a3b8' : '#374151';
  const chartAccent = isLight ? '#4f46e5' : '#00f0ff';

  // Table
  const thColor = isLight ? '#64748b' : '#374151';
  const rowBorder = isLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.03)';
  const rowHoverBg = isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)';
  const tdTitleColor = isLight ? '#1e293b' : 'white';
  const tdSubColor = isLight ? '#94a3b8' : '#4b5563';
  const levelBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)';
  const levelBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)';
  const levelColor = isLight ? '#64748b' : '#6b7280';

  // Start link
  const startBg = isLight ? 'rgba(79,70,229,0.08)' : 'rgba(0,240,255,0.1)';
  const startBorder = isLight ? '1px solid rgba(79,70,229,0.2)' : '1px solid rgba(0,240,255,0.2)';
  const startColor = isLight ? '#4f46e5' : '#00f0ff';

  return (
    <div style={{ ...S, maxWidth: 1100, margin: '0 auto', padding: '0 4px' }}>

      {/* ── Header ── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: bodyColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6, fontWeight: 600 }}>
            Welcome back
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: headingColor, letterSpacing: '-1px', marginBottom: 4 }}>
            {user?.name} 👋
          </h1>
          <p style={{ color: bodyColor, fontSize: 13 }}>Here's your interview preparation summary.</p>
        </div>
        <Link to="/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: ctaBg, color: ctaColor, fontWeight: 800, fontSize: 13, textDecoration: 'none', boxShadow: ctaShadow, transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <Sparkles style={{ width: 15, height: 15 }} />
          Start New Interview
        </Link>
      </motion.div>

      {/* ── Stats Grid ── */}
      <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon={Clock} label="Total Sessions" value={history.length} color={chartAccent} delay={0} isLight={isLight} />
        <StatCard icon={Award} label="Average Score" value={`${avgScore}%`} color="#ab22ff" delay={0.05} isLight={isLight} />
        <StatCard icon={UserCheck} label="Sessions Graded" value={completed.length} color="#22c55e" delay={0.1} isLight={isLight} />
        <StatCard icon={TrendingUp} label="Top Domain" value={topRole.split(' ')[0]} color="#f59e0b" delay={0.15} isLight={isLight} />
      </motion.div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Chart */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.2)} style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24, boxShadow: cardShadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: headingColor, marginBottom: 2 }}>Performance Trend</div>
              <div style={{ fontSize: 11, color: bodyColor }}>Last 7 completed sessions</div>
            </div>
            <Link to="/analytics" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: accent, textDecoration: 'none', fontWeight: 600 }}>
              View Details <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          {chartData.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={isLight ? '#4f46e5' : '#00f0ff'} />
                      <stop offset="100%" stopColor={isLight ? '#7c3aed' : '#ab22ff'} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={axisStroke} fontSize={10} />
                  <YAxis stroke={axisStroke} fontSize={10} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip isLight={isLight} />} />
                  <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={3} dot={{ r: 4, fill: chartAccent, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mutedColor, fontSize: 13 }}>
              No data yet — complete an interview to see your trend
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.25)} style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: cardShadow }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: headingColor, marginBottom: 8 }}>Quick Actions</div>
          <QuickAction icon={Zap} title="New Interview" desc="Start a fresh session" to="/setup" color={chartAccent} delay={0.3} isLight={isLight} />
          <QuickAction icon={BarChart3} title="Analytics" desc="View detailed performance" to="/analytics" color="#ab22ff" delay={0.35} isLight={isLight} />
          <QuickAction icon={Brain} title="Practice Again" desc="Resume where you left off" to="/setup" color="#f59e0b" delay={0.4} isLight={isLight} />
          <QuickAction icon={Shield} title="Profile Settings" desc="Update your information" to="/profile" color="#22c55e" delay={0.45} isLight={isLight} />
        </motion.div>
      </div>

      {/* ── History Table ── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp(0.3)} style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24, boxShadow: cardShadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: headingColor }}>Recent Sessions</div>
          {history.length > 5 && (
            <span style={{ fontSize: 11, color: bodyColor }}>Showing last 5</span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: bodyColor, fontSize: 13 }}>
            <div style={{ width: 20, height: 20, border: `2px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading sessions...
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <Inbox style={{ width: 40, height: 40, color: mutedColor, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: headingColor, marginBottom: 6 }}>No interviews yet</div>
            <div style={{ fontSize: 13, color: bodyColor, marginBottom: 20 }}>Start your first mock session to track performance</div>
            <Link to="/setup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: startBg, border: startBorder, color: startColor, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <Play style={{ width: 12, height: 12 }} /> Start Now
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: isLight ? '2px solid #f1f5f9' : '1px solid rgba(255,255,255,0.05)' }}>
                  {['Role / Type', 'Level', 'Status', 'Score', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: thColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((interview) => (
                  <tr key={interview._id} style={{ borderBottom: rowBorder, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = rowHoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: 700, color: tdTitleColor, fontSize: 13 }}>{interview.role}</div>
                      <div style={{ color: tdSubColor, fontSize: 11, marginTop: 2 }}>{interview.type} Interview</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, background: levelBg, border: levelBorder, color: levelColor, fontSize: 11, fontWeight: 600 }}>
                        {interview.level}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {interview.status === 'completed' ? (
                        <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: 11, fontWeight: 700 }}>Completed</span>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: 999, background: `${accent}15`, border: `1px solid ${accent}40`, color: accent, fontSize: 11, fontWeight: 700 }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {interview.status === 'completed' ? <ScoreBadge score={interview.score} /> : <span style={{ color: mutedColor, fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {interview.status !== 'completed' ? (
                        <button
                          onClick={() => { localStorage.setItem('currentInterview', JSON.stringify(interview)); window.location.href = '/interview'; }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: startBg, border: startBorder, color: startColor, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Play style={{ width: 10, height: 10 }} /> Resume
                        </button>
                      ) : (
                        <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>✓ Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;