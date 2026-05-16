import { useEffect, useState } from 'react';

export function useTypewriter(text, speed = 22, active = true) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!active || !text) {
      setDisplayed(text || '');
      return;
    }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);

  return displayed;
}
