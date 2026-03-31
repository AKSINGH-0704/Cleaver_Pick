export function scoreColor(score) {
  if (score >= 0.75) return '#06D6A0';
  if (score >= 0.50) return '#FFB627';
  return '#EF476F';
}

export function scoreLabel(score) {
  if (score >= 0.75) return 'High Reliability';
  if (score >= 0.50) return 'Moderate';
  return 'Low — Review Needed';
}

export function statusColor(status) {
  switch (status) {
    case 'verified':  return '#06D6A0';
    case 'partial':   return '#FFB627';
    case 'not_found': return '#EF476F';
    default:          return '#94A3B8';
  }
}

export const MODEL_COLORS = {
  gpt:    '#10A37F',  // OpenAI green
  gemini: '#4285F4',  // Google blue
};

export const MODEL_LABELS = {
  gpt:    'GPT-4o-mini',
  gemini: 'Gemini 2.5 Flash',
};
