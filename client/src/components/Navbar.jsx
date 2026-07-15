import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Home, LayoutDashboard, Play, BarChart3,
  User, LogOut, Menu, X, ChevronDown, Code2,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home, public: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, public: false },
  { to: '/setup', label: 'Practice', icon: Play, public: false },
  { to: '/dsa-practice/setup', label: 'Company DSA', icon: Code2, public: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, public: false },
];

const Navbar = () => {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActive = (to) => location.pathname === to;

  const S = { fontFamily: 'Inter, system-ui, sans-serif' };

  // Theme-aware colors
  const navBg = isLight
    ? (scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)')
    : (scrolled ? 'rgba(10,10,20,0.92)' : 'rgba(10,10,20,0.6)');
  const navBorder = isLight
    ? (scrolled ? '1px solid #e2e8f0' : '1px solid transparent')
    : (scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent');
  const navShadow = isLight
    ? (scrolled ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' : 'none')
    : (scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none');
  const logoColor = isLight ? '#1e293b' : 'white';
  const linkColor = (active) => isLight
    ? (active ? '#4f46e5' : '#64748b')
    : (active ? '#00f0ff' : '#6b7280');
  const linkBg = (active) => isLight
    ? (active ? '#eef2ff' : 'transparent')
    : (active ? 'rgba(0,240,255,0.08)' : 'transparent');
  const linkBorder = (active) => isLight
    ? (active ? '1px solid #c7d2fe' : '1px solid transparent')
    : (active ? '1px solid rgba(0,240,255,0.15)' : '1px solid transparent');
  const linkHoverColor = isLight ? '#1e293b' : 'white';
  const linkHoverBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)';
  const profileBtnBg = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)';
  const profileBtnBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)';
  const profileBtnBorderHover = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)';
  const profileNameColor = isLight ? '#1e293b' : 'white';
  const dropdownBg = isLight ? '#ffffff' : '#0d0d1a';
  const dropdownBorder = isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)';
  const dropdownShadow = isLight ? '0 10px 40px rgba(0,0,0,0.12)' : '0 20px 40px rgba(0,0,0,0.5)';
  const dropdownLinkColor = isLight ? '#64748b' : '#9ca3af';
  const dropdownLinkHoverBg = isLight ? '#f8fafc' : 'rgba(255,255,255,0.05)';
  const dropdownLinkHoverColor = isLight ? '#1e293b' : 'white';
  const signInColor = isLight ? '#64748b' : '#9ca3af';
  const signInHoverColor = isLight ? '#1e293b' : 'white';
  const getStartedBg = isLight ? '#4f46e5' : 'linear-gradient(135deg,#00f0ff,#ab22ff)';
  const getStartedColor = isLight ? '#ffffff' : 'black';
  const chevronColor = isLight ? '#94a3b8' : '#4b5563';
  const dividerColor = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.05)';
  const avatarBg = isLight ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)';

  return (
    <>
      <nav style={{
        ...S,
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        transition: 'all 0.3s ease',
        background: navBg,
        backdropFilter: 'blur(20px)',
        borderBottom: navBorder,
        boxShadow: navShadow,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: isLight ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ width: 17, height: 17, color: 'white' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 900, color: logoColor, letterSpacing: '-0.5px' }}>
              Interview<span style={{ background: isLight ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.filter(l => l.public || user).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10,
                fontSize: 13, fontWeight: isActive(to) ? 700 : 500,
                color: linkColor(isActive(to)),
                textDecoration: 'none', transition: 'all 0.2s',
                background: linkBg(isActive(to)),
                border: linkBorder(isActive(to)),
              }}
                onMouseEnter={e => { if (!isActive(to)) { e.currentTarget.style.color = linkHoverColor; e.currentTarget.style.background = linkHoverBg; } }}
                onMouseLeave={e => { if (!isActive(to)) { e.currentTarget.style.color = linkColor(false); e.currentTarget.style.background = 'transparent'; } }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            {user ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setProfileOpen(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px 6px 6px', borderRadius: 10,
                  background: profileBtnBg, border: profileBtnBorder,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = profileBtnBorderHover}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: profileNameColor }}>{user.name?.split(' ')[0]}</span>
                  <ChevronDown style={{ width: 13, height: 13, color: chevronColor, transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', minWidth: 180, background: dropdownBg, border: dropdownBorder, borderRadius: 12, padding: 6, zIndex: 100, boxShadow: dropdownShadow }}
                    >
                      {[
                        { label: 'Profile Settings', icon: User, to: '/profile' },
                        { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
                      ].map(({ label, icon: Icon, to }) => (
                        <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, color: dropdownLinkColor, textDecoration: 'none', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = dropdownLinkHoverBg; e.currentTarget.style.color = dropdownLinkHoverColor; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dropdownLinkColor; }}
                        >
                          <Icon style={{ width: 14, height: 14 }} />
                          {label}
                        </Link>
                      ))}
                      <div style={{ height: 1, background: dividerColor, margin: '4px 0' }} />
                      <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut style={{ width: 14, height: 14 }} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/login" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: signInColor, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = signInHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = signInColor}
                >
                  Sign In
                </Link>
                <Link to="/register" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: getStartedBg, color: getStartedColor, textDecoration: 'none', transition: 'transform 0.2s', boxShadow: isLight ? '0 1px 3px rgba(79,70,229,0.3)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(v => !v)} style={{ display: 'none', background: 'none', border: 'none', color: isLight ? '#64748b' : '#6b7280', cursor: 'pointer', padding: 4 }} className="mobile-menu-btn">
              {mobileOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div style={{ height: 64 }} />

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;