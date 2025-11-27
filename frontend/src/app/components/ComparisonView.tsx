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

                <div className="space-y-4">
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
                                {/* 상단: 영웅 이름과 인분 */}
                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    {/* 블루 플레이어 */}
                                    <div className="text-left">
                                        <div className="text-blue-300 font-bold text-base capitalize">
                                            {bluePlayer.hero.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-blue-400 text-lg font-bold">
                                            {blueProb.toFixed(2)}인분
                                        </div>
                                    </div>

                                    {/* 중앙 VS */}
                                    <div className="flex items-center justify-center">
                                        <span className="text-slate-500 font-bold">VS</span>
                                    </div>

                                    {/* 레드 플레이어 */}
                                    <div className="text-right">
                                        <div className="text-red-300 font-bold text-base capitalize">
                                            {redPlayer.hero.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-red-400 text-lg font-bold">
                                            {redProb.toFixed(2)}인분
                                        </div>
                                    </div>
                                </div>

                                {/* 하단: 비교 바 */}
                                <div className="relative h-8 bg-slate-700 rounded-full overflow-hidden">
                                    {/* 블루 바 (왼쪽에서 시작) */}
                                    <div
                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 flex items-center justify-center"
                                        style={{ width: `${bluePercent}%` }}
                                    >
                    <span className="text-white font-bold text-sm drop-shadow-lg">
                      {bluePercent.toFixed(0)}%
                    </span>
                                    </div>

                                    {/* 레드 바 (오른쪽에서 시작) */}
                                    <div
                                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-600 transition-all duration-700 flex items-center justify-center"
                                        style={{ width: `${redPercent}%` }}
                                    >
                    <span className="text-white font-bold text-sm drop-shadow-lg">
                      {redPercent.toFixed(0)}%
                    </span>
                                    </div>

                                    {/* 중앙 구분선 */}
                                    <div className="absolute left-1/2 top-0 w-1 h-full bg-white/30 -translate-x-1/2"></div>
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