# llm_explainer.py

import os
from typing import List, Tuple, Optional, Dict

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI

# .env 로드 (OPENAI_API_KEY 가져오기)
load_dotenv()

# OpenAI 클라이언트
client = OpenAI()

# 피처 이름 → 한글 설명 매핑 (필요하면 프로젝트에 맞게 채워 넣기)
FEATURE_LABELS: Dict[str, str] = {
    # 기본 스탯
    "win": "승리 여부",
    "kills": "처치 수",
    "assists": "어시스트 수",
    "deaths": "데스 수",
    "damage": "가한 피해량",
    "heal": "힐량",
    "mitig": "피해 흡수/경감량",

    # 영웅 원-핫 인코딩 (1이면 해당 영웅)
    "hero_ana": "영웅: 아나",
    "hero_ashe": "영웅: 애쉬",
    "hero_baptiste": "영웅: 바티스트",
    "hero_bastion": "영웅: 바스티온",
    "hero_brigitte": "영웅: 브리기테",
    "hero_cassidy": "영웅: 캐서디",
    "hero_doomfist": "영웅: 둠피스트",
    "hero_dva": "영웅: 디바",
    "hero_echo": "영웅: 에코",
    "hero_freja": "영웅: 프레이야",
    "hero_genji": "영웅: 겐지",
    "hero_hanzo": "영웅: 한조",
    "hero_hazard": "영웅: 해저드",
    "hero_illari": "영웅: 일라리",
    "hero_junker_queen": "영웅: 정커퀸",
    "hero_junkrat": "영웅: 정크랫",
    "hero_juno": "영웅: 주노",
    "hero_kiriko": "영웅: 키리코",
    "hero_lifeweaver": "영웅: 라이프위버",
    "hero_lucio": "영웅: 루시우",
    "hero_mauga": "영웅: 마우가",
    "hero_mei": "영웅: 메이",
    "hero_mercy": "영웅: 메르시",
    "hero_moira": "영웅: 모이라",
    "hero_orisa": "영웅: 오리사",
    "hero_pharah": "영웅: 파라",
    "hero_ramattra": "영웅: 라마트라",
    "hero_reaper": "영웅: 리퍼",
    "hero_reinhardt": "영웅: 라인하르트",
    "hero_roadhog": "영웅: 로드호그",
    "hero_sigma": "영웅: 시그마",
    "hero_sojourn": "영웅: 소전",
    "hero_soldier": "영웅: 솔저: 76",
    "hero_sombra": "영웅: 솜브라",
    "hero_symmetra": "영웅: 시메트라",
    "hero_torbjorn": "영웅: 토르비욘",
    "hero_tracer": "영웅: 트레이서",
    "hero_venture": "영웅: 벤처",
    "hero_widowmaker": "영웅: 위도우메이커",
    "hero_winston": "영웅: 윈스턴",
    "hero_wrecking_ball": "영웅: 레킹볼",
    "hero_wuyang": "영웅: 우양",
    "hero_zarya": "영웅: 자리야",
    "hero_zenyatta": "영웅: 젠야타",
    "hero_unknown": "영웅: 기타/알 수 없음",

    # 역할 원-핫
    "role_tank": "역할: 탱커",
    "role_damage": "역할: 딜러",
    "role_support": "역할: 힐러",
    "role_unknown": "역할: 기타/알 수 없음",

    # 경기 전체 기준 합계
    "match_total_kills": "경기 전체 총 처치 수",
    "match_total_deaths": "경기 전체 총 데스 수",
    "match_total_damage": "경기 전체 총 피해량",
    "match_total_heal": "경기 전체 총 힐량",

    # 경기 전체 기준 지분 (자기 스탯 / 경기 합계)
    "kill_share_match": "경기 전체 처치 기여 비율",
    "death_share_match": "경기 전체 데스 비율",
    "damage_share_match": "경기 전체 피해량 비율",
    "heal_share_match": "경기 전체 힐량 비율",
    "kp_share_match": "경기 전체 킬 관여 비율",

    # 팀 기준 합계
    "team_total_kills": "자기 팀 총 처치 수",
    "team_total_deaths": "자기 팀 총 데스 수",
    "team_total_damage": "자기 팀 총 피해량",
    "team_total_heal": "자기 팀 총 힐량",

    # 팀 기준 지분 (자기 스탯 / 팀 합계)
    "kill_share_team": "팀 내 처치 기여 비율",
    "death_share_team": "팀 내 데스 비율",
    "damage_share_team": "팀 내 피해량 비율",
    "heal_share_team": "팀 내 힐량 비율",
    "kp_share_team": "팀 내 킬 관여 비율",

    # 비율/효율 스탯
    "kills_per_death": "데스당 처치 수 (K/D)",
    "damage_per_kill": "처치당 피해량",
    "damage_per_death": "데스당 피해량",
    "heal_per_death": "데스당 힐량",
    "mitig_per_death": "데스당 피해 흡수량",
    "kda": "(킬+어시스트)/데스 (KDA)",
}


