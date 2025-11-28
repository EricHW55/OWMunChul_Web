import UploadSection from './components/UploadSection';
import styles from './page.module.css';

export default function HomePage() {
    return (
        <main className={styles.container}>
            <section className={styles.hero}>
                <h1 className={styles.title}>누가 죄인인가? 정치 대상 찾기!</h1>
                <p className={styles.subtitle}>
                    스코어보드 한 장으로, 각 플레이어가 팀 승리에 몇 인분 기여하고 있는지
                    확인해보세요.
                </p>

                <ol className={styles.steps}>
                    <li>1. Overwatch에서 <strong>기록</strong> - <strong>게임 분석</strong> 탭에 접속합니다.</li>
                    <li>2. 확인하고 싶은 경기의 <strong>팀</strong> 탭의 스탯 <strong>전체 화면</strong>을 캡쳐합니다.</li>
                    <li>3. 아래 업로드 섹션에 이미지를 업로드합니다.</li>
                    <li>4. <strong>분석하기</strong> 버튼을 누르면, 분석 페이지로 이동합니다.</li>
                    <li>5. 그래프에서 영웅을 클릭하면, 어떤 스탯 때문에 그렇게 평가되었는지 볼 수 있습니다.</li>
                    <li><strong>반드시</strong> 스탯의 <strong>전체 화면</strong>(스탯창 부분만 X)을 캡쳐해서 업로드해주세요. 화질은 <strong>FHD(1920x1080)</strong> 이상만 지원합니다.</li>
                </ol>
            </section>

            <UploadSection />
        </main>
    );
}
