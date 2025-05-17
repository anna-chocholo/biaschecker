function classifyScore(score) {
  if (score <= -0.6) return 'Far-left';
  if (score <= -0.3) return 'Left';
  if (score < -0.1) return 'Center-left';
  if (score < 0.1) return 'Center';
  if (score < 0.3) return 'Center-right';
  if (score < 0.6) return 'Right';
  return 'Far-right';
}

function classifyConfidence(total) {
  if (total < 5) return 'Very low';
  if (total < 10) return 'Low';
  if (total < 20) return 'Medium';
  return 'High';
}

function computeTotalScore(results) {
  let total = 0;
  let count = 0;
  for (const category in results) {
    const { score, hits } = results[category];
    total += score * hits;
    count += hits;
  }
  if (count === 0) return { score: 0, label: 'Neutral' };
  const avg = total / count;
  return { score: parseFloat(avg.toFixed(2)), label: classifyScore(avg) };
}

function scoreBiasByCategory(text, dict) {
  const scores = {};
  const hitCounts = {};
  const matches = {};
  let totalWeighted = 0;
  let totalLeft = 0;
  let totalRight = 0;

  for (const category in dict) {
    scores[category] = { left: 0, right: 0 };
    hitCounts[category] = 0;
    matches[category] = [];

    for (const { term, polarity, intensity } of dict[category]) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const found = [...text.matchAll(regex)];
      const count = found.length;

      if (count > 0) {
        scores[category][polarity] += count * intensity;
        hitCounts[category] += count * intensity;
        if (polarity === 'left') totalLeft += count * intensity;
        if (polarity === 'right') totalRight += count * intensity;
        matches[category].push({ term, count, polarity, intensity });
        totalWeighted += count * intensity;
      }
    }
  }

  const results = {};
  for (const category in scores) {
    const { left, right } = scores[category];
    const total = left + right;
    const score = total === 0 ? 0 : (right - left) / total;
    results[category] = {
      label: classifyScore(score),
      score: parseFloat(score.toFixed(2)),
      hits: hitCounts[category],
      matches: matches[category]
    };
  }

  let annotatedText = text;
  const allMatches = [];
  for (const category in matches) {
    for (const match of matches[category]) {
      allMatches.push({ term: match.term, polarity: match.polarity });
    }
  }

  allMatches.sort((a, b) => b.term.length - a.term.length);
  const used = new Set();
  for (const { term, polarity } of allMatches) {
    if (used.has(term.toLowerCase())) continue;
    used.add(term.toLowerCase());
    const className = polarity === 'left' ? 'bias-left' : 'bias-right';
    const safeTerm = term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${safeTerm})\\b`, 'gi');
    annotatedText = annotatedText.replace(regex, `<span class="${className}">$1</span>`);
  }

  return {
    totalScore: computeTotalScore(results),
    categories: results,
    confidence: classifyConfidence(totalWeighted),
    totalHits: totalWeighted,
    leftHits: totalLeft,
    rightHits: totalRight,
    annotatedText
  };
}

function explainResults(results) {
  if (!results || !results.categories) {
    return '⚠️ No reasoning could be generated.';
  }

  const summary = [];
  for (const [category, data] of Object.entries(results.categories)) {
    if (data.hits > 0) {
      const terms = data.matches.map(m => `“${m.term}”`).slice(0, 5).join(', ');
      summary.push(
        `• ${category} — **${data.label}** (${data.score})\n  → Found: ${terms}`
      );
    }
  }

  const header = `🧠 Overall Bias: ${results.totalScore.label} (${results.totalScore.score})\n📊 Confidence: ${results.confidence}\n📘 Methodology: Weighted average of category scores based on matched terms and their intensities.\n\n🧮 Calculation Summary:\n- ${results.totalHits} total biased term hits\n- Right-leaning terms: ${results.rightHits}\n- Left-leaning terms: ${results.leftHits}`;

  const disclaimer = results.totalHits < 5
    ? '\n\n⚠️ Disclaimer: Fewer than 5 biased terms were found. This evaluation may not be reliable. Try analyzing a longer or more opinionated text.'
    : '';

  return `${header}${disclaimer}\n\n🔍 Category Breakdown:\n\n${summary.join('\n\n')}`;
}

module.exports = {
  scoreBiasByCategory,
  explainResults
};