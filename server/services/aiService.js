const fs = require('fs');
const openai = require('../config/openai');

// Fallback questions to make sure the app works without an OpenAI API Key
const FALLBACK_QUESTIONS = {
  "Frontend Developer": [
    "What are the differences between virtual DOM and real DOM in React?",
    "Explain how the event loop works in JavaScript.",
    "How does CSS specificity work and how do you manage it in large projects?",
    "Explain the concept of closures in JavaScript with an example.",
    "What are React Hooks and what rules must be followed when using them?"
  ],
  "Backend Developer": [
    "What is the event loop in Node.js, and how does it handle asynchronous I/O?",
    "Explain the difference between setImmediate() and process.nextTick() in Node.",
    "How do streams work in Node.js, and what are the main benefits of using them?",
    "Explain the middleware pattern in Express.js and how request/response flow works.",
    "How do you handle relational database transactions vs. non-relational document updates?"
  ],
  "Full Stack Developer": [
    "How do you design a secure and scalable RESTful API?",
    "Explain Cross-Origin Resource Sharing (CORS) and how to handle it securely in Node.js.",
    "What is the difference between SQL and NoSQL databases, and how do you choose between them?",
    "Explain JWT authentication and how to securely store tokens on the frontend.",
    "How do you optimize web application performance on both client and server sides?"
  ],
  "Behavioral": [
    "Tell me about a time you faced a difficult conflict within a team project and how you resolved it.",
    "Describe a situation where you had to quickly learn a new technology to solve a problem.",
    "Tell me about a project that failed or did not go as planned. What did you learn?",
    "How do you prioritize your tasks when working under tight deadlines with multiple deliverables?",
    "Describe a time you went above and beyond your standard duties to deliver a high-quality product."
  ],
  "Default": [
    "Tell me about a challenging project you worked on and how you overcame the technical hurdles.",
    "How do you handle differing opinions within a software development team?",
    "Describe your experience with version control systems and code collaboration tools.",
    "How do you keep your technical skills up-to-date with emerging frameworks and tools?",
    "What is your approach to testing, debugging, and maintaining complex software systems?"
  ]
};

/**
 * Generate interview questions based on candidate specifications
 */
const generateQuestions = async (role, level, type, difficulty, numQuestions = 5) => {
  const count = parseInt(numQuestions) || 5;

  if (!openai) {
    console.log('OpenAI not configured. Returning fallback questions.');
    return getFallbackQuestions(role, type, count);
  }

  try {
    const prompt = `You are a professional HR and Technical Recruiter. Generate a JSON array containing exactly ${count} interview questions for a ${level}-level ${role}.
    The interview type is ${type} (e.g. Technical, Behavioral, HR) and the difficulty is ${difficulty}.
    Each object in the array MUST contain exactly one key: "questionText" (value: string).
    Do not add markdown backticks around the JSON payload; return ONLY valid JSON.
    Example Format:
    [
      {"questionText": "Question 1..."},
      {"questionText": "Question 2..."}
    ]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You generate structured interview questions in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" } // Using structured JSON output
    });

    const content = response.choices[0].message.content.trim();
    // Wrap parse in try/catch in case formatting diverges
    const parsed = JSON.parse(content);
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions.slice(0, count);
    } else if (Array.isArray(parsed)) {
      return parsed.slice(0, count);
    } else if (typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
        return parsed[keys[0]].slice(0, count);
      }
    }
    throw new Error('JSON structure not matching expected array format');
  } catch (error) {
    console.error('Error generating questions with OpenAI:', error.message);
    return getFallbackQuestions(role, type, count);
  }
};

/**
 * Helper to fetch localized fallback questions
 */
function getFallbackQuestions(role, type, count) {
  let questionsPool = [];
  if (type === 'Behavioral' || type === 'HR') {
    questionsPool = FALLBACK_QUESTIONS.Behavioral;
  } else if (role && FALLBACK_QUESTIONS[role]) {
    questionsPool = FALLBACK_QUESTIONS[role];
  } else if (role && role.toLowerCase().includes('front')) {
    questionsPool = FALLBACK_QUESTIONS["Frontend Developer"];
  } else if (role && role.toLowerCase().includes('back')) {
    questionsPool = FALLBACK_QUESTIONS["Backend Developer"];
  } else if (role && (role.toLowerCase().includes('full') || role.toLowerCase().includes('software'))) {
    questionsPool = FALLBACK_QUESTIONS["Full Stack Developer"];
  } else {
    questionsPool = FALLBACK_QUESTIONS.Default;
  }

  // Adjust count to fit pool size or duplicate pool
  const results = [];
  for (let i = 0; i < count; i++) {
    const questionText = questionsPool[i % questionsPool.length];
    results.push({ questionText });
  }
  return results;
}

/**
 * Analyze candidate answers and generate scores and feedback
 */
const analyzeInterview = async (role, level, questions, answers) => {
  if (!openai) {
    console.log('OpenAI not configured. Returning fallback mock feedback.');
    return generateFallbackFeedback(questions, answers);
  }

  try {
    const qAndAPairs = questions.map((q, idx) => {
      const ansObj = answers.find(a => a.questionIndex === idx);
      return {
        questionText: q.questionText,
        answerText: ansObj ? ansObj.answerText : 'No answer provided.'
      };
    });

    const prompt = `You are an expert interviewer and career coach. Review this list of questions and candidate answers for a ${level}-level ${role} interview.
    Evaluate the answers thoroughly and return a valid JSON object containing detailed scores and text feedback.
    
    The JSON structure MUST follow this exact format:
    {
      "technicalScore": 0-100,
      "communicationScore": 0-100,
      "confidenceScore": 0-100,
      "grammarScore": 0-100,
      "problemSolvingScore": 0-100,
      "averageScore": 0-100,
      "strengths": "Overall strengths description.",
      "weaknesses": "Overall areas of improvement.",
      "suggestions": "Overall actionable suggestions.",
      "feedbackDetails": [
        {
          "questionText": "Question string...",
          "answerText": "Answer string...",
          "score": 0-100,
          "strengths": "Feedback on strength of this answer.",
          "weaknesses": "Feedback on weaknesses or omissions in this answer.",
          "suggestions": "How to improve this answer."
        }
      ]
    }
    
    Data to evaluate:
    ${JSON.stringify(qAndAPairs, null, 2)}
    
    Make sure to output valid JSON. Do not enclose it in markdown formatting.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You evaluate candidate responses and return feedback in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content.trim();
    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing interview with OpenAI:', error.message);
    return generateFallbackFeedback(questions, answers);
  }
};

