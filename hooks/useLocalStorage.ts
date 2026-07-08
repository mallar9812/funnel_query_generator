'use client';
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setState(JSON.parse(item) as T);
      }
    } catch {
      // ignore parse errors
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof value === 'function'
          ? (value as (p: T) => T)(prev)
          : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore write errors
        }
        return next;
      });
    },
    [key],
  );

  return [state, setValue];
}
