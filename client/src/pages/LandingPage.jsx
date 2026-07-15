import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import {
  Mic, BarChart3, Bot, Zap, ArrowRight,
  BrainCircuit, Shield, Sparkles, TrendingUp,
  Camera, Eye, CheckCircle, Star,
  Code, Globe, Server, Brain, Lock,
  Trophy, Target, Layers, MessageSquare,
  Gamepad2, Smartphone, Blocks, Terminal,
  ChevronRight,
} from "lucide-react";

// ─── Animation Variants ───────────────────────────────────────
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay } },
});

const stagger = (s = 0.1) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: s } },
});

// ─── Floating Orbs (dark mode only) ──────────────────────────
function FloatingOrbs({ isLight }) {
  if (isLight) return null; // Hide orbs in light mode
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {[
        { top: '-10%', left: '20%', w: 600, color: 'rgba(0,240,255,0.06)', anim: 'float1 8s ease-in-out infinite' },
        { top: '30%', right: '10%', w: 400, color: 'rgba(171,34,255,0.06)', anim: 'float2 10s ease-in-out infinite' },
        { bottom: '10%', left: '30%', w: 500, color: 'rgba(0,240,255,0.04)', anim: 'float1 12s ease-in-out infinite reverse' },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'absolute', ...o,
          width: o.w, height: o.w,
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(40px)', animation: o.anim,
        }} />
      ))}
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-30px) translateX(20px)} 66%{transform:translateY(20px) translateX(-15px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(25px) translateX(-20px)} 66%{transform:translateY(-20px) translateX(15px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scrollDown { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(12px);opacity:0} }
      `}</style>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / 2000, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCount(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Typing Animation ─────────────────────────────────────────
function TypingText({ words, isLight }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[index];
    let t;
    if (!deleting && displayed.length < word.length) t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
    else if (!deleting && displayed.length === word.length) t = setTimeout(() => setDeleting(true), 2000);
    else if (deleting && displayed.length > 0) t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
    else { setDeleting(false); setIndex(i => (i + 1) % words.length); }
    return () => clearTimeout(t);
  }, [displayed, deleting, index, words]);

  const gradientBg = isLight
    ? 'linear-gradient(135deg,#4f46e5,#7c3aed)'
    : 'linear-gradient(135deg,#00f0ff,#ab22ff)';
  const cursorColor = isLight ? '#4f46e5' : '#00f0ff';

  return (
    <span style={{ background: gradientBg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      {displayed}<span style={{ animation: 'blink 1s step-end infinite', WebkitTextFillColor: cursorColor }}>|</span>
    </span>
  );
}

// ─── Feature Card (with navigation) ──────────────────────────
function FeatureCard({ icon: Icon, title, desc, gradient, to, delay, isLight }) {
  const navigate = useNavigate();
  const clickable = !!to;

  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.02)';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)';
  const cardShadow = isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none';
  const hoverBorderColor = isLight ? '#4f46e5' : 'rgba(0,240,255,0.25)';
  const hoverShadow = isLight ? '0 10px 25px rgba(79,70,229,0.08)' : '0 0 30px rgba(0,240,255,0.08)';
  const resetBorderColor = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)';
  const titleColor = isLight ? '#1e293b' : 'white';
  const descColor = isLight ? '#64748b' : '#6b7280';
  const chevronColor = isLight ? '#94a3b8' : '#4b5563';

  return (
    <motion.div
      variants={fadeUp(delay)}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => to && navigate(to)}
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: '16px', padding: '28px',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        position: 'relative', overflow: 'hidden',
        boxShadow: cardShadow,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = hoverBorderColor;
        if (clickable) e.currentTarget.style.boxShadow = hoverShadow;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = resetBorderColor;
        e.currentTarget.style.boxShadow = cardShadow;
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon style={{ width: 22, height: 22, color: 'white' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: titleColor }}>{title}</h3>
        {clickable && <ChevronRight style={{ width: 14, height: 14, color: chevronColor }} />}
      </div>
      <p style={{ fontSize: 13, color: descColor, lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
  );
}

// ─── Company Badge ────────────────────────────────────────────
function CompanyBadge({ name, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', borderRadius: 999,
      background: `${color}12`, border: `1px solid ${color}30`,
      fontSize: 13, fontWeight: 600, color,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {name}
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────
function TestimonialCard({ name, role, company, text, rating, delay, isLight }) {
  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.02)';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)';
  const cardShadow = isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none';
  const textColor = isLight ? '#475569' : '#9ca3af';
  const nameColor = isLight ? '#1e293b' : 'white';
  const subColor = isLight ? '#94a3b8' : '#4b5563';
  const avatarBg = isLight ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)';

  return (
    <motion.div variants={fadeUp(delay)} style={{ background: cardBg, border: cardBorder, borderRadius: 16, padding: 24, boxShadow: cardShadow }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[...Array(rating)].map((_, i) => <Star key={i} style={{ width: 14, height: 14, color: '#f59e0b', fill: '#f59e0b' }} />)}
      </div>
      <p style={{ fontSize: 14, color: textColor, lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>"{text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' }}>
          {name[0]}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: nameColor }}>{name}</div>
          <div style={{ fontSize: 11, color: subColor }}>{role} · {company}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
const LandingPage = () => {
  const { user } = useSelector(s => s.auth);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const features = [
    { icon: Bot, title: 'AI Question Generation', gradient: 'linear-gradient(135deg,#00f0ff,#0070ff)', to: '/setup', desc: 'Ollama AI generates domain-specific questions tailored to your role, experience, and target company.' },
    { icon: Mic, title: 'Voice-Powered Answers', gradient: 'linear-gradient(135deg,#ab22ff,#ff22cc)', to: null, desc: 'Answer naturally using your voice. Browser Speech API transcribes in real time — completely free.' },
    { icon: Camera, title: 'AI Proctoring System', gradient: 'linear-gradient(135deg,#ff6b35,#f59e0b)', to: '/interview', desc: 'YOLOv8n pose detection monitors posture, eye contact, and flags suspicious behavior in real time.' },
    { icon: BarChart3, title: 'Detailed AI Feedback', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', to: '/analytics', desc: 'Scored on technical accuracy, communication, grammar, and confidence with actionable improvement tips.' },
    { icon: Shield, title: 'Anti-Cheating Detection', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', to: '/interview', desc: 'Copy-paste detection, tab switch monitoring, and face-away alerts ensure interview integrity.' },
    { icon: TrendingUp, title: 'Performance Analytics', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', to: '/analytics', desc: 'Track progress across sessions. Identify weak areas and measure your improvement over time.' },
    { icon: BrainCircuit, title: 'Company-Specific Prep', gradient: 'linear-gradient(135deg,#00f0ff,#ab22ff)', to: '/setup', desc: 'Practice with questions modeled on Google, Amazon, Microsoft, and Meta interview culture.' },
    { icon: Code, title: '20+ Tech Domains', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', to: '/setup', desc: 'Frontend, Backend, DSA, AI/ML, Cybersecurity, Robotics, DevOps, Blockchain and more.' },
    { icon: Lock, title: 'Private & Secure', gradient: 'linear-gradient(135deg,#10b981,#059669)', to: null, desc: 'JWT auth, encrypted sessions, and zero third-party data sharing. Your data stays yours.' },
  ];

  const stats = [
    { value: 59, suffix: '+', label: 'Companies Covered', icon: Trophy },
    { value: 2963, suffix: '+', label: 'DSA Problems', icon: Layers },
    { value: 20, suffix: '+', label: 'Tech Domains', icon: Globe },
    { value: 100, suffix: '%', label: 'Free to Use', icon: Target },
  ];


  const domains = [
    'Frontend Dev', 'Backend Dev', 'Full Stack', 'DSA & Algorithms',
    'AI / ML', 'Data Science', 'Cybersecurity', 'DevOps & Cloud',
    'System Design', 'Database', 'Robotics & IoT', 'Mobile Dev',
    'Blockchain', 'Computer Vision', 'NLP', 'Python', 'Java', 'C/C++',
    'Game Dev', 'Computer Networks',
  ];

  const companies = [
    { name: 'Google', color: '#4285f4' },
    { name: 'Amazon', color: '#ff9900' },
    { name: 'Microsoft', color: '#00a4ef' },
    { name: 'Meta', color: '#0668e1' },
    { name: 'Apple', color: isLight ? '#1e293b' : '#e2e8f0' },
    { name: 'TCS', color: '#00b4d8' },
    { name: 'Infosys', color: '#007cc3' },
    { name: 'Startup', color: '#22c55e' },
  ];

  const S = { fontFamily: 'Inter, system-ui, sans-serif' };

  // ─── Theme-aware colors ────────────────────────────────────
  const accent = isLight ? '#4f46e5' : '#00f0ff';
  const accentGrad = isLight ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)';
  const headingColor = isLight ? '#0f172a' : 'white';
  const bodyColor = isLight ? '#64748b' : '#6b7280';
  const mutedColor = isLight ? '#94a3b8' : '#4b5563';
  const cardBg = isLight ? '#ffffff' : 'rgba(255,255,255,0.02)';
  const cardBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)';
  const cardShadow = isLight ? '0 1px 3px rgba(0,0,0,0.06)' : 'none';
  const sectionBorder = { borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.04)' };
  const eyebrow = (color) => ({ fontSize: 11, color: isLight ? '#4f46e5' : color, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12, fontWeight: 700 });
  const h2Style = { fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: headingColor, marginBottom: 16, letterSpacing: '-1px' };
  const sub = { color: bodyColor, fontSize: 15, maxWidth: 520, margin: '0 auto' };

  // Badge
  const badgeBorder = isLight ? '1px solid #c7d2fe' : '1px solid rgba(0,240,255,0.25)';
  const badgeBg = isLight ? '#eef2ff' : 'rgba(0,240,255,0.08)';
  const badgeColor = isLight ? '#4f46e5' : '#00f0ff';

  // CTA button
  const ctaBg = isLight ? '#4f46e5' : 'linear-gradient(135deg,#00f0ff,#ab22ff)';
  const ctaColor = isLight ? '#ffffff' : 'black';
  const ctaShadow = isLight ? '0 4px 14px rgba(79,70,229,0.25)' : '0 0 30px rgba(0,240,255,0.3)';
  const secondaryBtnBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)';
  const secondaryBtnBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)';
  const secondaryBtnColor = isLight ? '#1e293b' : 'white';
  const secondaryBtnHoverBg = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)';

  // Social proof
  const avatarBorderColor = isLight ? '#f6f9fc' : '#0a0a14';
  const greenColor = '#22c55e';

  // Step circles
  const stepCircleBg = isLight ? '#eef2ff' : 'linear-gradient(135deg,rgba(0,240,255,0.15),rgba(171,34,255,0.15))';
  const stepCircleBorder = isLight ? '2px solid #c7d2fe' : '1px solid rgba(0,240,255,0.3)';
  const stepNumColor = isLight ? '#4f46e5' : '#00f0ff';
  const stepTitleColor = isLight ? '#1e293b' : 'white';
  const stepLineGrad = isLight ? 'linear-gradient(90deg,transparent,#c7d2fe,#ddd6fe,transparent)' : 'linear-gradient(90deg,transparent,rgba(0,240,255,0.3),rgba(171,34,255,0.3),transparent)';

  // Domain pill
  const pillBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)';
  const pillBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)';
  const pillColor = isLight ? '#64748b' : '#9ca3af';
  const pillHoverBg = isLight ? '#eef2ff' : 'rgba(0,240,255,0.08)';
  const pillHoverBorder = isLight ? '#c7d2fe' : 'rgba(0,240,255,0.3)';
  const pillHoverColor = isLight ? '#4f46e5' : '#00f0ff';

  // CTA section
  const ctaSectionBg = isLight ? 'linear-gradient(135deg,#eef2ff,#faf5ff)' : 'linear-gradient(135deg,rgba(0,240,255,0.05),rgba(171,34,255,0.05))';
  const ctaSectionBorder = isLight ? '1px solid #c7d2fe' : '1px solid rgba(0,240,255,0.15)';

  // Scroll indicator
  const scrollTextColor = isLight ? '#94a3b8' : '#374151';
  const scrollBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)';
  const scrollDotBg = isLight ? '#4f46e5' : '#00f0ff';

  return (
    <div style={{ ...S, position: 'relative', zIndex: 1 }}>
      <FloatingOrbs isLight={isLight} />

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 20px', position: 'relative' }}>
        <motion.div initial="hidden" animate="visible" variants={stagger(0.12)} style={{ maxWidth: 820, margin: '0 auto' }}>

          <motion.div variants={fadeUp(0)}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, border: badgeBorder, background: badgeBg, fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: badgeColor, marginBottom: 32 }}>
              <Zap style={{ width: 12, height: 12 }} />
              AI-Powered Mock Interview Platform
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp(0.1)} style={{ fontSize: 'clamp(42px,7vw,82px)', fontWeight: 900, lineHeight: 1.05, color: headingColor, marginBottom: 24, letterSpacing: '-2px' }}>
            Ace Your Next<br /><TypingText key={theme} words={['Interview.', 'Internship.', 'Dream Job.', 'Tech Role.']} isLight={isLight} />
          </motion.h1>

          <motion.p variants={fadeUp(0.2)} style={{ fontSize: 'clamp(15px,2vw,18px)', color: bodyColor, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 40px' }}>
            Practice real interview questions with AI feedback, voice answers,
            and proctoring — built for BTech CSE students targeting top companies.
          </motion.p>

          <motion.div variants={fadeUp(0.3)} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user ? '/setup' : '/register'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: ctaBg, color: ctaColor, fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: ctaShadow, transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Sparkles style={{ width: 16, height: 16 }} />
              Start Practicing Free
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: secondaryBtnBg, border: secondaryBtnBorder, color: secondaryBtnColor, fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = secondaryBtnHoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.background = secondaryBtnBg; }}>
              Sign In
            </Link>
          </motion.div>

          {/* Development-phase notice — honest framing instead of fake social proof */}
          <motion.div variants={fadeUp(0.4)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 }}>
            <div style={{ fontSize: 13, color: bodyColor }}>
              🚧 Actively in development — new companies &amp; features added weekly
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, color: scrollTextColor, letterSpacing: '1px', textTransform: 'uppercase' }}>Scroll to explore</div>
          <div style={{ width: 24, height: 40, borderRadius: 12, border: scrollBorder, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 6 }}>
            <div style={{ width: 4, height: 8, borderRadius: 2, background: scrollDotBg, animation: 'scrollDown 1.5s ease-in-out infinite' }} />
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '60px 20px', ...sectionBorder }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger(0.1)} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {stats.map(({ value, suffix, label, icon: Icon }) => (
              <motion.div key={label} variants={fadeUp()} style={{ textAlign: 'center', padding: '24px 16px', background: cardBg, border: cardBorder, borderRadius: 14, boxShadow: cardShadow }}>
                <Icon style={{ width: 20, height: 20, color: accent, margin: '0 auto 10px' }} />
                <div style={{ fontSize: 36, fontWeight: 900, color: headingColor, lineHeight: 1 }}>
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <div style={{ fontSize: 11, color: mutedColor, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── COMPANIES ── */}
      <section style={{ padding: '60px 20px', textAlign: 'center' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()}>
          <div style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 24 }}>Practice for interviews at</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {companies.map(c => <CompanyBadge key={c.name} {...c} />)}
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 20px', ...sectionBorder }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()} style={{ marginBottom: 60 }}>
            <div style={eyebrow('#00f0ff')}>How It Works</div>
            <h2 style={h2Style}>From Setup to Offer in 3 Steps</h2>
            <p style={sub}>No complicated onboarding. Start practicing in under a minute.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger(0.15)} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 27, left: '17%', right: '17%', height: 1, background: stepLineGrad }} />
            {[
              { n: '01', title: 'Choose Domain', desc: 'Select from 20+ tech specializations and set your experience level' },
              { n: '02', title: 'Start Practicing', desc: 'AI generates personalized questions from our 5000+ question database' },
              { n: '03', title: 'Get AI Feedback', desc: 'Voice or text answers — get expert feedback within seconds' },
            ].map(({ n, title, desc }, i) => (
              <motion.div key={n} variants={fadeUp(i * 0.1)} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: stepCircleBg, border: stepCircleBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20, fontWeight: 800, color: stepNumColor }}>{n}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: stepTitleColor, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: bodyColor, lineHeight: 1.7, maxWidth: 180, margin: '0 auto' }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES (with links) ── */}
      <section style={{ padding: '80px 20px', ...sectionBorder }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={eyebrow('#ab22ff')}>Features</div>
            <h2 style={h2Style}>Everything You Need to Land the Role</h2>
            <p style={{ ...sub, margin: '0 auto' }}>Click any feature card to explore that section of the app.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger(0.07)} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.05} isLight={isLight} />)}
          </motion.div>
        </div>
      </section>

      {/* ── DOMAINS ── */}
      <section style={{ padding: '80px 20px', ...sectionBorder }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()} style={{ marginBottom: 40 }}>
            <h2 style={h2Style}>20+ Tech Domains Covered</h2>
            <p style={{ color: bodyColor, fontSize: 14 }}>From web development to AI, cybersecurity to robotics.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger(0.03)} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {domains.map((d, i) => (
              <motion.span key={d} variants={fadeUp(i * 0.02)}
                style={{ padding: '6px 14px', borderRadius: 999, background: pillBg, border: pillBorder, fontSize: 12, color: pillColor, transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = pillHoverBg; e.currentTarget.style.borderColor = pillHoverBorder; e.currentTarget.style.color = pillHoverColor; }}
                onMouseLeave={e => { e.currentTarget.style.background = pillBg; e.currentTarget.style.borderColor = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = pillColor; }}>
                {d}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 20px', ...sectionBorder }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp()} style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', background: ctaSectionBg, border: ctaSectionBorder, borderRadius: 24, padding: '60px 40px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h2 style={h2Style}>Ready to Land Your Dream Internship?</h2>
          <p style={{ color: bodyColor, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
            Company-specific DSA practice, AI-powered interviews, and real-time proctoring — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            {['Free Forever', 'No Credit Card', 'Instant Access'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: bodyColor }}>
                <CheckCircle style={{ width: 14, height: 14, color: greenColor }} />
                {t}
              </div>
            ))}
          </div>
          <Link to={user ? '/setup' : '/register'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 12, background: ctaBg, color: ctaColor, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: ctaShadow, transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Sparkles style={{ width: 18, height: 18 }} />
            Start Free — No Signup Needed
            <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.04)', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: mutedColor }}>Built with ❤️ for BTech CSE students · Powered by Ollama + YOLOv8n</div>
        <div style={{ fontSize: 11, color: isLight ? '#cbd5e1' : '#1f2937', marginTop: 8 }}>© 2026 InterviewAI · Free to use</div>
      </footer>
    </div>
  );
};

export default LandingPage;