const { OpenAI } = require('openai');

const apiKey = process.env.OPENAI_API_KEY || '';

// Create instance. If apiKey is missing, we still initialize, but we'll use fallback checks
// when making actual API calls to avoid throwing errors on app boot.
const openai = apiKey ? new OpenAI({ apiKey }) : null;

if (!openai) {
  console.warn('Warning: OPENAI_API_KEY is not defined. AI functionality will operate in mock mode.');
}

module.exports = openai;
