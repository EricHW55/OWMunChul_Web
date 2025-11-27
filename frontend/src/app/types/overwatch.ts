// src/types/overwatch.ts
export interface PlayerData {
    hero: string;
    win_probability: number;
    kills: number;
    assists: number;
    deaths: number;
    damage: number;
    heal: number;
    mitig: number;
}

export interface PredictionResult {
    success: boolean;
    blue_team: PlayerData[];
    red_team: PlayerData[];
    team_averages: {
        blue: number;
        red: number;
    };
}
