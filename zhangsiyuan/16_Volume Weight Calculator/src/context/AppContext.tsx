"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CargoItem, CargoResult, Totals, calculateAll, calculateTotals } from '@/lib/calculations';

interface AppContextType {
  items: CargoItem[];
  dimUnit: string;
  weightUnit: string;
  language: string;
  divisor: number;
  freightMode: string;
  results: CargoResult[];
  totals: Totals;
  addItem: (item: CargoItem) => void;
  removeItem: (id: string) => void;
  setDimUnit: (u: string) => void;
  setWeightUnit: (u: string) => void;
  setLanguage: (l: string) => void;
  setDivisor: (d: number) => void;
  setFreightMode: (m: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MODE_DIVISORS: Record<string, number> = { air: 6000, express: 5000 };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CargoItem[]>([]);
  const [dimUnit, setDimUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [language, setLanguage] = useState('zh');
  const [freightMode, setFreightModeState] = useState('air');
  const [divisor, setDivisorState] = useState(6000);

  const results = calculateAll(items, dimUnit, weightUnit, divisor);
  const totals = calculateTotals(results);

  const addItem = useCallback((item: CargoItem) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  }, []);

  const setFreightMode = useCallback((mode: string) => {
    setFreightModeState(mode);
    if (mode !== 'custom') setDivisorState(MODE_DIVISORS[mode] ?? 6000);
  }, []);

  const setDivisor = useCallback((d: number) => {
    setDivisorState(d > 0 ? d : 6000);
  }, []);

  return (
    <AppContext.Provider value={{
      items, dimUnit, weightUnit, language, divisor, freightMode,
      results, totals,
      addItem, removeItem,
      setDimUnit, setWeightUnit, setLanguage, setDivisor, setFreightMode,
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
