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
    feature_key: string;  // 백엔드에서 오는 원래 피처 이름
    feature: string;      // 한글 라벨
    value: number;
    shap_value: number;
}

export interface ExplainResult {
    success: boolean;
    player_index: number;
    team: 'blue' | 'red';
    hero: string;
    win_probability: number;      // 인분 점수
    raw_win_probability: number;  // 실제 승률 (0~1)
    bias: number;
    top_positive: ExplainFeature[];
    top_negative: ExplainFeature[];
}

// /explain_llm 결과 타입
export interface ExplainLLMResult {
    success: boolean;
    player_index: number;
    llm_summary: string;
}
