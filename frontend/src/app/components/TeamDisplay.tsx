// src/components/TeamDisplay.tsx
'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import type { PlayerData, PredictionResult } from '../types/overwatch';

interface TeamDisplayProps {
    team: PlayerData[];
    teamName: 'Blue' | 'Red';
    color: string; // Tailwind 클래스
    result: PredictionResult | null;
}

const getWinProbColor = (prob: number): string => {
    if (prob >= 0.7) return 'text-green-600 bg-green-50';
    if (prob >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
};

export function TeamDisplay({
                                team,
                                teamName,
                                color,
                                result,
                            }: TeamDisplayProps) {
    const avg =
        result?.team_averages[teamName.toLowerCase() as 'blue' | 'red'];

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${color}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {teamName} Team
                </h3>
                {avg !== undefined && (
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Team Avg</div>
                        <div
                            className={`text-2xl font-bold ${
                                avg >= 0.5 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {(avg * 100).toFixed(1)}%
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {team.map((player, idx) => (
                    <div
                        key={`${teamName}-${idx}`}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-lg capitalize">
                                {player.hero.replace(/_/g, ' ')}
                            </div>
                            <div
                                className={`px-3 py-1 rounded-full font-bold ${getWinProbColor(
                                    player.win_probability,
                                )}`}
                            >
                                {(player.win_probability * 100).toFixed(1)}%
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="text-gray-500 text-xs">K/D/A</div>
                                <div className="font-medium">
                                    {player.kills}/{player.deaths}/{player.assists}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="text-gray-500 text-xs">Damage</div>
                                <div className="font-medium">
                                    {player.damage.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="text-gray-500 text-xs">Heal</div>
                                <div className="font-medium">
                                    {player.heal.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
