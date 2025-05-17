
// Load the categorized bias dictionary (must be fetched or imported first)
let categorizedBiasDict = {}; // Replace with actual dictionary from fetch or import

// Flatten the dictionary into a single list for scanning
function flattenBiasTerms(dict) {
  return Object.values(dict).flat();
}

// Extract text from the article
function getTextContent() {
  return document.body.innerText.toLowerCase();
}

// Score bias by scanning for terms and aggregating weighted counts
function scoreBiasByCategory(text, dict) {
  const scores = {};
  const hitCounts = {};
  let totalWeighted = 0;

  for (const category in dict) {
    scores[category] = { left: 0, right: 0 };
    hitCounts[category] = 0;

    for (const { term, polarity, intensity } of dict[category]) {
      const regex = new RegExp(`\\b${term}\\b`, "gi");
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        scores[category][polarity] += count * intensity;
        hitCounts[category] += count * intensity;
        totalWeighted += count * intensity;
      }
    }
  }

  const results = {};

  for (const category in scores) {
    const left = scores[category].left;
    const right = scores[category].right;
    const total = left + right;

    const score = total === 0 ? 0 : (right - left) / total;
    const label = classifyScore(score);

    results[category] = {
      label,
      score: parseFloat(score.toFixed(2)),
      hits: hitCounts[category]
    };
  }

  return {
    totalScore: computeTotalScore(results),
    categories: results,
    confidence: classifyConfidence(totalWeighted)
  };
}

// Map score to political bias label
function classifyScore(score) {
  if (score <= -0.6) return "Far-left";
  if (score <= -0.3) return "Left";
  if (score < -0.1) return "Center-left";
  if (score < 0.1) return "Center";
  if (score < 0.3) return "Center-right";
  if (score < 0.6) return "Right";
  return "Far-right";
}

// Classify confidence based on weighted term total
function classifyConfidence(totalWeighted) {
  if (totalWeighted < 10) return "Low";
  if (totalWeighted < 20) return "Medium";
  return "High";
}

// Compute weighted average bias score across all categories
function computeTotalScore(results) {
  let total = 0;
  let count = 0;

  for (const cat in results) {
    const s = results[cat].score;
    const h = results[cat].hits;
    total += s * h;
    count += h;
  }

  if (count === 0) return { score: 0, label: "Neutral" };

  const avgScore = total / count;
  return {
    score: parseFloat(avgScore.toFixed(2)),
    label: classifyScore(avgScore)
  };
}

// Main function: analyze article bias with categories
function analyzeArticleBiasWithCategories(dict) {
  const text = getTextContent();
  return scoreBiasByCategory(text, dict);
}
