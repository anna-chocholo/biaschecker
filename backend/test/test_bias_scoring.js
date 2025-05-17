const { scoreBiasByCategory, explainResults } = require('../bias_scoring_with_categories');
const biasDict = require('../categorized_bias_dictionary.json');

describe('Bias Scoring System', () => {
  const testCases = [
    {
      name: 'Neutral text',
      text: 'The weather is nice today.',
      expected: {
        overall: {
          score: 0,
          label: 'Neutral',
          confidence: 'Low'
        }
      }
    },
    {
      name: 'Right-leaning text',
      text: 'The woke left-wing mob is destroying our family values.',
      expected: {
        overall: {
          score: 1,
          label: 'Strongly Right',
          confidence: 'High'
        },
        categories: {
          culture: {
            score: 1,
            label: 'Strongly Right',
            hits: 3
          }
        }
      }
    },
    {
      name: 'Left-leaning text',
      text: 'Progressive policies are essential for social justice.',
      expected: {
        overall: {
          score: -1,
          label: 'Strongly Left',
          confidence: 'High'
        },
        categories: {
          politics: {
            score: -1,
            label: 'Strongly Left',
            hits: 2
          }
        }
      }
    }
  ];

  testCases.forEach(({ name, text, expected }) => {
    it(`should correctly score ${name}`, () => {
      const result = scoreBiasByCategory(text.toLowerCase(), biasDict);
      const explanation = explainResults(result);

      // Check overall score
      expect(explanation.overall.score).toBeCloseTo(expected.overall.score, 2);
      expect(explanation.overall.label).toBe(expected.overall.label);
      expect(explanation.overall.confidence).toBe(expected.overall.confidence);

      // Check category scores if present
      if (expected.categories) {
        Object.keys(expected.categories).forEach(category => {
          expect(explanation.categories[category]).toBeDefined();
          expect(explanation.categories[category].score).toBeCloseTo(
            expected.categories[category].score,
            2
          );
          expect(explanation.categories[category].label).toBe(
            expected.categories[category].label
          );
          expect(explanation.categories[category].hits).toBe(
            expected.categories[category].hits
          );
        });
      }
    });
  });
});