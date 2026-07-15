/**
 * FILE: server/middleware/uploadMiddleware.js
 * ================================================================
 * YE FILE KYA HAI: File upload handler — Multer (Express ke liye
 * file-upload library) ka configuration.
 *
 * YE KYA KARTI HAI:
 *   1. `server/uploads/` folder ko auto-create karti hai agar exist
 *      na kare (taaki first-time setup pe crash na ho)
 *   2. Har uploaded file ka ek UNIQUE naam banati hai (timestamp +
 *      random number) — taaki do users ka same-naam file upload
 *      karne se ek doosre ko overwrite na kar de
 *   3. Sirf allowed file types accept karti hai — Images (jpeg/png/webp)
 *      aur Audio (wav/mp3/m4a/webm/ogg). Baaki sab reject ho jaate hain
 *   4. File size limit 10MB rakhi hai (bade files se server crash na ho)
 *
 * PROJECT MEIN ROLE:
 *   - Profile avatar upload (`/api/profile/avatar`) is middleware se
 *     hoke guzarta hai, phir profileController.js Cloudinary ya local
 *     storage decide karta hai (config/cloudinary.js dekho)
 *   - Voice-answer audio recordings bhi isi middleware se upload
 *     hoke `/api/interview/transcribe` route tak pahunchte hain
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Server start hote hi uploads folder create kar do agar pehle se na ho
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer ko batao files kahan aur kis naam se save karni hain
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Unique naam: fieldname-timestamp-randomnumber.ext (collision se bachne ke liye)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Sirf specific image/audio formats allow karo, baaki reject
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|wav|mp3|m4a|webm|ogg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Supported formats: Images (JPEG, PNG, WEBP) & Audio (WAV, MP3, WEBM)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB per file
});

module.exports = upload;
