import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../redux/slices/authSlice';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, Loader2, Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay } },
});

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, user } = useSelector(s => s.auth);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Fill in all fields');
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  const S = { fontFamily: 'Inter, system-ui, sans-serif' };
  const inputWrap = { position: 'relative' };
  const inputStyle = {
    width: '100%', padding: '12px 16px 12px 44px',
    borderRadius: 10, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', color: 'white',
    fontSize: 13, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };
  const iconStyle = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#374151', pointerEvents: 'none' };
  const labelStyle = { fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 6, display: 'block' };

  return (
    <div style={{ ...S, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(0,240,255,0.06) 0%,transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '30%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(171,34,255,0.06) 0%,transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0)} style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#00f0ff,#ab22ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ width: 20, height: 20, color: 'black' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Interview<span style={{ background: 'linear-gradient(135deg,#00f0ff,#ab22ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span></span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.1)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px' }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome back</h1>
            <p style={{ fontSize: 13, color: '#4b5563' }}>Sign in to continue your interview practice</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={inputWrap}>
                <Mail style={iconStyle} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} required
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ ...inputWrap }}>
                <Lock style={iconStyle} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" style={{ ...inputStyle, paddingRight: 44 }} required
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 0 }}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)', color: loading ? '#6b7280' : 'black', fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', transition: 'transform 0.2s', marginTop: 4 }}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> Signing in...</> : <>Sign In <ArrowRight style={{ width: 15, height: 15 }} /></>}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 13, color: '#4b5563' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#00f0ff', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;