import MetricBar from './MetricBar';

// Judge rubric: accuracy, relevance, completeness, clarity (all 0..1 or 0..100)
const RUBRIC = [
  { key: 'accuracy',     label: 'Accuracy' },
  { key: 'relevance',    label: 'Relevance' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'clarity',      label: 'Clarity' },
];

function normalize(v) {
  if (v == null) return 0;
  return v > 1 ? v / 100 : v;
}

export default function EvalRubricBars({ scores = {}, compact = false, stagger = 0.06 }) {
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      {RUBRIC.map((r, i) => (
        <MetricBar
          key={r.key}
          label={r.label}
          value={normalize(scores[r.key])}
          delay={i * stagger}
          compact={compact}
        />
      ))}
    </div>
  );
}
