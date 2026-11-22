import { useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? initialValue : JSON.parse(saved);
    } catch {
      return initialValue;
    }
  });

  const saveValue = (nextValue) => {
    setValue((oldValue) => {
      const valueToStore = typeof nextValue === 'function' ? nextValue(oldValue) : nextValue;
      localStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  };
  return [value, saveValue];
}
