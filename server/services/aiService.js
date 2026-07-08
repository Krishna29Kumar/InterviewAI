/**
 * FILE: server/services/aiService.js
 * =====================================
 * OpenAI HATAYA — Ollama + MongoDB se replace kiya
 *
 * Kya karta hai:
 * 1. generateQuestions() → MongoDB se scraped questions fetch karo
 *                        → Ollama se personalize karo
 * 2. analyzeInterview()  → Ollama llama3 se real AI feedback
 * 3. transcribeAudio()   → Web Speech API fallback (Whisper hataya)
 */

const axios = require('axios');
const mongoose = require('mongoose');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// ─────────────────────────────────────────────────
// Domain mapping — role → MongoDB domain
// ─────────────────────────────────────────────────
const ROLE_TO_DOMAIN = {
  'Frontend Developer': ['frontend'],
  'Backend Developer': ['backend'],
  'Full Stack Developer': ['frontend', 'backend'],
  'Data Scientist': ['data_science', 'ai_ml'],
  'Machine Learning Engineer': ['ai_ml', 'data_science'],
  'AI Engineer': ['ai_ml', 'data_science'],
  'Cybersecurity Analyst': ['cybersecurity'],
  'Ethical Hacker': ['cybersecurity'],
  'DevOps Engineer': ['devops'],
  'Cloud Engineer': ['devops'],
  'Database Administrator': ['database'],
  'Android Developer': ['mobile'],
  'iOS Developer': ['mobile'],
  'Mobile Developer': ['mobile'],
  'System Design Engineer': ['system_design'],
  'Blockchain Developer': ['blockchain'],
  'Game Developer': ['game_dev'],
  'Embedded Systems Engineer': ['robotics'],
  'Robotics Engineer': ['robotics'],
  'Java Developer': ['java'],
  'Python Developer': ['python'],
  'C++ Developer': ['cpp'],
  'NLP Engineer': ['nlp'],
  'Computer Vision Engineer': ['computer_vision'],
  'Software Engineer': ['dsa', 'cs_fundamentals'],
  'Default': ['dsa', 'frontend', 'backend'],
};

// Difficulty mapping
const LEVEL_TO_DIFFICULTY = {
  'Junior': 'easy',
  'Mid': 'medium',
  'Senior': 'hard',
};

// ─────────────────────────────────────────────────
// Ollama call helper
// ─────────────────────────────────────────────────
async function ollamaGenerate(prompt, systemPrompt = '') {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000,
        },
      },
      { timeout: 120000 }
    );
    return response.data.response || '';
  } catch (err) {
    console.error('[Ollama] Error:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────
// MongoDB questions collection
// ─────────────────────────────────────────────────
function getQuestionsCollection() {
  return mongoose.connection.db.collection('questions');
}

// ─────────────────────────────────────────────────
// 1. GENERATE QUESTIONS
// MongoDB se fetch → Ollama se rephrase/personalize
// ─────────────────────────────────────────────────
const generateQuestions = async (role, level, type, difficulty, numQuestions = 5, company = null) => {
  const count = parseInt(numQuestions) || 5;

  try {
    // MongoDB se questions fetch karo
    const col = getQuestionsCollection();
    const domains = ROLE_TO_DOMAIN[role] || ROLE_TO_DOMAIN['Default'];
    const difficultyLevel = LEVEL_TO_DIFFICULTY[level] || 'medium';

    // Query build karo
    const query = {
      domain: { $in: domains },
    };

    // Difficulty filter
    if (difficulty === 'Easy') query.difficulty = 'easy';
    if (difficulty === 'Hard') query.difficulty = 'hard';
    if (difficulty === 'Medium') query.difficulty = { $in: ['medium', 'easy'] };

    // Type filter
    if (type === 'Behavioral') {
      query.$or = [
        { topic: { $in: ['behavioral', 'hr', 'soft_skills'] } },
        { question: { $regex: /team|project|conflict|challenge|leadership/i } },
      ];
    }

    // Fetch more than needed, then randomize
    const allQuestions = await col
      .find(query)
      .limit(count * 5)
      .toArray();

    // Shuffle
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count * 2, allQuestions.length));

    if (selected.length === 0) {
      console.log('[Questions] MongoDB mein match nahi mila, fallback use karo');
      return getFallbackQuestions(role, type, count);
    }

    // Ollama se personalize karo
    const questionTexts = selected.slice(0, count * 2).map(q => q.question).join('\n');

    const ollamaPrompt = `You are an expert technical interviewer.

Here are some interview questions from a database:
${questionTexts}

Task: Select and rephrase exactly ${count} of the BEST questions for:
- Role: ${role}
- Experience Level: ${level}
- Interview Type: ${type}
- Difficulty: ${difficulty}
${company ? `- Target Company: ${company} (tailor questions to their style)` : ''}

Rules:
1. Return ONLY a JSON array, no markdown, no explanation
2. Each item must have ONLY "questionText" key
3. Make questions specific and relevant to ${role}
4. For ${level} level — questions should match that experience

Example format:
[{"questionText": "Question 1?"},{"questionText": "Question 2?"}]`;

    const ollamaResponse = await ollamaGenerate(ollamaPrompt);

    if (ollamaResponse) {
      try {
        // JSON extract karo response se
        const jsonMatch = ollamaResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, count);
          }
        }
      } catch (parseErr) {
        console.log('[Ollama] Parse error, MongoDB questions use kar raha hoon');
      }
    }

    // Ollama fail — direct MongoDB questions use karo
    return selected.slice(0, count).map(q => ({ questionText: q.question }));

  } catch (err) {
    console.error('[generateQuestions] Error:', err.message);
    return getFallbackQuestions(role, type, count);
  }
};

