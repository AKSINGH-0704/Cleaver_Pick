// Simulation engine — derives believable variations from live GPT output.
// Each simulated model applies a unique style transform to the real response
// and jitters the real scores within realistic ranges.

const STYLE_TRANSFORMS = {
  structured: (text) => {
    const paragraphs = text.split('\n\n').filter(Boolean);
    if (paragraphs.length <= 1) {
      // Single paragraph — split by sentences into numbered points
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      if (sentences.length <= 2) return `**Key Point**\n\n${text}`;
      return (
        `**Overview:** ${sentences[0].trim()}\n\n` +
        sentences
          .slice(1)
          .map((s, i) => `**${i + 1}.** ${s.trim()}`)
          .join('\n\n')
      );
    }
    return paragraphs
      .map((p, i) => (i === 0 ? `**Overview**\n\n${p}` : `**${i}.** ${p}`))
      .join('\n\n');
  },

  citation: (text) => {
    // Insert citations after roughly every 20% of the text
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const interval = Math.max(1, Math.floor(sentences.length / 5));
    let citNum = 1;
    const out = sentences.map((s, i) => {
      if (i > 0 && i % interval === 0 && citNum <= 5) {
        return `${s.trim()} [${citNum++}]`;
      }
      return s.trim();
    });
    const sources = [
      '[1] Wikipedia',
      '[2] PubMed / Academic databases',
      '[3] Primary source documents',
      '[4] Reuters / AP News',
      '[5] Encyclopædia Britannica',
    ];
    return out.join(' ') + '\n\n*Sources: ' + sources.slice(0, citNum - 1).join(', ') + '*';
  },

  cautious: (text) => {
    const disclaimers = [
      'I should note that this is a nuanced topic, and the following reflects current understanding. ',
      'This requires careful consideration. Based on available evidence: ',
      'While I aim to be accurate, this topic has meaningful complexity worth acknowledging. ',
    ];
    const disclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];
    const caveat =
      '\n\n*Please verify critical claims with authoritative sources before making important decisions.*';
    return disclaimer + text + caveat;
  },

  concise: (text) => {
    // Take the most information-dense sentences (first 55%)
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (!sentences || sentences.length <= 2) return text;
    const take = Math.max(2, Math.ceil(sentences.length * 0.55));
    return sentences.slice(0, take).join(' ').trim();
  },

  verbose: (text) => {
    const openers = [
      'This is an interesting question that deserves a thorough examination. ',
      'Let me explore this topic from multiple angles to give a complete picture. ',
      'To properly address this, we should consider several factors. ',
    ];
    const opener = openers[Math.floor(Math.random() * openers.length)];
    const extension =
      "\n\nIt's worth noting that while the core answer holds in standard contexts, " +
      'specific circumstances or recent developments may introduce nuances that affect the conclusion.';
    return opener + text + extension;
  },
};

// Apply bounded random jitter to a score value
const jitter = (value, range = 0.08) =>
  Math.min(1, Math.max(0, value + (Math.random() * range * 2 - range)));

// Latency ranges per style (ms) — verbose is slower, concise is faster
const LATENCY_RANGES = {
  structured: [900, 2200],
  citation:   [1100, 2600],
  cautious:   [800, 2000],
  concise:    [500, 1400],
  verbose:    [1200, 3000],
};

/**
 * Given the real GPT output + real score components, produce a simulated
 * entry that matches the shape the backend uses for live models.
 *
 * Scores are jittered around the real values so each simulated model
 * is slightly different, with variation ranges tuned per component:
 *   A (Agreement):    ±6% — models tend to agree similarly
 *   V (Verification): ±10% — factual grounding varies more
 *   E (Evaluation):   ±7% — judge scores are moderately stable
 *   C (Consistency):  ±5% — conversation drift is relatively stable
 */
export function simulateModelResponse(realGptText, realScores, modelConfig) {
  const style = modelConfig.simulationStyle || 'structured';
  const transform = STYLE_TRANSFORMS[style] || ((t) => t);

  const A = jitter(realScores.A ?? 0.7, 0.06);
  const V = jitter(realScores.V ?? 0.6, 0.10);
  const E = jitter(realScores.E ?? 0.7, 0.07);
  const C = jitter(realScores.C ?? 0.8, 0.05);
  const R = A * 0.35 + V * 0.30 + E * 0.25 + C * 0.10;

  const [minLat, maxLat] = LATENCY_RANGES[style] || [800, 2000];
  const latency = minLat + Math.random() * (maxLat - minLat);

  return {
    text: transform(realGptText || 'No live response available to simulate from.'),
    scores: { A, V, E, C, R },
    latency,
    isSimulated: true,
  };
}
