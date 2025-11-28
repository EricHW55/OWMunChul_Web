'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { predictFromImage } from '../lib/api';
import type { PredictionResult } from '../types/overwatch';
import styles from './UploadSection.module.css';

export default function UploadSection() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (!selected.type.startsWith('image/')) {
            setError('이미지 파일만 업로드할 수 있습니다.');
            setFile(null);
            return;
        }

        setFile(selected);
        setError(null);
    }

    async function handleAnalyzeClick() {
        if (!file) {
            setError('먼저 스크린샷 이미지를 업로드해주세요.');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result: PredictionResult = await predictFromImage(file);

            // 세션 스토리지에 저장 → /analysis 페이지에서 읽어서 사용
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
                Overwatch 경기 중 스코어보드 화면을 캡처해서 업로드하면,
                각 플레이어가 팀 승리에 얼마나 기여하고 있는지 분석해줍니다.
            </p>

            <div className={styles.uploadBox}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                />
                {file && (
                    <p className={styles.fileName}>선택된 파일: {file.name}</p>
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
