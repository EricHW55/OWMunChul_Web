// src/app/analysis/AnalysisContext.tsx
'use client';

import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
} from 'react';
import type {
    PlayerPrediction,
    ExplainResult,
} from '../types/overwatch';

type AnalysisContextType = {
    players: PlayerPrediction[] | null;
    setPlayers: (players: PlayerPrediction[] | null) => void;

    selectedIndex: number | null;
    setSelectedIndex: (idx: number | null) => void;

    explain: ExplainResult | null;
    setExplain: (data: ExplainResult | null) => void;

    llmSummary: string | null;
    setLlmSummary: (summary: string | null) => void;

    loadingExplain: boolean;
    setLoadingExplain: (loading: boolean) => void;
    loadingLlm: boolean;
    setLoadingLlm: (loading: boolean) => void;

    selectPlayer: (idx: number) => void;

    // 캐시 접근용
    llmCache: Record<number, string>;
    updateLlmCache: (idx: number, summary: string) => void;
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(
    undefined,
);

export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [players, setPlayers] = useState<PlayerPrediction[] | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [explain, setExplain] = useState<ExplainResult | null>(null);
    const [llmSummary, setLlmSummary] = useState<string | null>(null);

    const [loadingExplain, setLoadingExplain] = useState(false);
    const [loadingLlm, setLoadingLlm] = useState(false);

    // [핵심] LLM 응답을 저장할 캐시 객체 (인덱스: 요약문)
    const [llmCache, setLlmCache] = useState<Record<number, string>>({});

    const selectPlayer = (idx: number) => {
        // 같은 영웅을 다시 누른 경우 무시하고 싶다면 여기서 처리 가능하나,
        // 보통은 그냥 다시 렌더링해도 무방함.
        if (selectedIndex === idx) return;

        setSelectedIndex(idx);

        // 설명/요약 화면 초기화 (로딩 효과를 위해)
        setExplain(null);
        setLlmSummary(null);
    };

    const updateLlmCache = (idx: number, summary: string) => {
        setLlmCache((prev) => ({ ...prev, [idx]: summary }));
    };

    const value: AnalysisContextType = {
        players,
        setPlayers,
        selectedIndex,
        setSelectedIndex,
        explain,
        setExplain,
        llmSummary,
        setLlmSummary,
        loadingExplain,
        setLoadingExplain,
        loadingLlm,
        setLoadingLlm,
        selectPlayer,
        llmCache,
        updateLlmCache,
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
}

export function useAnalysis() {
    const ctx = useContext(AnalysisContext);
    if (!ctx) {
        throw new Error(
            'useAnalysis는 AnalysisProvider 안에서만 사용할 수 있습니다.',
        );
    }
    return ctx;
}