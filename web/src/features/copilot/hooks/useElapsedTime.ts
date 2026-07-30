import { useEffect, useState } from 'react';

/**
 * Ticks a live elapsed-seconds value while `startedAt` is set, for showing
 * "Thinking... 3.2s" style indicators. Returns 0 when `startedAt` is null.
 */
export function useElapsedTime(startedAt: number | null): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedMs(0);
      return;
    }

    setElapsedMs(Date.now() - startedAt);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsedMs / 1000;
}

export default useElapsedTime;