# 🔹 오버워치 배경 지식 로더 추가
OW_KNOWLEDGE_PATH = "overwatch_knowledge.txt"

def load_ow_knowledge(path: str = OW_KNOWLEDGE_PATH) -> str:
    """
    오버워치 관련 배경 지식을 .txt에서 읽어오는 함수.
    파일이 없으면 빈 문자열을 반환.
    """
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

class OWAlignmentExplainer:
    """
    XGBoost SHAP 결과(df_local)를 바탕으로
    LLM에게 '왜 이런 승률/인분이 나왔는지' 1~2문장으로 요약하게 하는 클래스.
    """

    def __init__(
        self,
        model_name: str = "gpt-4.1-mini",
        top_k: int = 3,
        feature_labels: Optional[dict] = None,
    ) -> None:
        self.model_name = model_name
        self.top_k = top_k
        self.feature_labels = feature_labels or FEATURE_LABELS

    # ---------- 내부 유틸 ----------

    def _feature_to_label(self, feat: str) -> str:
        return self.feature_labels.get(feat, feat)

    def build_reason_sentences(
        self,
        df_local: pd.DataFrame,
        top_k: Optional[int] = None,
    ) -> Tuple[List[str], List[str]]:
        """
        df_local: columns = [feature, value, shap_value]
        반환: (승률 올린 요인 리스트, 승률 깎은 요인 리스트)
        """
        if top_k is None:
            top_k = self.top_k

        # shap_value 큰 순 / 작은 순
        df_sorted = df_local.sort_values("shap_value", ascending=False)
        top_pos = df_sorted.head(top_k)
        top_neg = df_sorted.tail(top_k)

        pos_sentences: List[str] = []
        neg_sentences: List[str] = []

        for _, row in top_pos.iterrows():
            feat = str(row["feature"])
            val = float(row["value"])
            shap = float(row["shap_value"])
            name = self._feature_to_label(feat)
            pos_sentences.append(
                f"{name} 값이 {val:.2f}로, 승률을 높이는 방향으로 크게 기여했습니다 (SHAP {shap:.3f})."
            )

        for _, row in top_neg.iterrows():
            feat = str(row["feature"])
            val = float(row["value"])
            shap = float(row["shap_value"])
            name = self._feature_to_label(feat)
            neg_sentences.append(
                f"{name} 값이 {val:.2f}로, 승률을 낮추는 방향으로 크게 작용했습니다 (SHAP {shap:.3f})."
            )

        return pos_sentences, neg_sentences

    def build_prompt(
        self,
        hero_name: str,
        win_prob: float,
        portion_score: Optional[float],
        pos_reasons: List[str],
        neg_reasons: List[str],
        match_summary: Optional[str] = None,
    ) -> str:
        """
        LLM에 보낼 user 프롬프트 생성
        - win_prob: 모델이 예측한 실제 승률 (0~1)
        - portion_score: 인분 점수 (같은 팀 5명의 합이 5가 되도록 정규화된 값)
        - match_summary: 경기 전체 결과/요약을 한 줄 또는 몇 줄로 정리한 텍스트
        """
        prob_percent = win_prob * 100.0
        lines: List[str] = []

        lines.append(f"[영웅] {hero_name}")
        lines.append(f"[예측 승률] {prob_percent:.1f}%")

        if portion_score is not None:
            lines.append(
                f"[인분 점수] {portion_score:.2f} 인분 "
                "(같은 팀 5명의 인분 점수 합은 항상 5가 되도록 정규화되어 있습니다.)"
            )

        # 🔹 경기 전체 요약(선택)
        if match_summary:
            lines.append("")  # 빈 줄
            lines.append("[경기 전체 요약]")
            lines.append(match_summary)

        lines.append("")  # 빈 줄

        lines.append("[승률을 올린 요인]")
        if pos_reasons:
            for r in pos_reasons:
                lines.append(f"- {r}")
        else:
            lines.append("- 두드러지는 긍정적 요인은 없습니다.")

        lines.append("\n[승률을 낮춘 요인]")
        if neg_reasons:
            for r in neg_reasons:
                lines.append(f"- {r}")
        else:
            lines.append("- 두드러지는 부정적 요인은 없습니다.")

        lines.append(
            "\n위 정보를 바탕으로, 왜 이런 승률과 인분 점수가 나왔는지 한국어로 1~2문장으로 짧게 요약해줘. "
            "새로운 내용을 상상해서 만들지 말고, 위에 있는 정보만 이용해."
        )

        return "\n".join(lines)

    def call_llm(self, prompt: str) -> str:
        """
        OpenAI ChatCompletion 호출
        """
        system_prompt = """
너는 오버워치 경기 데이터를 해설하는 전문 분석가이다.

입력으로 주어지는 내용은 다음과 같다:
1) 예측 승률, 인분 점수
2) SHAP 기반 긍정/부정 요인
3) 경기 전체 요약(각 플레이어 스탯)
4) 오버워치 배경 지식

설명 원칙:
- 새로운 내용을 상상하거나 데이터에 없는 사실을 만들어내지 않는다.
- SHAP 기반으로 설명된 ‘긍정/부정 요인’을 가장 우선적으로 해석한다.
- 경기 전체 스탯과 배경지식은 SHAP 요인을 보조적으로 설명할 때만 사용한다.
- 조합 상성이나 역할군 상호작용은 match_summary와 배경지식에 기반할 경우에만 언급한다.
- 플레이 피드백은 실제 수치 또는 조합 상황으로 정당화할 수 있을 때만 제시한다.

출력 형식:
- 3~4문장으로만 구성한다.
- 1문장은 반드시 SHAP 기반 원인 요약
- 1문장은 경기 전체 스탯을 활용한 맥락적 설명
- 1문장은 조합/상성 또는 전략적 피드백을 제시""".strip()

