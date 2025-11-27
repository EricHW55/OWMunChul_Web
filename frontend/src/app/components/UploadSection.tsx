// src/components/UploadSection.tsx
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
        onResult as any; // 결과 초기화는 부모에서 처리

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            onError('Please select an image first');
            return;
        }

        setLoading(true);
        onError(null);

        try {
            const data = await predictFromImage(selectedFile);
            onResult(data);
        } catch (err) {
            onError((err as Error).message || 'Failed to process image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col items-center gap-4">
                <label className="w-full cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-indigo-500 transition text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <div className="text-gray-600 mb-2">
                            {selectedFile
                                ? selectedFile.name
                                : 'Click to upload or drag and drop'}
                        </div>
                        <div className="text-sm text-gray-400">PNG, JPG up to 10MB</div>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>

                {preview && (
                    <div className="w-full">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg shadow-md"
                        />
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold
                     hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition flex items-center gap-2"
                >
                    <BarChart3 className="w-5 h-5" />
                    {loading ? 'Processing...' : 'Analyze'}
                </button>
            </div>
        </div>
    );
}
