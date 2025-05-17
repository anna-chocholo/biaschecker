async function analyzeText() {
  const input = document.getElementById('inputText').value;
  const resultBox = document.getElementById('resultBox');
  resultBox.textContent = 'Analyzing...';

  try {
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input })
    });

    const result = await response.json();

    if (result.error) {
      resultBox.textContent = `❌ Error: ${result.detail || result.error}`;
      return;
    }

    const label = result.totalScore?.label || 'N/A';
    const score = result.totalScore?.score ?? 'N/A';
    const confidence = result.confidence || 'Unknown';
    const reasoning = result.reasoning || '⚠️ No reasoning returned';

    resultBox.textContent = `🧠 Overall Bias: ${label} (${score})\n📊 Confidence: ${confidence}\n\n${reasoning}`;
  } catch (error) {
    resultBox.textContent = '❌ Error contacting the backend.';
  }
}document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', analyzeText);
  }
});