import { useEffect, useState, useCallback } from 'react';
import { SALES_REPS } from '../utils/assignments';

const STORAGE_KEY = 'current_rep';
const EVENT = 'current_rep_changed';

/**
 * useCurrentRep — المندوب الحالي الشغال على النظام
 * default = أول واحد في SALES_REPS
 */
export default function useCurrentRep() {
  const [rep, setRep] = useState(() => {
    if (typeof window === 'undefined') return SALES_REPS[0];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && SALES_REPS.includes(stored)) return stored;
    } catch (_) {}
    return SALES_REPS[0];
  });

  useEffect(() => {
    const sync = (e) => {
      if (e?.detail) setRep(e.detail);
      else {
        try {
          const v = window.localStorage.getItem(STORAGE_KEY);
          if (v) setRep(v);
        } catch (_) {}
      }
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const changeRep = useCallback((newRep) => {
    if (!SALES_REPS.includes(newRep)) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, newRep);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: newRep }));
    } catch (_) {}
    setRep(newRep);
  }, []);

  return [rep, changeRep];
}
