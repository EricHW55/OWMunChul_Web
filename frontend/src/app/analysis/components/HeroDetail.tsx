// src/app/analysis/components/HeroDetail.tsx
'use client';

import { useAnalysis } from '../AnalysisContext';
import styles from '../page.module.css';

function heroImg(h: string) {
    return `/heroes/${h.toLowerCase().replace(/\s+/g, '-')}.png`;
}

export default function HeroDetail() {
    const {
        selectedIndex,
        explain,
        llmSummary,
        loadingLlm,
    } = useAnalysis();

    if (selectedIndex == null) {
        return (
            <section className={styles.detailSection}>
                <p>영웅을 선택하면 세부 평가를 볼 수 있습니다.</p>
            </section>
        );
    }

    if (!explain) {
        return (
            <section className={styles.detailSection}>
                <p className={styles.loadingText}>세부 수치를 불러오는 중...</p>
            </section>
        );
    }

    return (
        <section className={styles.detailSection}>
            {/* 헤더: 아이콘 + (이름/팀/인분/요약) */}
            <div className={styles.heroDetailHeader}>
                <img
                    src={heroImg(explain.hero)}
                    alt={explain.hero}
                    className={styles.heroImage}
                />

                <div className={styles.heroTextBlock}>
                    {/* 이름 + 팀 + 인분 한 줄 */}
                    <div className={styles.heroNameRow}>
                        <span className={styles.heroName}>{explain.hero}</span>
                        <span className={styles.heroTeam}>
              ({explain.team === 'blue' ? '블루' : '레드'})
            </span>
                        <span className={styles.heroPortion}>
              · {explain.win_probability.toFixed(2)} 인분
            </span>
                    </div>

                    {/* LLM 요약 */}
                    {loadingLlm && !llmSummary && (
                        <p className={styles.heroLlmSummary}>
                            LLM 요약 불러오는 중...
                        </p>
                    )}
                    {llmSummary && (
                        <p className={styles.heroLlmSummary}>{llmSummary}</p>
                    )}
                </div>
            </div>

            {/* 피쳐 두 칼럼 */}
            <div className={styles.featureColumns}>
                {/* Positive */}
                <div>
                    <h3 className={styles.featureTitle}>좋게 평가한 항목</h3>
                    {explain.top_positive.map((f) => (
                        <div
                            key={f.feature_key}
                            className={styles.featureItem}
                        >
                            <span>{f.feature}</span>
                            <span>값 {f.value.toFixed(2)}</span>
                            <span className={styles.featureImpact}>
                +{f.shap_value.toFixed(3)}
              </span>
                        </div>
                    ))}
                </div>

                {/* Negative */}
                <div>
                    <h3 className={styles.featureTitle}>나쁘게 평가한 항목</h3>
                    {explain.top_negative.map((f) => (
                        <div
                            key={f.feature_key}
                            className={styles.featureItem}
                        >
                            <span>{f.feature}</span>
                            <span>값 {f.value.toFixed(2)}</span>
                            <span className={styles.featureImpactNegative}>
                {f.shap_value.toFixed(3)}
              </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
