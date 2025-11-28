'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { explainPlayer } from '../lib/api';
import type { PredictionResult } from '../types/overwatch';
import { AnalysisProvider, useAnalysis } from './AnalysisContext';
import GraphSection from './components/GraphSection';
import HeroDetail from './components/HeroDetail';
import styles from './page.module.css';

function AnalysisContainer() {
    const router = useRouter();
    const [result, setResult] = useState<PredictionResult | null>(null);
    const { selectedIndex, setSelectedIndex, setExplain } = useAnalysis();

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

    function handleBackClick() {
        // 필요하면 여기서 sessionStorage.clear()나 특정 키만 삭제도 가능
        // sessionStorage.removeItem('ow_prediction');
        router.push('/');   // 홈(업로드 페이지)로 이동
    }

    return (
        <main className={styles.container}>
            <div className={styles.headerRow}>
                <div>
                    <h1 className={styles.title}>분석 결과</h1>
                    <p className={styles.subtitle}>각 팀의 기여도 그래프입니다.</p>
                </div>

                <button
                    type="button"
                    className={styles.backButton}
                    onClick={handleBackClick}
                >
                    ← 다시 업로드하기
                </button>
            </div>

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
