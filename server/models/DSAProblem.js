/**
 * FILE: server/models/DSAProblem.js
 * ================================================================
 * YE FILE KYA HAI: Company-specific DSA (LeetCode-style) coding
 * question ka schema.
 *
 * DATA SOURCE: `scripts/seedDSAProblems.js` GitHub ke ek community
 * repo (liquidslr/interview-company-wise-problems) se metadata
 * (title, difficulty, topics, official LeetCode link, frequency)
 * fetch karke ye collection populate karta hai. Description field
 * jaan-boojh kar khaali/paraphrase rakha jaata hai — LeetCode ke
 * copyrighted problem statements ko word-for-word copy nahi karte.
 *
 * DESIGN NOTE: `companies` ek array hai (single string nahi) kyunki
 * ek hi question (jaise "Two Sum") kai companies pooch sakti hain —
 * isse duplicate documents banane ki zaroorat nahi padti.
 *
 * PROJECT MEIN ROLE: dsaController.js is model se company-wise
 * filtered questions fetch karta hai jab user "Company-Specific DSA
 * Practice" flow mein company + difficulty select karta hai.
 */

const mongoose = require('mongoose');

const dsaProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' }, // Apne words mein likhna, LeetCode se copy mat karna (copyright)
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  topics: [String],
  companies: [{ type: String, index: true }], // Ek question kai companies se link ho sakta hai
  examples: [{ input: String, output: String, explanation: String }],
  constraints: [String],
  starterCode: { type: String, default: '// Yahan apna solution likho\n' },
  leetcodeLink: String,
  frequency: Number, // Kitni baar historically pooche jaane ka data (seed source se)
}, { timestamps: true });

// Company + difficulty ke combination pe fast query ke liye compound index
dsaProblemSchema.index({ companies: 1, difficulty: 1 });

module.exports = mongoose.model('DSAProblem', dsaProblemSchema);
