// src/app/analysis/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { explainPlayer, explainPlayerLLM } from '../lib/api';
import type { PredictionResult } from '../types/overwatch';
import { AnalysisProvider, useAnalysis } from './AnalysisContext';
import GraphSection from './components/GraphSection';
import HeroDetail from './components/HeroDetail';
import styles from './page.module.css';

function AnalysisContainer() {
    const router = useRouter();
    const [result, setResult] = useState<PredictionResult | null>(null);

    const {
        selectedIndex,
        setSelectedIndex,
        setExplain,
        setLlmSummary,
        setLoadingExplain,
        setLoadingLlm,
        llmCache,
        updateLlmCache,
    } = useAnalysis();

    // 1. 초기 로드: 세션 스토리지에서 예측 결과 가져오기
    useEffect(() => {
        const raw = sessionStorage.getItem('ow_prediction');
        if (!raw) {
            router.replace('/');
            return;
        }
        const parsed = JSON.parse(raw) as PredictionResult;
        setResult(parsed);

        // 처음에 첫 번째 플레이어 자동 선택
        if (parsed.players.length > 0) {
            setSelectedIndex(parsed.players[0].index);
        }
    }, [router, setSelectedIndex]);

    // 2. 플레이어 선택 변경 시: 상세 데이터 불러오기
    useEffect(() => {
        if (selectedIndex == null) return;

        let isMounted = true;

        // (A) 수치 데이터 Fetch (SHAP 등) - 빠르니까 매번 호출 (혹은 이것도 캐싱 가능)
        const fetchNumeric = async () => {
            setLoadingExplain(true);
            try {
                const data = await explainPlayer(selectedIndex, 5);
                if (isMounted) {
                    setExplain(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setLoadingExplain(false);
            }
        };

        // (B) LLM 요약 Fetch - 캐시 확인 로직 적용
        const fetchLlm = async () => {
            // 1. 이미 캐시에 있는지 확인
            if (llmCache[selectedIndex]) {
                setLlmSummary(llmCache[selectedIndex]);
                return;
            }

            // 2. 없으면 API 호출
            setLoadingLlm(true);
            try {
                const data = await explainPlayerLLM(selectedIndex, 5);
                if (isMounted) {
                    setLlmSummary(data.llm_summary);
                    // 캐시에 저장
                    updateLlmCache(selectedIndex, data.llm_summary);
                }
            } catch (e) {
                console.error(e);
                if (isMounted) setLlmSummary('요약을 불러오는데 실패했습니다.');
            } finally {
                if (isMounted) setLoadingLlm(false);
            }
        };

        // 병렬로 시작
        fetchNumeric();
        fetchLlm();

        return () => {
            isMounted = false;
        };
    }, [selectedIndex, setExplain, setLlmSummary, setLoadingExplain, setLoadingLlm, llmCache, updateLlmCache]);

    if (!result) {
        return (
            <main className={styles.container}>
                <p className={styles.loadingText}>분석 결과를 불러오는 중입니다...</p>
            </main>
        );
    }

    function handleBackClick() {
        router.push('/');
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