import { scoreColor } from '../utils/colors';

const CARDS = [
  { key: 'agreement',    letter: 'A', label: 'Agreement',    desc: 'Cross-model similarity' },
  { key: 'verification', letter: 'V', label: 'Verification', desc: 'Facts vs Wikipedia' },
  { key: 'evaluation',   letter: 'E', label: 'Evaluation',   desc: 'LLM judge rubric' },
  { key: 'consistency',  letter: 'C', label: 'Consistency',  desc: 'Context drift score' },
];

export default function ScoreBreakdown({ components }) {
  if (!components) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {CARDS.map(({ key, letter, label, desc }) => {
        const comp = components[key];
        if (!comp) return null;
        const color = scoreColor(comp.value);
        return (
          <div key={key} className="glass-card p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-space text-[#475569] uppercase tracking-widest">{letter}</span>
              <span className="text-[10px] text-[#475569] font-mono">{(comp.weight * 100).toFixed(0)}%</span>
            </div>
            <div className="text-2xl font-mono font-bold" style={{ color }}>
              {(comp.value * 100).toFixed(0)}
            </div>
            <div className="text-xs font-medium text-[#94A3B8]">{label}</div>
            <div className="text-[10px] text-[#475569]">{desc}</div>
          </div>
        );
      })}
    </div>
  );
}