// ─────────────────────────────────────────────────
// 2. ANALYZE INTERVIEW — Ollama se real feedback
// ─────────────────────────────────────────────────
const analyzeInterview = async (role, level, questions, answers) => {
  try {
    const qaPairs = questions.map((q, idx) => {
      const ans = answers.find(a => a.questionIndex === idx);
      return {
        q: q.questionText,
        a: ans ? ans.answerText : 'No answer provided.',
      };
    });

    const qaText = qaPairs.map((p, i) =>
      `Q${i + 1}: ${p.q}\nAnswer: ${p.a}`
    ).join('\n\n');

    const systemPrompt = `You are an expert interview coach and evaluator.
Analyze interview answers and provide detailed, honest feedback.
Always respond with valid JSON only — no markdown, no explanation outside JSON.`;

    const prompt = `Evaluate this ${level}-level ${role} interview:

${qaText}

Return this exact JSON structure (no markdown):
{
  "technicalScore": <0-100>,
  "communicationScore": <0-100>,
  "confidenceScore": <0-100>,
  "grammarScore": <0-100>,
  "problemSolvingScore": <0-100>,
  "averageScore": <0-100>,
  "strengths": "<overall strengths in 2-3 sentences>",
  "weaknesses": "<areas to improve in 2-3 sentences>",
  "suggestions": "<specific actionable advice>",
  "feedbackDetails": [
    {
      "questionText": "<question>",
      "answerText": "<answer>",
      "score": <0-100>,
      "strengths": "<what was good>",
      "weaknesses": "<what was missing>",
      "suggestions": "<how to improve>"
    }
  ]
}`;

    const response = await ollamaGenerate(prompt, systemPrompt);

    if (response) {
      try {
        // JSON extract karo
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.averageScore !== undefined) {
            return parsed;
          }
        }
      } catch (e) {
        console.log('[Ollama] Feedback parse error, fallback use karo');
      }
    }

    return generateFallbackFeedback(questions, answers);

  } catch (err) {
    console.error('[analyzeInterview] Error:', err.message);
    return generateFallbackFeedback(questions, answers);
  }
};

// ─────────────────────────────────────────────────
// 3. TRANSCRIBE — Whisper hataya, Web Speech use karo
// ─────────────────────────────────────────────────
const transcribeAudio = async (filePath) => {
  // Whisper/OpenAI nahi hai ab
  // Frontend Web Speech API use karega
  throw new Error('Whisper not configured. Using browser Web Speech API.');
};

