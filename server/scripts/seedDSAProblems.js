require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const DSAProblem = require('../models/DSAProblem');

const COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple',
  'Netflix', 'Uber', 'Adobe', 'Airbnb', 'LinkedIn',
  'Salesforce', 'Oracle', 'IBM', 'Intel', 'Nvidia',
  'Qualcomm', 'Cisco', 'VMware', 'Snap', 'Pinterest',
  'Spotify', 'Stripe', 'PayPal', 'Visa', 'Mastercard',
  'Goldman Sachs', 'Morgan Stanley', 'J.P. Morgan', 'Bank of America', 'Citadel',
  'Two Sigma', 'Jane Street', 'Bloomberg', 'Palantir Technologies', 'Databricks',
  'Snowflake', 'MongoDB', 'Atlassian', 'Shopify', 'DoorDash',
  'Instacart', 'Robinhood', 'Coinbase', 'Reddit', 'TikTok',
  'ByteDance', 'Roblox', 'Zoom', 'Dropbox', 'Box',
  'Twilio', 'Splunk', 'ServiceNow', 'Workday', 'Docusign',
  'Palo Alto Networks', 'CrowdStrike', 'Asana', 'Walmart Labs', 'Flipkart',
];

const REPO_BASE = 'https://raw.githubusercontent.com/liquidslr/interview-company-wise-problems/main';
const CSV_FILE = '5. All.csv';
const DELAY_MS = 300;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedCompany(company) {
  const encodedCompany = encodeURIComponent(company);
  const encodedFile = encodeURIComponent(CSV_FILE);
  const url = `${REPO_BASE}/${encodedCompany}/${encodedFile}`;

  try {
    const { data } = await axios.get(url);
    const rows = parse(data, { columns: true, skip_empty_lines: true });

    let savedCount = 0;
    for (const row of rows) {
      const title = row['Title']?.trim();
      if (!title) continue;

      const topics = row['Topics']
        ? row['Topics'].split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await DSAProblem.findOneAndUpdate(
        { title },
        {
          $addToSet: { companies: company },
          $set: {
            difficulty: (row['Difficulty'] || '').charAt(0).toUpperCase()
              + (row['Difficulty'] || '').slice(1).toLowerCase(),
            leetcodeLink: row['Link'],
            frequency: parseFloat(row['Frequency']) || 0,
            topics,
          },
        },
        { upsert: true, new: true }
      );
      savedCount += 1;
    }
    console.log(`✅ ${company}: ${savedCount} problems seeded (out of ${rows.length} rows read)`);
  } catch (err) {
    console.error(`❌ ${company} FAILED:`, err.response?.status || err.message);
  }
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB. Seeding ${COMPANIES.length} companies...\n`);

  for (const c of COMPANIES) {
    await seedCompany(c);
    await sleep(DELAY_MS);
  }

  console.log('\nSeeding done. Ab har problem mein "description" field manually add karna hai.');
  process.exit(0);
})();
