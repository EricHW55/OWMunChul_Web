# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import pandas as pd
import joblib
import xgboost as xgb

from crop_coordinates_1k import OWScoreboardCropper
from read_number_cnn_model import OWStatsRecognizer
from hero_classification import OWHeroTemplateClassifier
from feature_transformer import OWFeatureTransformer

# 🔹 LLM 설명기
from llm_explainer import OWAlignmentExplainer, FEATURE_LABELS

app = FastAPI(title="Overwatch Win Probability Predictor")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 필요하면 도메인 좁혀도 됨
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 객체 초기화
cropper = OWScoreboardCropper()
stats_rec = OWStatsRecognizer(cropper=cropper)
hero_cls = OWHeroTemplateClassifier(cropper=cropper, threshold=0.5)
transformer = OWFeatureTransformer()
llm_explainer = OWAlignmentExplainer()  # gpt-4.1-mini 기반 설명기

# 모델 로드
try:
    artifact = joblib.load("xgb_win_model.joblib")
    model = artifact["model"]
    feature_cols = artifact["feature_cols"]
except Exception as e:
    print(f"Warning: Model loading failed - {e}")
    model = None
    feature_cols = None

# 🔹 마지막 예측 결과/특징/SHAP 저장용 전역 변수
last_features = None        # pandas DataFrame (features[feature_cols])
last_result = None          # pandas DataFrame ({hero, win_proba, raw_win_proba})
last_contribs = None        # np.ndarray, shape (n_samples, n_features + 1)

# 정규화 방법: "sum5" 또는 "softmax"
NORMALIZATION_METHOD = "sum5"


def feature_to_korean_name(feat: str) -> str:
    """피처 이름을 한글 라벨로 변환 (없으면 원래 이름 그대로)."""
    return FEATURE_LABELS.get(feat, feat)


def extract_rows_from_image(img):
    """OpenCV 이미지로부터 스탯 추출"""
    stats = stats_rec.read_all(img)
    heroes = hero_cls.classify_all(img)

    rows = []
    for team in ("blue", "red"):
        for idx, (slot_st, slot_he) in enumerate(zip(stats[team], heroes[team])):
            rows.append({
                "src_team": "unknown",
                "src_image": "uploaded",
                "team": team,
                "slot_index": idx,
                "hero": slot_he["hero_name"],
                "kills": slot_st["kills"],
                "assists": slot_st["assists"],
                "deaths": slot_st["deaths"],
                "damage": slot_st["damage"],
                "heal": slot_st["heal"],
                "mitig": slot_st["mitig"],
            })

    return pd.DataFrame(rows)


def normalize_team_scores(win_p: np.ndarray, method: str = "sum5") -> np.ndarray:
    """
    win_p: 길이 10 (0~4: blue, 5~9: red)
    return: 팀별 합이 5가 되도록 정규화된 점수
    """
    win_p = np.asarray(win_p, dtype=float)
    blue = win_p[:5].copy()
    red = win_p[5:10].copy()

    if method == "softmax":
        def softmax(x):
            x = x - np.max(x)
            ex = np.exp(x)
            s = ex.sum()
            if s <= 0:
                return np.ones_like(x) / len(x)
            return ex / s

        blue_s = softmax(blue) * 5.0
        red_s = softmax(red) * 5.0

    else:  # "sum5" : 선형 스케일링으로 합을 5로 맞춤
        blue_s = blue
        red_s = red
        bsum = blue_s.sum()
        rsum = red_s.sum()
        if bsum > 0:
            blue_s = blue_s * 5.0 / bsum
        if rsum > 0:
            red_s = red_s * 5.0 / rsum

    return np.concatenate([blue_s, red_s])


