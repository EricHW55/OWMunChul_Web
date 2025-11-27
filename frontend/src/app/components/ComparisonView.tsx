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

                <div className="space-y-3">
                    {blueTeam.map((bluePlayer, idx) => {
                        const redPlayer = redTeam[idx];
                        const blueProb = bluePlayer.win_probability;
                        const redProb = redPlayer.win_probability;
                        const total = blueProb + redProb;

                        // 비율 계산 (0으로 나누기 방지)
                        const bluePercent = total > 0 ? (blueProb / total) * 100 : 50;
                        const redPercent = total > 0 ? (redProb / total) * 100 : 50;

                        return (
                            <div
                                key={idx}
                                className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition"
                            >
                                <div className="flex items-center gap-3">
                                    {/* 블루 플레이어 (왼쪽) */}
                                    <div className="flex-1 text-left">
                                        <div className="text-blue-300 font-bold text-lg capitalize truncate">
                                            {bluePlayer.hero.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-blue-400 text-xl font-bold">
                                            {blueProb.toFixed(2)}인분
                                        </div>
                                    </div>

                                    {/* 비교 바 (중앙) */}
                                    <div className="flex-[2] flex items-center gap-2">
                                        {/* 블루 바 */}
                                        <div className="flex-1 h-10 bg-slate-700 rounded-l-lg overflow-hidden flex items-center justify-end">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 flex items-center justify-end pr-2"
                                                style={{ width: `${bluePercent}%` }}
                                            >
                                                {bluePercent > 30 && (
                                                    <span className="text-white font-bold text-sm">
                            {bluePercent.toFixed(0)}%
                          </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 중앙 구분선 */}
                                        <div className="w-0.5 h-12 bg-white/50"></div>

                                        {/* 레드 바 */}
                                        <div className="flex-1 h-10 bg-slate-700 rounded-r-lg overflow-hidden flex items-center justify-start">
                                            <div
                                                className="h-full bg-gradient-to-l from-red-500 to-red-600 transition-all duration-500 flex items-center justify-start pl-2"
                                                style={{ width: `${redPercent}%` }}
                                            >
                                                {redPercent > 30 && (
                                                    <span className="text-white font-bold text-sm">
                            {redPercent.toFixed(0)}%
                          </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 레드 플레이어 (오른쪽) */}
                                    <div className="flex-1 text-right">
                                        <div className="text-red-300 font-bold text-lg capitalize truncate">
                                            {redPlayer.hero.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-red-400 text-xl font-bold">
                                            {redProb.toFixed(2)}인분
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 팁 */}
            <div className="text-center text-slate-400 text-sm">
                💡 막대 그래프가 길수록 해당 플레이어의 기여도가 높습니다
            </div>
        </div>
    );
}