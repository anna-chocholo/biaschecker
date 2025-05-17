require('dotenv').config();
const OpenAI = require('openai');
const { scoreBiasByCategory, explainResults } = require('./bias_scoring_with_categories');
const biasDict = require('./categorized_bias_dictionary.json');

// SETUP GPT CLIENT (v4+ syntax)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🧪 Example article text to analyze
const inputText = `
Critics argue that the new tax policy is yet another giveaway to corporate elites,
while defenders claim it stimulates growth for hardworking Americans.
Environmental groups slammed the rollback of regulations as catering to polluters.
`;

async function analyzeWithGPT(text) {
  // Run bias check
  const biasResult = scoreBiasByCategory(text.toLowerCase(), biasDict);
  const reasoning = explainResults(biasResult);

  console.log('📊 BIAS REPORT:\n');
  console.log(reasoning);
  console.log('\n💬 Asking GPT to summarize it...\n');

  // Ask GPT to summarize and reflect
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `This article was analyzed for political bias. Here is the result:\n\n${reasoning}\n\nPlease summarize what kind of bias this article contains, how it might influence readers, and how a more balanced version could be written.`
    }]
  });

  const gptReply = response.choices[0].message.content;
  console.log("🤖 GPT's summary:\n");
  console.log(gptReply);
}

// Run the function
analyzeWithGPT(inputText);
