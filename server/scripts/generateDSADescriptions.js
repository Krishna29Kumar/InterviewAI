/**
 * FILE: server/scripts/generateDSADescriptions.js
 * ================================================================
 * Jo bhi DSAProblem documents mein description khaali hai, unke
 * liye Ollama se ORIGINAL (apne words mein likha) explanation
 * generate karta hai — title + topics + difficulty ke basis par.
 * LeetCode se seedha copy NAHI karta, isliye copyright-safe hai.
 *
 * Run: node server/scripts/generateDSADescriptions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const DSAProblem = require('../models/DSAProblem');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const DELAY_MS = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ollamaGenerate(prompt) {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 1200 },
      },
      { timeout: 120000 }
    );
    return response.data.response || '';
  } catch (err) {
    console.error('[Ollama] Error:', err.message);
    return null;
  }
}

function buildPrompt(problem) {
  return `You are writing an ORIGINAL coding interview problem explanation
(not copied from LeetCode or any other source — write it fully in your own
words, as if explaining this problem type to a student for the first time).

Problem title: "${problem.title}"
Difficulty: ${problem.difficulty}
Topics: ${(problem.topics || []).join(', ') || 'general'}

Write a complete, original problem statement for a coding problem with this
title and topics. Return ONLY valid JSON, no markdown, no explanation
outside JSON, in this exact structure:

{
  "description": "<2-4 sentence original problem statement, clearly explaining what needs to be solved>",
  "examples": [
    { "input": "<example input>", "output": "<example output>", "explanation": "<short explanation>" },
    { "input": "<example input 2>", "output": "<example output 2>", "explanation": "<short explanation 2>" }
  ],
  "constraints": ["<constraint 1>", "<constraint 2>", "<constraint 3>"],
  "starterCode": "<JavaScript function signature with a comment describing params, e.g. 'function solve(nums) {\\n  // your code here\\n}'>"
}`;
}

async function processProblem(problem) {
  const prompt = buildPrompt(problem);
  const response = await ollamaGenerate(prompt);
  if (!response) return false;

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return false;
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.description) return false;

    await DSAProblem.updateOne(
      { _id: problem._id },
      {
        $set: {
          description: parsed.description,
          examples: Array.isArray(parsed.examples) ? parsed.examples : [],
          constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
          starterCode: parsed.starterCode || '// Yahan apna solution likho\n',
        },
      }
    );
    return true;
  } catch (e) {
    console.error(`[Parse Error] "${problem.title}":`, e.message);
    return false;
  }
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const problems = await DSAProblem.find({
    $or: [{ description: '' }, { description: { $exists: false } }],
  });

  console.log(`Found ${problems.length} problems without description. Generating...\n`);

  let done = 0;
  let failed = 0;

  for (const problem of problems) {
    const ok = await processProblem(problem);
    if (ok) {
      done += 1;
      console.log(`✅ [${done + failed}/${problems.length}] ${problem.title}`);
    } else {
      failed += 1;
      console.log(`❌ [${done + failed}/${problems.length}] ${problem.title} — skipped`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Success: ${done}, Failed: ${failed}`);
  process.exit(0);
})();
