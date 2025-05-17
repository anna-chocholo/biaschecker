console.log('💥 This is the NEW server.js you’re running 💥');
const express = require('express');
const cors = require('cors');
const biasDict = require('./categorized_bias_dictionary.json');
const { scoreBiasByCategory, explainResults } = require('./bias_scoring_with_categories');

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

app.listen(PORT, () => {
  console.log(`🚀 Bias Checker running at http://localhost:${PORT}`);
});