def predict_win_probability(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    승률 예측 + 전역 상태 업데이트
    return: DataFrame with columns [hero, win_proba, raw_win_proba]
    """
    global last_features, last_result, last_contribs

    # feature 변환
    features = transformer.transform(df_raw, drop_id_cols=True)
    X = features[feature_cols]

    # 원시 승률 (0~1)
    raw_win_p = model.predict_proba(X)[:, 1]

    # 팀별 정규화 (합이 5가 되도록)
    norm_win_p = normalize_team_scores(raw_win_p, method= NORMALIZATION_METHOD)

    heroes = df_raw["hero"].astype(str).values

    result = pd.DataFrame({
        "hero": heroes,
        "win_proba": norm_win_p,
        "raw_win_proba": raw_win_p,
    })

    # 🔹 XGBoost 내장 SHAP (Tree SHAP) 계산
    booster = model.get_booster()
    dmat = xgb.DMatrix(X.values, feature_names=feature_cols)
    contribs = booster.predict(dmat, pred_contribs=True)  # (n_samples, n_features + 1)

    # 전역 상태 업데이트 (나중에 /explain에서 사용)
    last_features = X
    last_result = result
    last_contribs = contribs

    return result


@app.get("/")
def read_root():
    return {"message": "Overwatch Win Probability API", "status": "running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    이미지 업로드 및 승률 예측
    응답: 각 영웅별 hero, win_probability 만 반환
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    # 파일 검증
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # 이미지 읽기
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # 스탯 추출
        df_raw = extract_rows_from_image(img)

        # 승률 예측 (전역 상태도 같이 업데이트)
        result = predict_win_probability(df_raw)

        # JSON 형식으로 변환 (hero, win_probability만)
        players = []
        for idx, row in result.iterrows():
            players.append({
                "index": idx,  # 0~4: blue, 5~9: red
                "team": "blue" if idx < 5 else "red",
                "hero": row["hero"],
                "win_probability": round(float(row["win_proba"]), 4),
            })

        return JSONResponse({
            "success": True,
            "players": players,
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.get("/explain")
def explain_player(player_index: int, top_k: int = 5):
    """
    마지막 /predict 요청 기준으로,
    특정 플레이어(player_index)의 SHAP 기반 feature 기여도 + LLM 요약 반환.

    player_index: 0~4 (blue), 5~9 (red)
    """
    if last_result is None or last_features is None or last_contribs is None:
        raise HTTPException(status_code=400, detail="No prediction available. Call /predict first.")

    n_players = last_result.shape[0]
    if player_index < 0 or player_index >= n_players:
        raise HTTPException(status_code=400, detail=f"player_index must be between 0 and {n_players - 1}")

    # 해당 플레이어의 SHAP 값
    row_contrib = last_contribs[player_index, :-1]  # bias 제외
    bias = float(last_contribs[player_index, -1])
    row_feat_vals = last_features.iloc[player_index].values

    df_local = (
        pd.DataFrame({
            "feature": feature_cols,
            "value": row_feat_vals,
            "shap_value": row_contrib,
        })
        .sort_values("shap_value", ascending=False)
    )

    # 승률을 올린/깎은 feature 나누기 (한국어 라벨 포함)
    pos = df_local[df_local["shap_value"] > 0].head(top_k)
    neg = df_local[df_local["shap_value"] < 0].tail(top_k)  # desc 정렬이므로 tail이 가장 음수쪽

    top_positive = []
    for _, r in pos.iterrows():
        feat_key = str(r["feature"])
        top_positive.append({
            "feature_key": feat_key,                          # 원래 피처 이름
            "feature": feature_to_korean_name(feat_key),      # 한글 라벨
            "value": float(r["value"]),
            "shap_value": float(r["shap_value"]),
        })

    top_negative = []
    for _, r in neg.iterrows():
        feat_key = str(r["feature"])
        top_negative.append({
            "feature_key": feat_key,
            "feature": feature_to_korean_name(feat_key),
            "value": float(r["value"]),
            "shap_value": float(r["shap_value"]),
        })

    hero_name = str(last_result.iloc[player_index]["hero"])
    win_p = float(last_result.iloc[player_index]["win_proba"])
    raw_win_p = float(last_result.iloc[player_index]["raw_win_proba"])

    # 🔹 LLM 요약 생성 (실패해도 API 전체는 살아있게 try/except)
    try:
        llm_result = llm_explainer.explain_from_df_local(
            hero_name=hero_name,
            win_prob=raw_win_p,   # raw 승률 기준 설명 (원하면 win_p로 바꿔도 됨)
            df_local=df_local,
            top_k=top_k,
        )
        llm_summary = llm_result["summary"]
    except Exception as e:
        llm_summary = f"LLM explanation unavailable: {e}"

    return JSONResponse({
        "success": True,
        "player_index": player_index,
        "team": "blue" if player_index < 5 else "red",
        "hero": hero_name,
        "win_probability": round(win_p, 4),
        "raw_win_probability": round(raw_win_p, 4),
        "bias": bias,
        "top_positive": top_positive,
        "top_negative": top_negative,
        "llm_summary": llm_summary,
    })


@app.get("/health")
def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
