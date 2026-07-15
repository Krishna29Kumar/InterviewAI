/**
 * FILE: server/routes/dsaRoutes.js
 * ================================================================
 * YE FILE KYA HAI: Company-Specific DSA Practice feature ke saare
 * URL endpoints yahan define hote hain.
 *
 * ROUTES:
 *   GET /api/dsa/companies
 *     → dsaController.getCompanies() ko call karta hai. Poori list
 *       deta hai un companies ki jinke questions DSAProblem collection
 *       mein seed hain (abhi 59 companies, 2963 unique questions).
 *
 *   GET /api/dsa/companies/:company/problems?difficulty=Easy&count=5
 *     → dsaController.getCompanyProblems() ko call karta hai. Ek
 *       specific company ke random questions deta hai (difficulty
 *       aur count query params se filter/limit hote hain).
 *
 * DATA SOURCE: Ye routes `DSAProblem` model (models/DSAProblem.js) use
 * karte hain, jo `scripts/seedDSAProblems.js` se GitHub ke ek
 * community repo se populate hota hai — NA ki purani "questions"
 * collection (jo normal AI-interview questions ke liye alag se use
 * hoti hai aiService.js mein).
 *
 * PROJECT MEIN ROLE: Frontend ka CompanyDSASetup.jsx pehle
 * /companies call karke dropdown banata hai, phir company select
 * hone par /companies/:company/problems call karke actual DSA
 * questions fetch karta hai.
 */

const express = require('express');
const router = express.Router();
const { getCompanies, getCompanyProblems } = require('../controllers/dsaController');
const { protect } = require('../middleware/authMiddleware');

router.get('/companies', protect, getCompanies);
router.get('/companies/:company/problems', protect, getCompanyProblems);

module.exports = router;
