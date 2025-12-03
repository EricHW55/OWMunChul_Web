'use client';

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import type {
    PlayerPrediction,
    ExplainResult,
} from '../types/overwatch';

import { explainPlayer } from '../lib/api';

interface AnalysisContextValue {
    players: PlayerPrediction[];
    setPlayers: (players: PlayerPrediction[]) => void;

    selectedIndex: number | null;
    setSelectedIndex: (i: number | null) => void;

    explain: ExplainResult | null;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
    const [players, setPlayers] = useState<PlayerPrediction[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [explain, setExplain] = useState<ExplainResult | null>(null);

    // 🔹 player_index → ExplainResult 캐시
    const explainCache = useRef<Map<number, ExplainResult>>(new Map());

    // 새 이미지를 업로드해서 players가 바뀌면 캐시/선택 초기화
    useEffect(() => {
        explainCache.current.clear();
        setSelectedIndex(null);
        setExplain(null);
    }, [players]);

    // 선택된 인덱스가 바뀔 때 /explain 호출 or 캐시 사용
    useEffect(() => {
        if (selectedIndex == null) {
            setExplain(null);
            return;
        }

        // 1) 이미 받아놓은 값 있으면 그걸 사용
        const cached = explainCache.current.get(selectedIndex);
        if (cached) {
            setExplain(cached);
            return;
        }

        // 2) 없으면 서버에서 가져오기
        let cancelled = false;

        (async () => {
            try {
                const data = await explainPlayer(selectedIndex);
                if (!cancelled) {
                    explainCache.current.set(selectedIndex, data);
                    setExplain(data);
                }
            } catch (err) {
                console.error('explainePlayer error', err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedIndex]);

    const value: AnalysisContextValue = {
        players,
        setPlayers,
        selectedIndex,
        setSelectedIndex,
        explain,
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
        throw new Error('useAnalysis must be used within AnalysisProvider');
    }
    return ctx;
}