/**
 * Helper to generate synthetic, realistic scores/feedback based on answers
 */
function generateFallbackFeedback(questions, answers) {
  // Let's create smart feedback based on text length of answers
  const feedbackDetails = questions.map((q, idx) => {
    const ansObj = answers.find(a => a.questionIndex === idx);
    const text = ansObj ? ansObj.answerText.trim() : '';
    let score = 30; // base score if blank
    let strengths = 'N/A';
    let weaknesses = 'No response was provided for this question.';
    let suggestions = 'Please try to explain your answer with real-world examples.';

    if (text.length > 5) {
      if (text.length < 20) {
        score = 55;
        strengths = 'Gave a brief answer directly addressing the question.';
        weaknesses = 'The answer is too short and lacks detail, depth, or examples.';
        suggestions = 'Expand on your answers by using the STAR method (Situation, Task, Action, Result) to structure your response.';
      } else if (text.length < 80) {
        score = 75;
        strengths = 'Clear explanation of core concepts and concise wording.';
        weaknesses = 'Could elaborate more on implementation details or personal experience.';
        suggestions = 'Try incorporating specific tools, methodologies, or outcomes from your past projects.';
      } else {
        score = 88;
        strengths = 'Excellent comprehensive response. Provided solid technical depth and situational context.';
        weaknesses = 'Minor structural flow issues or potential for conciseness.';
        suggestions = 'Practice pacing so that your highly detailed answers remain punchy and focused.';
      }
    }

    return {
      questionText: q.questionText,
      answerText: text || 'No answer provided.',
      score,
      strengths,
      weaknesses,
      suggestions
    };
  });

  const avgDetailsScore = Math.round(
    feedbackDetails.reduce((sum, item) => sum + item.score, 0) / feedbackDetails.length
  );

  // Distribute scores naturally around the average
  const technicalScore = Math.max(10, Math.min(100, avgDetailsScore + Math.floor(Math.random() * 6) - 3));
  const communicationScore = Math.max(10, Math.min(100, avgDetailsScore + Math.floor(Math.random() * 8) - 4));
  const confidenceScore = Math.max(10, Math.min(100, avgDetailsScore + Math.floor(Math.random() * 10) - 5));
  const grammarScore = Math.max(10, Math.min(100, avgDetailsScore + Math.floor(Math.random() * 4) - 2));
  const problemSolvingScore = Math.max(10, Math.min(100, avgDetailsScore + Math.floor(Math.random() * 6) - 3));
  const averageScore = Math.round(
    (technicalScore + communicationScore + confidenceScore + grammarScore + problemSolvingScore) / 5
  );

  return {
    technicalScore,
    communicationScore,
    confidenceScore,
    grammarScore,
    problemSolvingScore,
    averageScore,
    strengths: "Demonstrates standard understanding of key concepts. Paces the conversation well and outlines core terms and concepts clearly.",
    weaknesses: "Lacks advanced deep dives in some responses, occasionally giving brief definitions instead of demonstrating structural application.",
    suggestions: "We recommend reviewing detailed architecture patterns, conducting mock interviews, and using the STAR framework to organize responses.",
    feedbackDetails
  };
}

/**
 * Transcribe candidate voice recordings using OpenAI Whisper API
 */
const transcribeAudio = async (filePath) => {
  if (!openai) {
    console.log('OpenAI not configured. Whisper transcription skipped.');
    throw new Error('Whisper API is not configured. Please supply an OPENAI_API_KEY.');
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    });
    return transcription.text;
  } catch (error) {
    console.error('Whisper transcription error:', error.message);
    throw error;
  }
};

module.exports = {
  generateQuestions,
  analyzeInterview,
  transcribeAudio
};
