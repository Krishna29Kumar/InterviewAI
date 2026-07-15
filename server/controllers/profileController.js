/**
 * FILE: server/controllers/profileController.js
 * ================================================================
 * YE FILE KYA HAI: User ke profile settings (naam/email/password/avatar)
 * update karne wale API handlers.
 *
 * FUNCTIONS:
 *   1. updateProfile()  → Naam, email, ya password change karta hai.
 *                         Password change karne ke liye current password
 *                         verify karta hai pehle (security ke liye).
 *   2. updateAvatar()   → Profile picture upload handle karta hai.
 *                         SMART FALLBACK: agar .env mein Cloudinary keys
 *                         (CLOUD_NAME/API_KEY/API_SECRET) set hain, toh
 *                         image Cloudinary (cloud storage) pe jaati hai.
 *                         Agar keys nahi hain (ya upload fail ho jaaye),
 *                         toh image automatically server ke local
 *                         `/uploads` folder mein save ho jaati hai —
 *                         koi crash nahi hota, feature dono tarike se
 *                         kaam karta hai.
 *
 * PROJECT MEIN ROLE: ProfilePage.jsx (frontend) in dono endpoints ko
 * call karta hai jab user apni settings save karta hai.
 */

const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

/**
 * @desc    Update user profile details (Name, Email, Password)
 * @route   PUT /api/profile/update
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    // '+password' zaroori hai kyunki agar password change karna ho toh
    // current password verify karne ke liye hashed value chahiye hogi
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, currentPassword, newPassword } = req.body;

    // Naam update — simple, koi extra check nahi chahiye
    if (name) user.name = name;

    // Email update — dusra koi user pehle se wo email use toh nahi kar raha
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
      user.email = email;
    }

    // Password change — sirf tabhi allow karo jab user apna CURRENT
    // password sahi de (security ke liye, taaki koi aur session hijack
    // karke silently password na badal sake)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Please provide current password to set a new password' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      // Yahan sirf plain-text assign ho raha hai — User.js ka pre('save')
      // hook automatically hash kar dega save hone se pehle (kyunki
      // isModified('password') true hoga is case mein)
      user.password = newPassword;
    }

    await user.save();

    // Password field wapas na bheje, isliye dobara fresh query (jo by
    // default password exclude karti hai)
    const updatedUser = await User.findById(user._id);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Upload & update user avatar
 * @route   POST /api/profile/avatar
 * @access  Private
 */
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      // User na mile toh uploaded temp file bhi cleanup kar do (disk space waste na ho)
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'User not found' });
    }

    let avatarUrl = '';

    // .env mein Cloudinary credentials set hain ya nahi — isi se decide
    // hota hai cloud storage use hoga ya local server storage
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      try {
        // Cloudinary pe upload + auto resize/crop to 150x150 (avatar ke liye kaafi hai)
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'interview_ai_avatars',
          width: 150,
          height: 150,
          crop: 'fill',
        });
        avatarUrl = result.secure_url;

        // Cloud pe upload ho gaya, ab local temp copy delete kar do
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cloudinaryError) {
        // Cloudinary down ho ya keys galat hon — crash mat karo, local
        // storage pe silently fallback kar jao
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
        avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
    } else {
      // Cloudinary configured hi nahi hai (jaisa abhi is project mein hai) —
      // seedha local /uploads folder ka URL bana do
      avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    user.avatar = avatarUrl;
    await user.save();

    res.json({
      message: 'Avatar updated successfully',
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateProfile,
  updateAvatar,
};
