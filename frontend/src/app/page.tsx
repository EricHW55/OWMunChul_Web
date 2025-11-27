// app/page.tsx
'use client';

import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { UploadSection } from './components/UploadSection';
import { ComparisonView } from './components/ComparisonView';
import type { PredictionResult } from './types/overwatch';

export default function Home() {
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Target className="w-12 h-12 text-orange-400" />
                        <h1 className="text-5xl font-bold text-white">
                            누가 죄인인가?
                        </h1>
                    </div>
                    <p className="text-blue-200 text-lg">
                        스코어보드 스크린샷을 업로드하여 승률을 예측하세요
                    </p>
                </div>

                {/* 업로드 섹션 */}
                <UploadSection
                    onResult={(res) => {
                        setResult(res);
                        setError(null);
                    }}
                    onError={(msg) => {
                        setError(msg);
                        if (msg) setResult(null);
                    }}
                />

                {error && (
                    <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 backdrop-blur">
                        {error}
                    </div>
                )}

                {/* 결과 표시 */}
                {result && <ComparisonView result={result} />}
            </div>
        </div>
    );
}