import UploadSection from './components/UploadSection';
import styles from './page.module.css';

export default function HomePage() {
    return (
        <main className={styles.container}>
            <section className={styles.hero}>
                <h1 className={styles.title}>Overwatch 승리 기여도 분석기</h1>
                <p className={styles.subtitle}>
                    스코어보드 한 장으로, 각 플레이어가 팀 승리에 몇 인분 기여하고 있는지
                    확인해보세요.
                </p>

                <ol className={styles.steps}>
                    <li>1. Overwatch에서 스코어보드 화면을 캡처합니다.</li>
                    <li>2. 아래 업로드 섹션에 이미지를 업로드합니다.</li>
                    <li>3. <strong>분석하기</strong> 버튼을 누르면, 분석 페이지로 이동합니다.</li>
                    <li>4. 그래프에서 영웅을 클릭하면, 어떤 스탯 때문에 그렇게 평가되었는지 볼 수 있습니다.</li>
                </ol>
            </section>

            <UploadSection />
        </main>
    );
}