// ─────────────────────────────────────────────────
// FALLBACK — Jab Ollama bhi fail ho
// ─────────────────────────────────────────────────
function getFallbackQuestions(role, type, count) {
  const FALLBACK = {
    'Frontend Developer': [
      "What are the differences between virtual DOM and real DOM in React?",
      "Explain how the event loop works in JavaScript.",
      "How does CSS specificity work?",
      "What are React Hooks and their rules?",
      "Explain closures in JavaScript with an example.",
      "What is the difference between == and === in JavaScript?",
      "How does async/await work in JavaScript?",
      "What is the box model in CSS?",
    ],
    'Backend Developer': [
      "What is the event loop in Node.js?",
      "Explain REST vs GraphQL.",
      "How do you handle authentication in Node.js?",
      "What is middleware in Express.js?",
      "Explain database indexing.",
      "What is the difference between SQL and NoSQL?",
      "How do you handle errors in async Node.js code?",
      "What are environment variables and why use them?",
    ],
    'Data Scientist': [
      "Explain overfitting and how to prevent it.",
      "What is the difference between supervised and unsupervised learning?",
      "Explain the bias-variance tradeoff.",
      "What is cross-validation?",
      "Explain gradient descent.",
      "What is regularization in machine learning?",
      "Explain the difference between precision and recall.",
      "What is a confusion matrix?",
    ],
    'Cybersecurity Analyst': [
      "What is the difference between symmetric and asymmetric encryption?",
      "Explain SQL injection and how to prevent it.",
      "What is a man-in-the-middle attack?",
      "Explain the CIA triad.",
      "What is a firewall and how does it work?",
      "What is penetration testing?",
      "Explain XSS attacks.",
      "What is two-factor authentication?",
    ],
    'DevOps Engineer': [
      "What is CI/CD and why is it important?",
      "Explain Docker containers vs virtual machines.",
      "What is Kubernetes and what problem does it solve?",
      "Explain Infrastructure as Code.",
      "What is a load balancer?",
      "How does Git branching strategy work?",
      "What is blue-green deployment?",
      "Explain monitoring and alerting in DevOps.",
    ],
    'Default': [
      "Tell me about a challenging technical project you worked on.",
      "How do you approach debugging a complex problem?",
      "Explain your experience with version control systems.",
      "How do you keep your technical skills up-to-date?",
      "Describe your approach to testing and code quality.",
      "How do you handle tight deadlines?",
      "Explain a time you had to learn a new technology quickly.",
      "What is your approach to code review?",
    ],
  };

  const pool = FALLBACK[role] || FALLBACK['Default'];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(q => ({ questionText: q }));
}

function generateFallbackFeedback(questions, answers) {
  const feedbackDetails = questions.map((q, idx) => {
    const ansObj = answers.find(a => a.questionIndex === idx);
    const text = ansObj ? ansObj.answerText.trim() : '';
    let score = 30;
    let strengths = 'N/A';
    let weaknesses = 'No response provided.';
    let suggestions = 'Try to explain with real-world examples.';

    if (text.length > 80) {
      score = 85;
      strengths = 'Comprehensive response with good detail.';
      weaknesses = 'Could be more concise in places.';
      suggestions = 'Practice structuring answers with STAR method.';
    } else if (text.length > 20) {
      score = 70;
      strengths = 'Clear and direct answer.';
      weaknesses = 'Lacks specific examples or depth.';
      suggestions = 'Add concrete examples from your experience.';
    } else if (text.length > 5) {
      score = 50;
      strengths = 'Attempted to answer.';
      weaknesses = 'Answer is too brief.';
      suggestions = 'Elaborate more — aim for 2-3 minutes per answer.';
    }

    return {
      questionText: q.questionText,
      answerText: text || 'No answer provided.',
      score, strengths, weaknesses, suggestions,
    };
  });

  const avg = Math.round(feedbackDetails.reduce((s, i) => s + i.score, 0) / feedbackDetails.length);

  return {
    technicalScore: Math.min(100, avg + Math.floor(Math.random() * 6) - 3),
    communicationScore: Math.min(100, avg + Math.floor(Math.random() * 8) - 4),
    confidenceScore: Math.min(100, avg + Math.floor(Math.random() * 10) - 5),
    grammarScore: Math.min(100, avg + Math.floor(Math.random() * 4) - 2),
    problemSolvingScore: Math.min(100, avg + Math.floor(Math.random() * 6) - 3),
    averageScore: avg,
    strengths: "Demonstrates understanding of core concepts with reasonable communication.",
    weaknesses: "Some answers lack depth and specific real-world examples.",
    suggestions: "Use the STAR method (Situation, Task, Action, Result) for structured answers.",
    feedbackDetails,
  };
}

module.exports = { generateQuestions, analyzeInterview, transcribeAudio };
