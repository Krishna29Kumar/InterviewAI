/**
 * FILE: server/controllers/authController.js
 * ================================================================
 * YE FILE KYA HAI: Authentication (register/login/session-check)
 * ka poora logic — user account banane aur login karne ka core.
 *
 * FUNCTIONS:
 *   1. registerUser() → Naya account banata hai. Email duplicate check
 *      karta hai, phir User model mein save karta hai (password
 *      User.js ke pre-save hook se automatically hash ho jaata hai).
 *   2. loginUser()    → Email+password verify karta hai
 *      (`user.matchPassword()` bcrypt se compare karta hai).
 *   3. getMe()        → Frontend page-load pe ye check karta hai ki
 *      user ka JWT token abhi bhi valid hai ya nahi (auto-login
 *      persist karne ke liye — authSlice.js ka checkAuthSession()).
 *
 * JWT TOKEN: registerUser aur loginUser dono successful hone pe ek
 * JWT token generate karke bhejte hain (generateToken helper se).
 * Frontend ye token localStorage mein save karta hai aur har request
 * ke saath `Authorization: Bearer <token>` header mein bhejta hai —
 * authMiddleware.js isi token ko verify karta hai.
 *
 * PROJECT MEIN ROLE: routes/authRoutes.js in teeno functions ko
 * /api/auth/register, /api/auth/login, /api/auth/me se jodta hai.
 * Frontend ki taraf se authSlice.js (Redux) inhe call karta hai.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token banane ka helper — user ki DB ID ko sign karke ek 30-din
// valid token deta hai
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret-jwt-key', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Same email se pehle se koi account toh nahi bana hua
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Note: password yahan plain-text lag raha hai, lekin User.js ka
    // pre('save') hook ise save hone se pehle automatically hash kar deta hai
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id), // Turant login bhi kara do, register ke baad
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // '+password' zaroori hai kyunki User schema mein password by default
    // hidden hai (select: false) — yahan compare karne ke liye chahiye
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      // Jaan-boojh kar generic message — "email exists" vs "wrong password"
      // alag se batana security risk hota hai (email-enumeration attack)
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user profile (Current active session check)
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // req.user pehle se authMiddleware.js ne attach kar diya hota hai
    // (agar token valid hai tabhi yahan tak pahunchega)
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
