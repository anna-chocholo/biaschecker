console.log('💥 This is the NEW server.js you’re running 💥');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const biasDict = require('./categorized_bias_dictionary.json');
const { scoreBiasByCategory, explainResults } = require('./bias_scoring_with_categories');

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Bias Checker is running!');
});

app.post('/api/analyze', (req, res) => {
  try {
    const { text } = req.body;
    console.log('📩 Received text:', text?.slice(0, 200));

    if (!text || text.trim().length < 20) {
      throw new Error('No text provided or text too short');
    }

    const result = scoreBiasByCategory(text.toLowerCase(), biasDict);
    const reasoning = explainResults(result);
    res.json({ ...result, reasoning });
  } catch (err) {
    console.error('❌ Analysis error:', err.message);
    console.error(err.stack);
    res.status(400).json({
      error: 'Failed to analyze the text.',
      detail: err.message
    });
  }
});

app.post('/api/gpt-summary', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 20) {
      throw new Error('No text provided or text too short');
    }

    const biasResult = scoreBiasByCategory(text.toLowerCase(), biasDict);
    const reasoning = explainResults(biasResult);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `This article was analyzed for political bias. Here is the result:\n\n${reasoning}\n\nPlease summarize what kind of bias this article contains, how it might influence readers, and how a more balanced version could be written.`
        }
      ]
    });

    const gptReply = response.choices[0].message.content;
    res.json({ summary: gptReply });
  } catch (err) {
    console.error('❌ GPT summary error:', err.message);
    res.status(500).json({
      error: 'Failed to generate GPT summary.',
      detail: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Bias Checker running at http://localhost:${PORT}`);
});