#         system_prompt = """
# 너는 오버워치 경기 데이터를 해설하는 분석가이다.
# 입력으로 주어지는 승률 예측, 인분 점수, feature 설명, 경기 전체 요약(각 플레이어의 스탯 정보), 오버워치 배경 지식을 사용해서,
# 오버워치 영웅별 정보를 바탕으로 영웅을 해석할 때 참고하고, 오버워치 조합 정보를 바탕으로 각 팀의 조합에 대해 평가해라.
# 인분 점수는 높을수록 잘했다고 평가한 것이다. 1인분이 기준이다.
# 마지막에는 아쉬운 점이 있다면 피드백을 해줘. 딜을 더 넣어야했다거나 킬이 모자르다거나 아니면 조합이 안맞거나 영웅의 상성이 안좋아 바꿨어야했다거나 등등 경기 전반적으로 아쉬운 점을 피드백해줘.
# 해당 영웅의 조합/상황이 왜 이런 결과를 가지는지 한국어로 3~4문장으로 짧게 설명한다.

# 규칙:
# - 3~4문장으로만 출력한다.
# - 새로운 사실을 상상해서 덧붙이지 않는다.
# - 다음에 집중해라 : 
#   1. 입력으로 주어진 '요인'과 '경기 전체 요약'을 자연스럽게 요약하는 것
#   2. 팀의 조합이 맞는지, 안맞는다면 누가 안맞는지와 그로인한 어떠한 이익 또는 손해가 생기는지 
#   3. 상대팀의 영웅 또는 조합에 대한 상성관계는 어떠한지
#   4. 추가적으로 어떻게 플레이를 했어야 하는지 피드백.
# """.strip()

        messages = [
            {"role": "system", "content": system_prompt},
        ]

        # overatch_knowledge.txt에 저장된 배경 지식을 추가 system 메시지로 넣기
        # 여기서 매 호출마다 최신 파일 읽기
        ow_knowledge = load_ow_knowledge()
        if ow_knowledge:
            messages.append(
                {
                    "role": "system",
                    "content": (
                        "다음은 오버워치 관련 배경 지식이다. "
                        "경기 데이터를 보고 배경 지식을 바탕으로 경기의 결과를 해석해라. "
                        "맥락 이해를 위해서만 참고하고, 위에서 주어진 수치/피처 설명과 "
                        "모순되는 내용은 사용하지 마라:\n" + ow_knowledge
                    ),
                }
            )

        messages.append({"role": "user", "content": prompt})

        resp = client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=0.2,
            max_tokens=160,
        )
        return resp.choices[0].message.content.strip()

    # ---------- 외부에서 쓰는 메인 메서드 ----------

    def explain_from_local_and_match(
        self,
        hero_name: str,
        win_prob: float,
        portion_score: Optional[float],
        df_local: pd.DataFrame,
        match_summary: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> dict:
        """
        hero_name, win_prob, portion_score, df_local(feature/value/shap_value),
        match_summary(경기 전체 요약 텍스트)를 받아
        - pos/neg reason 리스트
        - LLM 요약 문장
        을 dict로 반환.
        """
        pos_reasons, neg_reasons = self.build_reason_sentences(df_local, top_k=top_k)
        prompt = self.build_prompt(
            hero_name=hero_name,
            win_prob=win_prob,
            portion_score=portion_score,
            pos_reasons=pos_reasons,
            neg_reasons=neg_reasons,
            match_summary=match_summary,
        )
        summary = self.call_llm(prompt)

        return {
            "hero": hero_name,
            "win_prob": float(win_prob),
            "portion_score": float(portion_score) if portion_score is not None else None,
            "pos_reasons": pos_reasons,
            "neg_reasons": neg_reasons,
            "match_summary": match_summary,
            "summary": summary,
        }
