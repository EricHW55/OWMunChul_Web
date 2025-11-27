// src/lib/api.ts
import type { PredictionResult } from '../types/overwatch';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

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
        throw new Error(`Server error: ${res.status}`);
    }

    const data = (await res.json()) as PredictionResult;
    return data;
}
