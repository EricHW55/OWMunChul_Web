// src/app/analysis/AnalysisContainer.tsx
'use client';

import { useEffect } from 'react';
import { useAnalysis } from './AnalysisContext';
import { explainPlayer, explainPlayerLLM } from '../lib/api';
import GraphSection from './components/GraphSection';
import HeroDetail from './components/HeroDetail';
import styles from './page.module.css';

export default function AnalysisContainer() {
    const {
        players,
        selectedIndex,
        setExplain,
        setLlmSummary,
        // loadingExplain,    // 안 쓰면 일단 주석 처리해도 됨
        setLoadingExplain,
        // loadingLlm,
        setLoadingLlm,
    } = useAnalysis();

    // 영웅 선택 시 /explain + /explain_llm 호출
    useEffect(() => {
        if (selectedIndex == null) return;
        if (!players) return;

        const run = async () => {
            // 1) 숫자 설명
            setLoadingExplain(true);
            try {
                const explainData = await explainPlayer(selectedIndex, 5);
                setExplain(explainData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingExplain(false);
            }

            // 2) LLM 요약
            setLoadingLlm(true);
            try {
                const llmData = await explainPlayerLLM(selectedIndex, 5);
                setLlmSummary(llmData.llm_summary);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingLlm(false);
            }
        };

        run();
    }, [selectedIndex, players, setExplain, setLlmSummary, setLoadingExplain, setLoadingLlm]);

    if (!players) {
        return (
            <section className={styles.resultSection}>
                <p>먼저 스크린샷을 업로드해서 예측을 실행해 주세요.</p>
            </section>
        );
    }

    return (
        <section className={styles.resultSection}>
            <h2 className={styles.sectionTitle}>분석 결과</h2>
            <GraphSection players={players} />
            <HeroDetail />
        </section>
    );
}
