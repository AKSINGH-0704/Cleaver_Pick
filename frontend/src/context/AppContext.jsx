import { createContext, useContext, useState, useMemo } from 'react';
import { MODEL_ROSTER, DOMAINS } from '../utils/modelConfigs';

const AppContext = createContext(null);

const DEFAULT_WEIGHTS = { A: 0.35, V: 0.30, E: 0.25, C: 0.10 };

// All 8 models enabled by default
const DEFAULT_ENABLED = Object.fromEntries(MODEL_ROSTER.map((m) => [m.id, true]));

export function AppProvider({ children }) {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [domain, setDomain] = useState('general');
  const [enabledModels, setEnabledModels] = useState(DEFAULT_ENABLED);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Derived: domain-specific weights override
  const domainWeights = useMemo(() => {
    const d = DOMAINS.find((dd) => dd.id === domain);
    return d?.weights || DEFAULT_WEIGHTS;
  }, [domain]);

  const addToHistory = (prompt, bestModel, bestResponse) => {
    setConversationHistory((prev) => [
      ...prev,
      { user: prompt, assistant: bestResponse, model: bestModel, timestamp: Date.now() },
    ]);
  };

  const clearHistory = () => setConversationHistory([]);

  const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });
  const resetModels = () => setEnabledModels({ ...DEFAULT_ENABLED });

  // Convenience: list of enabled model IDs
  const activeModelIds = useMemo(
    () => MODEL_ROSTER.filter((m) => enabledModels[m.id]).map((m) => m.id),
    [enabledModels],
  );

  return (
    <AppContext.Provider
      value={{
        // Weights
        weights,
        setWeights,
        resetWeights,
        domainWeights,

        // Domain
        domain,
        setDomain,

        // Models
        enabledModels,
        setEnabledModels,
        resetModels,
        activeModelIds,

        // Conversation
        conversationHistory,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
