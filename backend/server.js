const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const cors = require('cors');
const biasDict = require('./categorized_bias_dictionary.json');
const {
  scoreBiasByCategory,
  explainResults,
} = require('./bias_scoring_with_categories');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

async function fetchArticleText(url) {
  const { data: html } = await axios.get(url);
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent.toLowerCase();
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    const text = await fetchArticleText(url);
    const result = scoreBiasByCategory(text, biasDict);
    const reasoning = explainResults(result);
    res.json({ ...result, reasoning });
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze the article.', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Bias Checker API is running at http://localhost:${PORT}`);
});