import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileSuccess, updateAvatarSuccess } from '../redux/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, ShieldAlert, KeyRound, Loader2, Camera, UserSquare } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Basic Info Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);

  // Avatar Upload State
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Submit profile edits
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      return toast.error('Name and email cannot be blank');
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return toast.error('New password must be at least 6 characters');
      }
      if (newPassword !== confirmNewPassword) {
        return toast.error('New passwords do not match');
      }
    }

    setInfoLoading(true);
    try {
      const payload = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const response = await api.put('/profile/update', payload);
      dispatch(updateProfileSuccess(response.data));
      toast.success('Profile details updated successfully');

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile settings');
    } finally {
      setInfoLoading(false);
    }
  };

  // Submit Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size must be less than 5MB');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    try {
      const response = await api.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      dispatch(updateAvatarSuccess(response.data.avatar));
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar image');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative z-10">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-neonBlue/10 border border-neonBlue/20 flex items-center justify-center text-neonBlue">
          <UserSquare className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Profile Settings</h1>
          <p className="text-gray-400 text-xs mt-0.5">Manage your personal metrics and security settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Card: Avatar Box */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-darkBorder flex flex-col items-center justify-center space-y-5 h-fit shadow-glass">
          <div className="relative group">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-2 border-neonBlue/50 shadow-neon-blue transition duration-300 group-hover:opacity-75"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-neonPurple/10 border-2 border-neonPurple/50 text-neonPurple flex items-center justify-center font-extrabold text-3xl transition duration-300 group-hover:opacity-75 shadow-neon-purple">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Hover Camera overlay */}
            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition duration-300">
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={avatarLoading}
              />
            </label>

            {avatarLoading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-neonBlue animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white leading-snug">{user?.name}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-white/5 text-[10px] text-gray-500 text-center leading-normal">
            Max upload size: 5MB.<br />Supports JPEG, PNG, or WEBP.
          </div>
        </div>

        {/* Right Card: Info Form */}
        <div className="md:col-span-2">
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleUpdateProfile}
            className="glass-panel p-8 rounded-2xl border border-darkBorder space-y-6 shadow-glass"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Update Account Information</h3>

            {/* Profile input info fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password security separator */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-neonPurple flex items-center space-x-1.5 uppercase">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Security / Password Change (Optional)</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password if setting a new one"
                  className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
                  required={!!newPassword}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-200 glass-input"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={infoLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-neon-gradient text-white font-semibold text-sm shadow-neon-blue bg-neon-gradient-hover hover:scale-105 active:scale-95 disabled:opacity-50 transition duration-200 flex items-center justify-center space-x-2"
            >
              {infoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
