import { motion } from 'framer-motion';

const STAGES = [
  { id: 0, label: 'Intent' },
  { id: 1, label: 'Dispatch' },
  { id: 2, label: 'Agreement' },
  { id: 3, label: 'Verify' },
  { id: 4, label: 'Evaluate' },
  { id: 5, label: 'Consist.' },
  { id: 6, label: 'Score' },
];

export default function PipelineProgress({ progress, loading }) {
  const currentStage = progress?.stage ?? -1;
  const message = progress?.message ?? '';
  const pct = progress?.progress ?? 0;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Stage dots + connectors */}
      <div className="flex items-center">
        {STAGES.map((stage, idx) => {
          const done = currentStage > stage.id;
          const active = currentStage === stage.id && loading;
          return (
            <div key={stage.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {idx > 0 && (
                  <div
                    className="flex-1 h-px transition-colors duration-500"
                    style={{ backgroundColor: done ? '#06D6A0' : 'rgba(255,255,255,0.06)' }}
                  />
                )}
                <motion.div
                  animate={active ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                  transition={{ repeat: active ? Infinity : 0, duration: 0.9 }}
                  className="w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-400"
                  style={{
                    backgroundColor: done
                      ? '#06D6A0'
                      : active
                      ? '#FFB627'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: active ? '0 0 8px #FFB627' : done ? '0 0 4px rgba(6,214,160,0.4)' : 'none',
                  }}
                />
                {idx < STAGES.length - 1 && (
                  <div
                    className="flex-1 h-px transition-colors duration-500"
                    style={{ backgroundColor: done ? '#06D6A0' : 'rgba(255,255,255,0.06)' }}
                  />
                )}
              </div>
              <span className="text-[9px] text-[#475569] font-mono mt-1.5 text-center">{stage.label}</span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#06D6A0]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Status message */}
      {message && (
        <p className="text-xs text-[#94A3B8] font-mono text-center truncate">{message}</p>
      )}
    </div>
  );
}
