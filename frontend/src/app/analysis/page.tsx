'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { predictFromImage, explainPlayer } from '../lib/api';
import type { PredictionResult } from '../types/overwatch';
import { AnalysisProvider, useAnalysis } from './AnalysisContext';
import GraphSection from './components/GraphSection';
import HeroDetail from './components/HeroDetail';
import styles from './page.module.css';

function AnalysisContainer() {
    const router = useRouter();
    const [result, setResult] = useState<PredictionResult | null>(null);
    const { selectedIndex, setSelectedIndex, setExplain } = useAnalysis();

    // 세션에서 데이터 로드
    useEffect(() => {
        const raw = sessionStorage.getItem('ow_prediction');
        if (!raw) {
            router.replace('/');
            return;
        }
        const parsed = JSON.parse(raw) as PredictionResult;
        setResult(parsed);
        if (parsed.players.length > 0) {
            setSelectedIndex(parsed.players[0].index);
        }
    }, [router, setSelectedIndex]);

    // selectedIndex 바뀌면 explain 요청
    useEffect(() => {
        if (selectedIndex == null) return;
        (async () => {
            const data = await explainPlayer(selectedIndex, 5);
            setExplain(data);
        })();
    }, [selectedIndex, setExplain]);

    if (!result) {
        return (
            <main className={styles.container}>
                <p className={styles.loadingText}>분석 결과를 불러오는 중입니다...</p>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <h1 className={styles.title}>분석 결과</h1>
            <p className={styles.subtitle}>각 팀의 기여도 그래프입니다.</p>

            <GraphSection players={result.players} />

            <HeroDetail />
        </main>
    );
}

export default function Page() {
    return (
        <AnalysisProvider>
            <AnalysisContainer />
        </AnalysisProvider>
    );
}
