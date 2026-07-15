/**
 * FILE: server/middleware/authMiddleware.js
 * ================================================================
 * YE FILE KYA HAI: "Gatekeeper" middleware jo check karta hai ki
 * request bhejne wala user actually logged-in hai ya nahi.
 *
 * YE KYA KARTI HAI:
 *   1. Request ke header mein `Authorization: Bearer <token>` dhundta hai
 *   2. Us JWT token ko verify karta hai (JWT_SECRET se sign/decode hota hai)
 *   3. Token sahi nikla toh, us token ke andar chhupi user ID se poora
 *      User document DB se nikaal ke `req.user` mein daal deta hai
 *      (taaki aage wale controllers ko pata ho "kaun request kar raha hai")
 *   4. Token galat/missing ho toh 401 Unauthorized bhej deta hai
 *
 * PROJECT MEIN ROLE: `protect` function har us route pe lagaya jaata
 * hai jo login-required hai (jaise /api/interview/*, /api/dsa/*,
 * /api/profile/*). Routes files mein `router.get('/x', protect, handler)`
 * is tarah use hota hai — matlab pehle ye middleware chalega, tabhi
 * jaake asli controller function chalega.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // "Bearer <token>" string se sirf token nikaalo
      token = req.headers.authorization.split(' ')[1];

      // Token ko verify karo — agar tampered/expired hoga toh yahin error throw hoga
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-jwt-key');

      // Token ke andar stored user ID se poora user fetch karo (password chhod ke)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next(); // Sab sahi — aage wale route handler ko chalne do
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
