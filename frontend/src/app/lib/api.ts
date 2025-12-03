// app/lib/api.ts
import type {
    PredictionResult,
    ExplainResult,
    ExplainLLMResult,
} from '../types/overwatch';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

/**
 * 이미지 업로드 → /predict 호출
 * 반환: 각 플레이어의 hero, win_probability 리스트
 */
export async function predictFromImage(
    file: File,
): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error(`서버 에러: ${res.status}`);
    }

    const data = (await res.json()) as PredictionResult;
    return data;
}

/**
 * 특정 플레이어 인덱스에 대한 feature 중요도 조회
 * playerIndex: 0~4 (blue), 5~9 (red)
 * topK: 상위 몇 개의 feature를 받을지
 */
export async function explainPlayer(
    playerIndex: number,
    topK = 5,
): Promise<ExplainResult> {
    const url = new URL('/explain', API_BASE_URL);
    url.searchParams.set('player_index', String(playerIndex));
    url.searchParams.set('top_k', String(topK));

    const res = await fetch(url.toString(), {
        method: 'GET',
    });

    if (!res.ok) {
        throw new Error(`서버 에러: ${res.status}`);
    }

    const data = (await res.json()) as ExplainResult;
    return data;
}

/**
 * 특정 플레이어에 대한 LLM 한줄 요약만 요청
 */
export async function explainPlayerLLM(
    playerIndex: number,
    topK = 5,
): Promise<ExplainLLMResult> {
    const url = new URL('/explain_llm', API_BASE_URL);
    url.searchParams.set('player_index', String(playerIndex));
    url.searchParams.set('top_k', String(topK));

    const res = await fetch(url.toString(), {
        method: 'GET',
    });

    if (!res.ok) {
        throw new Error(`서버 에러: ${res.status}`);
    }

    const data = (await res.json()) as ExplainLLMResult;
    return data;
}
