/**
 * FILE: server/controllers/dsaController.js
 * ================================================================
 * YE FILE KYA HAI: Company-Specific DSA Practice feature ka backend
 * logic — company list dena aur company-wise filtered questions dena.
 *
 * FUNCTIONS:
 *   1. getCompanies()       → DSAProblem collection mein jitni bhi
 *      unique companies hain, unka sorted list bhejta hai (koi
 *      duplicate `distinct()` se automatically hat jaate hain).
 *      Frontend ka CompanyDSASetup.jsx isi se dropdown banata hai —
 *      matlab jo companies bhi DB mein seed hongi, wahi dropdown mein
 *      automatically dikh jayengi, koi hardcoded list maintain nahi
 *      karni padti.
 *
 *   2. getCompanyProblems() → Ek specific company + difficulty ke
 *      hisaab se RANDOM questions deta hai (MongoDB `$sample` stage
 *      se) — taaki user baar-baar practice kare toh har baar alag
 *      questions milein, wahi repeat na hon.
 *
 * PROJECT MEIN ROLE: routes/dsaRoutes.js in dono functions ko
 * /api/dsa/companies aur /api/dsa/companies/:company/problems se
 * jodta hai. Data khud `scripts/seedDSAProblems.js` se DB mein aata
 * hai (GitHub ke ek community repo se company-wise metadata fetch
 * karke).
 */

const DSAProblem = require('../models/DSAProblem');

/**
 * @desc    Get list of all companies that have DSA problems seeded
 * @route   GET /api/dsa/companies
 * @access  Private
 */
exports.getCompanies = async (req, res) => {
  try {
    const companies = await DSAProblem.distinct('companies');
    res.json(companies.sort());
  } catch (err) {
    res.status(500).json({ message: 'Companies fetch karne mein fail' });
  }
};

/**
 * @desc    Get random DSA problems for a specific company & difficulty
 * @route   GET /api/dsa/companies/:company/problems?difficulty=Easy&count=5
 * @access  Private
 */
exports.getCompanyProblems = async (req, res) => {
  try {
    const { company } = req.params;
    const { difficulty, count } = req.query;

    const filter = { companies: company };
    if (difficulty && difficulty !== 'Any') filter.difficulty = difficulty;

    // Zyada se zyada 15 questions ek session mein (frontend slider bhi 1-10 tak limit karta hai)
    const limit = Math.min(parseInt(count) || 5, 15);

    // $sample = MongoDB ka random-pick operator. Isse har practice
    // session mein alag-alag questions milte hain, same set repeat nahi hota
    const problems = await DSAProblem.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
    ]);

    if (!problems.length) {
      return res.status(404).json({
        message: `${company} ke liye ${difficulty || ''} problems nahi mile`,
      });
    }

    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: 'Problems fetch karne mein fail' });
  }
};
