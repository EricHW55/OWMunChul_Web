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
    const { selectedIndex, setSelectedIndex } = useAnalysis();

    const blueScore = blue?.win_probability ?? 0;
    const redScore = red?.win_probability ?? 0;
    const total = blueScore + redScore || 1;
    const markerPos = blueScore / total;

    const markerColor =
        blueScore >= redScore ? '#60a5fa' : '#f97373';

    return (
        <div className={styles.row}>
            <button
                type="button"
                className={`${styles.heroLabel} ${styles.blueLabel} ${
                    selectedIndex === blue?.index ? styles.selectedHero : ''
                }`}
                onClick={() => blue && setSelectedIndex(blue.index)}
                disabled={!blue}
            >
                {blue ? `${blue.hero}: ${blueScore.toFixed(2)} 인분` : ''}
            </button>

            <div className={styles.barWrapper}>
                <div className={styles.barLine} />

                <div
                    className={styles.marker}
                    style={{ left: `${markerPos * 100}%` }}
                >
                    <div
                        className={styles.markerDot}
                        style={{ backgroundColor: markerColor }}
                    />
                </div>
            </div>

            <button
                type="button"
                className={`${styles.heroLabel} ${styles.redLabel} ${
                    selectedIndex === red?.index ? styles.selectedHero : ''
                }`}
                onClick={() => red && setSelectedIndex(red.index)}
                disabled={!red}
            >
                {red ? `${red.hero}: ${redScore.toFixed(2)} 인분` : ''}
            </button>
        </div>
    );
}
