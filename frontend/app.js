document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const url = document.getElementById('urlInput').value;
    const resultBox = document.getElementById('resultBox');
    resultBox.textContent = 'Analyzing...';
  
    try {
      const res = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.reasoning) {
        resultBox.textContent = data.reasoning;
      } else {
        resultBox.textContent = 'Error: No reasoning returned';
      }
    } catch (err) {
      resultBox.textContent = 'Failed to analyze article.';
    }
  });