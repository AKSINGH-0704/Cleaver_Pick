import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

const DEFAULT_WEIGHTS = { A: 0.35, V: 0.30, E: 0.25, C: 0.10 };

export function AppProvider({ children }) {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [enabledModels, setEnabledModels] = useState({
    gpt:    true,
    gemini: true,
  });
  const [conversationHistory, setConversationHistory] = useState([]);

  const addToHistory = (prompt, bestModel, bestResponse) => {
    setConversationHistory(prev => [
      ...prev,
      { user: prompt, assistant: bestResponse, model: bestModel },
    ]);
  };

  const clearHistory = () => setConversationHistory([]);

  return (
    <AppContext.Provider value={{
      weights, setWeights,
      enabledModels, setEnabledModels,
      conversationHistory, addToHistory, clearHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
