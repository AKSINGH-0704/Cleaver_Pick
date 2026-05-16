import { useEffect, useState } from 'react';
import { simulatedModels } from '../utils/modelConfigs';
import { simulateModelResponse } from '../utils/simulateModels';

// Normalizes backend `best_score.components` which may come in two shapes:
//   { A: { value: 0.82 }, V: { value: 0.75 }, ... }   OR
//   { A: 0.82, V: 0.75, ... }
function normalizeScores(components) {
  if (!components) return { A: 0.7, V: 0.6, E: 0.7, C: 0.8 };
  // Backend may send either short keys (A/V/E/C) or long keys (agreement/verification/evaluation/consistency)
  const get = (shortKey, longKey) => {
    const raw = components[shortKey] ?? components[longKey];
    if (raw == null) return 0.7;
    return typeof raw === 'object' ? (raw.value ?? 0.7) : raw;
  };
  return {
    A: get('A', 'agreement'),
    V: get('V', 'verification'),
    E: get('E', 'evaluation'),
    C: get('C', 'consistency'),
  };
}

function rFromScores(s) {
  return s.A * 0.35 + s.V * 0.30 + s.E * 0.25 + s.C * 0.10;
}

// Merges live backend result with simulated variations into a unified,
// R-sorted array ready for ModelArenaGrid.
export function useModelSimulation(liveResult, enabledSimulated = true) {
  const [allModels, setAllModels] = useState([]);

  useEffect(() => {
    if (!liveResult) {
      setAllModels([]);
      return;
    }

    const realEntries = (liveResult.all_models || []).map((m) => ({
      model: m.model,
      response: m.response,
      composite: m.composite,
      evaluation: m.evaluation,
      verification: m.verification,
      isSimulated: false,
    }));

    const realGptText =
      realEntries.find((m) => m.model === 'gpt')?.response ||
      realEntries[0]?.response ||
      '';
    const realScores = normalizeScores(liveResult.best_score?.components);

    const simEntries = enabledSimulated
      ? simulatedModels.map((cfg, i) => {
          const sim = simulateModelResponse(realGptText, realScores, cfg);
          return {
            model: cfg.id,
            response: sim.text,
            composite: {
              R: sim.scores.R,
              components: {
                A: { value: sim.scores.A, label: 'Accuracy' },
                V: { value: sim.scores.V, label: 'Verification' },
                E: { value: sim.scores.E, label: 'Evaluation' },
                C: { value: sim.scores.C, label: 'Consistency' },
              },
              label: 'Simulated',
            },
            latency: sim.latency,
            isSimulated: true,
            revealDelay: (realEntries.length + i) * 400,
          };
        })
      : [];

    const merged = [...realEntries, ...simEntries];
    merged.sort((a, b) => (b.composite?.R || 0) - (a.composite?.R || 0));
    setAllModels(merged);
  }, [liveResult, enabledSimulated]);

  return allModels;
}

export { normalizeScores, rFromScores };
