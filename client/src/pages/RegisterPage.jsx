import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../redux/slices/authSlice';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Loader2, Zap, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay } },
});

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, user } = useSelector(s => s.auth);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Fill in all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    const result = await dispatch(register({ name, email, password }));
    if (register.fulfilled.match(result)) {
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  const S = { fontFamily: 'Inter, system-ui, sans-serif' };
  const inputStyle = {
    width: '100%', padding: '12px 16px 12px 44px',
    borderRadius: 10, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', color: 'white',
    fontSize: 13, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };
  const iconStyle = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#374151', pointerEvents: 'none' };
  const labelStyle = { fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 6, display: 'block' };

  const perks = ['Free forever', 'No credit card', 'AI-powered feedback', '5000+ questions'];

  return (
    <div style={{ ...S, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '20%', right: '25%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(171,34,255,0.06) 0%,transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '25%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(0,240,255,0.06) 0%,transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0)} style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#00f0ff,#ab22ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ width: 20, height: 20, color: 'black' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
              Interview<span style={{ background: 'linear-gradient(135deg,#00f0ff,#ab22ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
            </span>
          </Link>
        </motion.div>

        {/* Perks */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.05)} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', marginBottom: 24 }}>
          {perks.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#4b5563' }}>
              <CheckCircle style={{ width: 12, height: 12, color: '#22c55e' }} />
              {p}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.1)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '32px' }}>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6 }}>Create your account</h1>
            <p style={{ fontSize: 13, color: '#4b5563' }}>Start practicing for free — no credit card needed</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User style={iconStyle} />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" style={inputStyle} required
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={iconStyle} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle} required
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={iconStyle} />
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters" style={{ ...inputStyle, paddingRight: 44 }} required
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 0 }}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
              {/* Password strength */}
              {password.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 999,
                      background: i < Math.min(Math.floor(password.length / 3), 4)
                        ? password.length < 6 ? '#ef4444' : password.length < 10 ? '#f59e0b' : '#22c55e'
                        : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)', color: loading ? '#6b7280' : 'black', fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', transition: 'transform 0.2s', marginTop: 4 }}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading
                ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> Creating account...</>
                : <>Create Free Account <ArrowRight style={{ width: 15, height: 15 }} /></>}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 13, color: '#4b5563' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00f0ff', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </motion.div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#1f2937' }}>
          By creating an account, you agree to our Terms of Service
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;