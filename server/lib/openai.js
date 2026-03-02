// server/lib/openai.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure your .env has OPENAI_API_KEY
});

module.exports = openai;