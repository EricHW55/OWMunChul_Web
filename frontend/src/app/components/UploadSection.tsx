// app/components/UploadSection.tsx
'use client';

import React, { useState } from 'react';
import { Upload, BarChart3 } from 'lucide-react';
import type { PredictionResult } from '../types/overwatch';
import { predictFromImage } from '../lib/api';

interface UploadSectionProps {
    onResult: (res: PredictionResult) => void;
    onError: (msg: string | null) => void;
}

export function UploadSection({ onResult, onError }: UploadSectionProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        onError(null);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            onError('이미지를 먼저 선택해주세요');
            return;
        }

        setLoading(true);
        onError(null);

        try {
            const data = await predictFromImage(selectedFile);
            onResult(data);
        } catch (err) {
            onError((err as Error).message || '이미지 처리 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl shadow-2xl p-6 mb-8 border border-slate-700">
            <div className="flex flex-col items-center gap-4">
                <label className="w-full cursor-pointer">
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-orange-400 transition-all text-center bg-slate-900/30">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <div className="text-slate-300 mb-2 font-medium">
                            {selectedFile ? selectedFile.name : '클릭하거나 드래그하여 업로드'}
                        </div>
                        <div className="text-sm text-slate-500">PNG, JPG 최대 10MB</div>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>

                {preview && (
                    <div className="w-full max-w-2xl">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg shadow-lg border border-slate-700"
                        />
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold text-lg
                   hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700
                   disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                >
                    <BarChart3 className="w-5 h-5" />
                    {loading ? '분석 중...' : '분석 시작'}
                </button>
            </div>
        </div>
    );
}