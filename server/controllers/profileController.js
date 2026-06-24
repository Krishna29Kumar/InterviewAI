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
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, currentPassword, newPassword } = req.body;

    // Update basic info
    if (name) user.name = name;
    
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
      user.email = email;
    }

    // Handle password change if requested
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

      user.password = newPassword;
    }

    await user.save();

    // Fetch user without password to send back
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
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'User not found' });
    }

    let avatarUrl = '';

    // Check if Cloudinary configurations are present in ENV
    const hasCloudinary = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'interview_ai_avatars',
          width: 150,
          height: 150,
          crop: 'fill',
        });
        avatarUrl = result.secure_url;
        
        // Remove file from local server uploads
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
        // Fallback to local storage link
        avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
    } else {
      // Local storage fallback link
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
