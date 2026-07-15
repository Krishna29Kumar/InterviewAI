/**
 * FILE: server/routes/profileRoutes.js
 * ================================================================
 * YE FILE KYA HAI: User profile settings ke URL endpoints —
 * naam/email/password update aur avatar upload.
 *
 * ROUTES:
 *   PUT  /api/profile/update  → Private. Naam/email/password update.
 *   POST /api/profile/avatar  → Private. Naya avatar image upload
 *                               (uploadMiddleware pehle file ko
 *                               validate/save karta hai, phir
 *                               profileController Cloudinary ya
 *                               local storage decide karta hai).
 *
 * PROJECT MEIN ROLE: server.js is router ko `/api/profile` prefix
 * ke saath mount karta hai. Frontend ka ProfilePage.jsx in dono
 * endpoints ko call karta hai jab user "Save Changes" dabata hai.
 */

const express = require('express');
const router = express.Router();
const { updateProfile, updateAvatar } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.put('/update', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), updateAvatar); // upload.single() pehle chalta hai, phir controller

module.exports = router;
