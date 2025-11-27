// app/components/ComparisonView.tsx
'use client';

import React from 'react';
import { Trophy, Swords } from 'lucide-react';
import type { PredictionResult, PlayerData } from '../types/overwatch';

interface ComparisonViewProps {
    result: PredictionResult;
}

export function ComparisonView({ result }: ComparisonViewProps) {
    const blueTeam = result.blue_team;
    const redTeam = result.red_team;

    const getPerformanceScore = (prob: number): string => {
        return `${prob.toFixed(2)}인분`;
    };

    const getBarPosition = (blueProb: number, redProb: number): number => {
        const total = blueProb + redProb;
        if (total === 0) return 50;
        return (blueProb / total) * 100;
    };

    return (
        <div className="space-y-6">
            {/* 팀 평균 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl border border-blue-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-6 h-6 text-blue-200" />
                        <h2 className="text-2xl font-bold text-white">블루팀</h2>
                    </div>
                    <div className="text-4xl font-bold text-white">
                        {(result.team_averages.blue * 100).toFixed(1)}%
                    </div>
                    <div className="text-blue-200 mt-1">평균 승률</div>
                </div>

                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 shadow-xl border border-red-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="w-6 h-6 text-red-200" />
                        <h2 className="text-2xl font-bold text-white">레드팀</h2>
                    </div>
                    <div className="text-4xl font-bold text-white">
                        {(result.team_averages.red * 100).toFixed(1)}%
                    </div>
                    <div className="text-red-200 mt-1">평균 승률</div>
                </div>
            </div>

            {/* 플레이어 대결 */}
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl shadow-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Swords className="w-6 h-6 text-orange-400" />
                    <h3 className="text-2xl font-bold text-white">1 vs 1 매치업</h3>
                </div>

                <div className="space-y-4">
                    {blueTeam.map((bluePlayer, idx) => {
                        const redPlayer = redTeam[idx];
                        const barPos = getBarPosition(
                            bluePlayer.win_probability,
                            redPlayer.win_probability
                        );

                        return (
                            <div
                                key={idx}
                                className="bg-slate-900/50 rounded-xl p-4 border border-slate-700"
                            >
                                {/* 영웅 이름 및 인분 */}
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    {/* 블루 플레이어 */}
                                    <div className="text-left">
                                        <div className="text-blue-400 font-bold text-lg capitalize">
                                            {bluePlayer.hero.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-blue-300 text-2xl font-bold">
                                            {getPerformanceScore(bluePlayer.win_probability)}
                                        </div>
                                    </div>

                                    {/* 중앙 VS */}
                                    <div className="flex items-center justify-center">
                                        <div className="text-slate-500 font-bold text-sm">VS</div>
                                    </div>

                                    {/* 레드 플레이어 */}
                                    <div className="text-right">
                                        <div className="text-red-400 font-bold text-lg capitalize">
                                            {redPlayer.hero.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-red-300 text-2xl font-bold">
                                            {getPerformanceScore(redPlayer.win_probability)}
                                        </div>
                                    </div>
                                </div>

                                {/* 비교 바 */}
                                <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-blue-500"
                                        style={{ width: `${barPos}%` }}
                                    />
                                    <div
                                        className="absolute top-0 right-0 h-full bg-red-500"
                                        style={{ width: `${100 - barPos}%` }}
                                    />
                                    {/* 중앙 인디케이터 */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white shadow-lg"
                                        style={{ left: `${barPos}%` }}
                                    />
                                </div>

                                {/* 스탯 정보 */}
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    {/* 블루 스탯 */}
                                    <div className="space-y-1 text-slate-300">
                                        <div>
                                            K/D/A: {bluePlayer.kills}/{bluePlayer.deaths}/
                                            {bluePlayer.assists}
                                        </div>
                                        <div>DMG: {bluePlayer.damage.toLocaleString()}</div>
                                        <div>HEAL: {bluePlayer.heal.toLocaleString()}</div>
                                    </div>

                                    {/* 레드 스탯 */}
                                    <div className="space-y-1 text-slate-300 text-right">
                                        <div>
                                            {redPlayer.kills}/{redPlayer.deaths}/{redPlayer.assists}{' '}
                                            :K/D/A
                                        </div>
                                        <div>{redPlayer.damage.toLocaleString()} :DMG</div>
                                        <div>{redPlayer.heal.toLocaleString()} :HEAL</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}