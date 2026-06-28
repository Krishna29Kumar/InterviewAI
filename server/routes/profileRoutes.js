const express = require('express');
const router = express.Router();
const { updateProfile, updateAvatar } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.put('/update', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
