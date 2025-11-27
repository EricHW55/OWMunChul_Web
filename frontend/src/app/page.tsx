// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { UploadSection } from './components/UploadSection';
import { TeamDisplay } from './components/TeamDisplay';
import type { PredictionResult } from './types/overwatch';

export default function Home() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Target className="w-10 h-10 text-indigo-600" />
              <h1 className="text-4xl font-bold text-gray-800">
                Overwatch Win Predictor
              </h1>
            </div>
            <p className="text-gray-600">
              Upload a scoreboard screenshot to predict win probability
            </p>
          </div>

          {/* 업로드 섹션 */}
          <UploadSection
              onResult={(res: any) => {
                setResult(res);
              }}
              onError={(msg: any) => {
                setError(msg);
                if (msg) setResult(null);
              }}
          />

          {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
          )}

          {/* 결과 표시 */}
          {result && (
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <TeamDisplay
                    team={result.blue_team}
                    teamName="Blue"
                    color="border-blue-500"
                    result={result}
                />
                <TeamDisplay
                    team={result.red_team}
                    teamName="Red"
                    color="border-red-500"
                    result={result}
                />
              </div>
          )}
        </div>
      </div>
  );
}
