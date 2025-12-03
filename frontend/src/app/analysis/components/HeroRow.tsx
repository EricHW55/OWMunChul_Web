// src/app/analysis/components/HeroRow.tsx
'use client';

import type { PlayerPrediction } from '../../types/overwatch';
import { useAnalysis } from '../AnalysisContext';
import styles from '../page.module.css';

export default function HeroRow({
                                    blue,
                                    red,
                                }: {
    blue?: PlayerPrediction;
    red?: PlayerPrediction;
}) {
    const { selectedIndex, selectPlayer } = useAnalysis();

    const blueScore = blue?.win_probability ?? 0;
    const redScore = red?.win_probability ?? 0;
    const total = blueScore + redScore || 1;

    const blueWidth = (blueScore / total) * 100;
    const redWidth = (redScore / total) * 100;

    return (
        <div className={styles.row}>
            <button
                type="button"
                className={`${styles.heroLabel} ${styles.blueLabel} ${
                    selectedIndex === blue?.index ? styles.selectedHero : ''
                }`}
                onClick={() => blue && selectPlayer(blue.index)}
                disabled={!blue}
            >
                {blue ? `${blue.hero}: ${blueScore.toFixed(2)} 인분` : ''}
            </button>

            <div className={styles.barWrapper}>
                <div className={styles.barLine} />

                {blue && (
                    <div
                        className={styles.blueBar}
                        style={{ width: `${blueWidth}%` }}
                    />
                )}

                {red && (
                    <div
                        className={styles.redBar}
                        style={{ width: `${redWidth}%` }}
                    />
                )}
            </div>

            <button
                type="button"
                className={`${styles.heroLabel} ${styles.redLabel} ${
                    selectedIndex === red?.index ? styles.selectedHero : ''
                }`}
                onClick={() => red && selectPlayer(red.index)}
                disabled={!red}
            >
                {red ? `${red.hero}: ${redScore.toFixed(2)} 인분` : ''}
            </button>
        </div>
    );
}
