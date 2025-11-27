// app/components/UploadSection.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, BarChart3, Clipboard } from 'lucide-react';
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
    const [pasteReady, setPasteReady] = useState(false);
    const pasteAreaRef = useRef<HTMLDivElement>(null);

    // 파일 설정 및 미리보기
    const setFileAndPreview = (file: File) => {
        setSelectedFile(file);
        onError(null);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // 파일 선택 핸들러
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileAndPreview(file);
        }
    };

    // 클립보드 붙여넣기 핸들러
    const handlePaste = async (e: ClipboardEvent) => {
        e.preventDefault();

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // 이미지 파일인 경우
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    setFileAndPreview(file);
                    onError(null);
                    return;
                }
            }
        }

        onError('클립보드에 이미지가 없습니다');
    };

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                setFileAndPreview(file);
            } else {
                onError('이미지 파일만 업로드 가능합니다');
            }
        }
    };

    // 전역 붙여넣기 이벤트 등록
    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
            handlePaste(e);
        };

        window.addEventListener('paste', handleGlobalPaste);
        setPasteReady(true);

        return () => {
            window.removeEventListener('paste', handleGlobalPaste);
        };
    }, []);

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
<<<<<<< HEAD
                {/* 붙여넣기 안내 */}
                {pasteReady && !selectedFile && (
                    <div className="w-full bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-center gap-2 text-green-300">
                            <Clipboard className="w-5 h-5" />
                            <span className="font-medium">
                💡 Ctrl+V (또는 Cmd+V)로 클립보드 이미지를 바로 붙여넣을 수 있습니다!
              </span>
                        </div>
                    </div>
                )}

                {/* 업로드 영역 */}
                <label
                    className="w-full cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-orange-400 transition-all text-center bg-slate-900/30">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <div className="text-slate-300 mb-2 font-medium">
                            {selectedFile ? selectedFile.name : '클릭 / 드래그 / Ctrl+V 로 업로드'}
                        </div>
                        <div className="text-sm text-slate-500">
                            PNG, JPG 최대 10MB
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                            스크린샷을 복사한 후 이 페이지 어디서나 Ctrl+V
                        </div>
=======
                <label className="w-full cursor-pointer">
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 hover:border-orange-400 transition-all text-center bg-slate-900/30">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <div className="text-slate-300 mb-2 font-medium">
                            {selectedFile ? selectedFile.name : '클릭하거나 드래그하여 업로드'}
                        </div>
                        <div className="text-sm text-slate-500">PNG, JPG 최대 10MB</div>
>>>>>>> b5998ea588ec5ef1b44a63bf79004a62a7929a38
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>

                {/* 미리보기 */}
                {preview && (
                    <div className="w-full max-w-2xl">
<<<<<<< HEAD
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg shadow-lg border border-slate-700"
                            />
                            <button
                                onClick={() => {
                                    setPreview(null);
                                    setSelectedFile(null);
                                }}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg"
                            >
                                ×
                            </button>
                        </div>
=======
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg shadow-lg border border-slate-700"
                        />
>>>>>>> b5998ea588ec5ef1b44a63bf79004a62a7929a38
                    </div>
                )}

                {/* 분석 버튼 */}
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

                {/* 단축키 안내 */}
                <div className="text-xs text-slate-500 text-center">
                    <div className="font-medium mb-1">💡 빠른 사용법</div>
                    <div className="space-y-1">
                        <div>1. 오버워치에서 Tab 누르고 스크린샷 (Print Screen)</div>
                        <div>2. 이 페이지에서 <span className="text-orange-400 font-bold">Ctrl+V</span> (Mac은 Cmd+V)</div>
                        <div>3. 분석 시작 버튼 클릭</div>
                    </div>
                </div>
            </div>
        </div>
    );
}