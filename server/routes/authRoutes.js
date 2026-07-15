/**
 * FILE: server/routes/authRoutes.js
 * ================================================================
 * YE FILE KYA HAI: Authentication ke saare URL endpoints yahan
 * define hote hain — register, login, session-check.
 *
 * ROUTES:
 *   POST /api/auth/register  → Public. Naya account banata hai.
 *   POST /api/auth/login     → Public. Login karke JWT token deta hai.
 *   GET  /api/auth/me        → Private (protect middleware). Current
 *                              logged-in user ka data deta hai — page
 *                              refresh hone pe frontend isse "auto-login"
 *                              persist karta hai.
 *
 * PROJECT MEIN ROLE: server.js is router ko `/api/auth` prefix ke
 * saath mount karta hai. Frontend ka authSlice.js (Redux) in teeno
 * endpoints ko call karta hai.
 */

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // 'protect' zaroori — sirf valid token wale hi apna data maang sakein

module.exports = router;
