import { MODEL_COLORS as BRAND_COLORS, MODEL_LABELS as BRAND_LABELS } from './modelConfigs';

export function scoreColor(score) {
  if (score == null) return '#94A3B8';
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

export const MODEL_COLORS = BRAND_COLORS;
export const MODEL_LABELS = BRAND_LABELS;

export function getValue(raw) {
  if (raw == null) return 0;
  return typeof raw === 'object' ? raw.value ?? 0 : raw;
}
