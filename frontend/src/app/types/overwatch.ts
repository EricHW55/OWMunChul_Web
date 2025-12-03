// 각 플레이어 예측 결과
export interface PlayerPrediction {
    index: number;              // 0~4: blue, 5~9: red
    team: 'blue' | 'red';
    hero: string;
    win_probability: number;    // 정규화(인분) 점수
}

export interface PredictionResult {
    success: boolean;
    players: PlayerPrediction[];
}

// /explain 결과 타입
export interface ExplainFeature {
    feature_key: string;  // match_total_kills 같은 원래 피처 이름
    feature: string;      // "경기 전체 총 처치 수" 같은 한국어 라벨
    value: number;
    shap_value: number;
}

export interface ExplainResult {
    success: boolean;
    player_index: number;
    team: 'blue' | 'red';
    hero: string;
    win_probability: number;
    raw_win_probability: number;
    bias: number;
    top_positive: ExplainFeature[];
    top_negative: ExplainFeature[];
    llm_summary: string;        // 🔹 LLM 한줄 요약 추가
}
