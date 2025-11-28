'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { predictFromImage } from '../lib/api';
import type { PredictionResult } from '../types/overwatch';
import styles from './UploadSection.module.css';

export default function UploadSection() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (!selected.type.startsWith('image/')) {
            setError('이미지 파일만 업로드할 수 있습니다.');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setFile(selected);
        setError(null);
    }

    // Ctrl + V 붙여넣기 (그대로 유지)
    useEffect(() => {
        function handlePaste(e: ClipboardEvent) {
            if (!e.clipboardData) return;
            const items = e.clipboardData.items;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    if (blob) {
                        const pastedFile = new File([blob], 'pasted-image.png', {
                            type: blob.type,
                        });
                        setFile(pastedFile);
                        setError(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                }
            }
        }

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    function handleClearFile() {
        setFile(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleAnalyzeClick() {
        if (!file) {
            setError('먼저 스크린샷 이미지를 업로드하거나 붙여넣기 하세요.');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result: PredictionResult = await predictFromImage(file);

            if (typeof window !== 'undefined') {
                sessionStorage.setItem('ow_prediction', JSON.stringify(result));
            }

            router.push('/analysis');
        } catch (err) {
            console.error(err);
            setError('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>스코어보드 스크린샷 업로드</h2>
            <p className={styles.description}>
                파일을 업로드하거나, Overwatch 스크린샷을 캡처한 후
                <strong> Ctrl + V </strong> 로 바로 붙여넣을 수 있습니다.
            </p>

            <div className={styles.uploadBox}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                />

                {file ? (
                    <div className={styles.fileInfoRow}>
                        <p className={styles.fileName}>
                            선택된 이미지: <strong>{file.name}</strong>
                        </p>
                        <button
                            type="button"
                            className={styles.clearButton}
                            onClick={handleClearFile}
                        >
                            삭제
                        </button>
                    </div>
                ) : (
                    <p className={styles.placeholder}>
                        여기에 파일을 선택하거나 Ctrl + V 로 붙여넣기
                    </p>
                )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
                type="button"
                onClick={handleAnalyzeClick}
                className={styles.button}
                disabled={isLoading}
            >
                {isLoading ? '분석 중...' : '분석하기'}
            </button>
        </section>
    );
}
