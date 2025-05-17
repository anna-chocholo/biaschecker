require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const biasDict = require('./categorized_bias_dictionary.json');
const { scoreBiasByCategory, explainResults } = require('./bias_scoring_with_categories');

const dotenv = require('dotenv');
dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function extractSentenceContext(text, term) {
  const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
  return sentences.find(s => s.toLowerCase().includes(term.toLowerCase())) || '';
}

async function analyzeContextualBias(text, matchedTerms) {
  const results = [];

  for (const { term } of matchedTerms) {
    const context = extractSentenceContext(text, term);

    const prompt = `Is the phrase \"${term}\" used in a politically biased way in this sentence: \"${context}\"?\nPlease respond \"Yes\" or \"No\" and explain briefly why.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      });

      const gptReply = response.choices[0].message.content.trim();
      const isBiased = /^yes/i.test(gptReply);

      results.push({ term, context, isBiased, gptReply });
    } catch (error) {
      console.error(`GPT error on term: ${term}`, error.message);
      results.push({ term, context, isBiased: null, gptReply: '❌ GPT error' });
    }
  }

  return results;
}

app.get('/', (req, res) => {
  res.send('✅ Bias Checker is running!');
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    console.log('📩 Received text:', text?.slice(0, 200));

    if (!text || text.trim().length < 20) {
      throw new Error('No text provided or text too short');
    }

    const result = scoreBiasByCategory(text.toLowerCase(), biasDict);
    const reasoning = explainResults(result);

    const allMatches = [];
    for (const cat of Object.values(result.categories)) {
      allMatches.push(...cat.matches);
    }

    const contextChecks = await analyzeContextualBias(text, allMatches);

    res.json({ ...result, reasoning, contextChecks });
  } catch (err) {
    console.error('❌ Analysis error:', err.message);
    console.error(err.stack);
    res.status(400).json({ error: 'Failed to analyze the text.', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Bias Checker running at http://localhost:${PORT}`);
});