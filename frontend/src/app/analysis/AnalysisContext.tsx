'use client';
import { createContext, useContext, useState } from 'react';
import type { ExplainResult } from '../types/overwatch';

interface AnalysisContextType {
    selectedIndex: number | null;
    setSelectedIndex: (i: number | null) => void;
    explain: ExplainResult | null;
    setExplain: (e: ExplainResult | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function useAnalysis() {
    const ctx = useContext(AnalysisContext);
    if (!ctx) throw new Error('useAnalysis must be used within provider');
    return ctx;
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [explain, setExplain] = useState<ExplainResult | null>(null);

    return (
        <AnalysisContext.Provider
            value={{ selectedIndex, setSelectedIndex, explain, setExplain }}
        >
            {children}
        </AnalysisContext.Provider>
    );
}
