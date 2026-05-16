// Single source of truth for all model metadata.

export const MODEL_ROSTER = [
  // ── TIER 1: LIVE ────────────────────────────────────────────
  {
    id: 'gpt',
    label: 'GPT-4o-mini',
    provider: 'OpenAI',
    tier: 'live',
    brandColor: '#10A37F',
    tagline: 'Fast, capable, widely benchmarked',
    accentGlow: 'rgba(16, 163, 127, 0.25)',
  },
  {
    id: 'gemini',
    label: 'Gemini 2.5 Flash',
    provider: 'Google DeepMind',
    tier: 'live',
    brandColor: '#4285F4',
    tagline: 'Multimodal reasoning at scale',
    accentGlow: 'rgba(66, 133, 244, 0.25)',
  },
  {
    id: 'grok',
    label: 'Grok-2',
    provider: 'xAI',
    tier: 'live',
    brandColor: '#FF6B6B',
    tagline: 'Real-time knowledge, unfiltered',
    accentGlow: 'rgba(255, 107, 107, 0.25)',
  },

  // ── TIER 2: SIMULATED ───────────────────────────────────────
  {
    id: 'deepseek',
    label: 'DeepSeek V3',
    provider: 'DeepSeek AI',
    tier: 'simulated',
    brandColor: '#6C63FF',
    tagline: 'Dense reasoning, code-first',
    accentGlow: 'rgba(108, 99, 255, 0.25)',
    simulationStyle: 'structured',
  },
  {
    id: 'perplexity',
    label: 'Perplexity Sonar',
    provider: 'Perplexity AI',
    tier: 'simulated',
    brandColor: '#20B2AA',
    tagline: 'Citation-heavy, search-grounded',
    accentGlow: 'rgba(32, 178, 170, 0.25)',
    simulationStyle: 'citation',
  },
  {
    id: 'claude',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tier: 'simulated',
    brandColor: '#D4A853',
    tagline: 'Cautious, thorough, nuanced',
    accentGlow: 'rgba(212, 168, 83, 0.25)',
    simulationStyle: 'cautious',
  },
  {
    id: 'mistral',
    label: 'Mistral Large',
    provider: 'Mistral AI',
    tier: 'simulated',
    brandColor: '#FF7043',
    tagline: 'Efficient, European-trained',
    accentGlow: 'rgba(255, 112, 67, 0.25)',
    simulationStyle: 'concise',
  },
  {
    id: 'llama',
    label: 'LLaMA 3.3 70B',
    provider: 'Meta AI',
    tier: 'simulated',
    brandColor: '#1877F2',
    tagline: 'Open-weight, community-verified',
    accentGlow: 'rgba(24, 119, 242, 0.25)',
    simulationStyle: 'verbose',
  },
];

export const MODEL_MAP = Object.fromEntries(MODEL_ROSTER.map((m) => [m.id, m]));

export const getModel = (id) => MODEL_MAP[id] || null;
export const liveModels = MODEL_ROSTER.filter((m) => m.tier === 'live');
export const simulatedModels = MODEL_ROSTER.filter((m) => m.tier === 'simulated');

export const MODEL_LABELS = Object.fromEntries(
  MODEL_ROSTER.map((m) => [m.id, m.label]),
);
export const MODEL_COLORS = Object.fromEntries(
  MODEL_ROSTER.map((m) => [m.id, m.brandColor]),
);

export const DOMAINS = [
  { id: 'general',    label: 'General',    weights: { A: 0.35, V: 0.30, E: 0.25, C: 0.10 } },
  { id: 'medical',    label: 'Medical',    weights: { A: 0.25, V: 0.45, E: 0.20, C: 0.10 } },
  { id: 'legal',      label: 'Legal',      weights: { A: 0.30, V: 0.40, E: 0.20, C: 0.10 } },
  { id: 'research',   label: 'Research',   weights: { A: 0.30, V: 0.35, E: 0.25, C: 0.10 } },
  { id: 'code',       label: 'Code',       weights: { A: 0.40, V: 0.15, E: 0.35, C: 0.10 } },
  { id: 'creative',   label: 'Creative',   weights: { A: 0.45, V: 0.10, E: 0.30, C: 0.15 } },
  { id: 'analytical', label: 'Analytical', weights: { A: 0.35, V: 0.30, E: 0.25, C: 0.10 } },
];
