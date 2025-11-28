'use client';

import type { PlayerPrediction } from '../../types/overwatch';
import HeroRow from './HeroRow';
import styles from '../page.module.css';

export default function GraphSection({
                                         players,
                                     }: {
    players: PlayerPrediction[];
}) {
    const blue = players.filter((p) => p.team === 'blue');
    const red = players.filter((p) => p.team === 'red');
    const maxRows = Math.max(blue.length, red.length);

    return (
        <section className={styles.graphSection}>
            {Array.from({ length: maxRows }).map((_, i) => (
                <HeroRow
                    key={i}
                    blue={blue[i]}
                    red={red[i]}
                />
            ))}
        </section>
    );
}
