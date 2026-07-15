import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileSuccess } from '../redux/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, KeyRound, Loader2, UserSquare, Shield, Edit3, CheckCircle } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay } },
});

const ProfilePage = () => {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) return toast.error('Name and email cannot be blank');
    if (newPassword) {
      if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
      if (newPassword !== confirmNew) return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const payload = { name, email };
      if (newPassword) { payload.currentPassword = currentPassword; payload.newPassword = newPassword; }
      const { data } = await api.put('/profile/update', payload);
      dispatch(updateProfileSuccess(data));
      toast.success('Profile updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmNew('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const S = { fontFamily: 'Inter, system-ui, sans-serif' };
  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', fontSize: 13, outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 6, display: 'block' };
  const cardStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 28 };

  const initials = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div style={{ ...S, maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp(0)} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserSquare style={{ width: 20, height: 20, color: '#00f0ff' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Profile Settings</h1>
          <p style={{ color: '#4b5563', fontSize: 12, marginTop: 2 }}>Manage your account information and security settings</p>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

        {/* ── Left: Avatar Card ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.1)} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, height: 'fit-content' }}>

          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(0,240,255,0.3)' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#ab22ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, color: 'black', border: '3px solid rgba(0,240,255,0.3)' }}>
                {initials}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#0a0a14', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit3 style={{ width: 12, height: 12, color: '#6b7280' }} />
            </div>
          </div>

          {/* Name & Email */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: '#4b5563' }}>{user?.email}</div>
          </div>

          {/* Account info */}
          <div style={{ width: '100%', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { label: 'Account Type', value: 'Free Plan', color: '#22c55e' },
              { label: 'Member Since', value: '2026', color: '#00f0ff' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#4b5563' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Security badge */}
          <div style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 14, height: 14, color: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Account Secured with JWT</span>
          </div>
        </motion.div>

        {/* ── Right: Form ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp(0.15)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personal Info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <User style={{ width: 14, height: 14, color: '#00f0ff' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Information</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    style={inputStyle} required
                    onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    style={inputStyle} required
                    onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <KeyRound style={{ width: 14, height: 14, color: '#ab22ff' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Change Password</span>
                <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 500 }}>(optional)</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input
                    type="password" value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Required only if changing password"
                    style={inputStyle} required={!!newPassword}
                    onFocus={e => e.target.style.borderColor = 'rgba(171,34,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input
                      type="password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(171,34,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input
                      type="password" value={confirmNew}
                      onChange={e => setConfirmNew(e.target.value)}
                      placeholder="Repeat new password"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(171,34,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12,
                background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#00f0ff,#ab22ff)',
                color: loading ? '#6b7280' : 'black',
                fontWeight: 800, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none', transition: 'transform 0.2s',
              }}
                onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {loading
                  ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                  : <><CheckCircle style={{ width: 14, height: 14 }} /> Save Changes</>
                }
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;