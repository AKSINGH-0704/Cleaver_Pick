import { useState, useCallback } from 'react';
import { API_URL } from '../utils/api';

export function useSSE() {
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const evaluate = useCallback(async (prompt, domain, history = [], customWeights = null) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setProgress({ stage: 0, message: 'Starting evaluation...', progress: 0 });

    try {
      const response = await fetch(`${API_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          domain,
          conversation_history: history,
          custom_weights: customWeights,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === 'result' || data.best_model) {
                setResult(data);
              } else if (currentEvent === 'error') {
                setError(data.message || 'Pipeline error');
              } else {
                setProgress(data);
              }
            } catch { /* skip unparseable lines */ }
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
    setLoading(false);
  }, []);

  return { evaluate, progress, result, loading, error, reset };
}
