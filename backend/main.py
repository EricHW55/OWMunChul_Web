# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import pandas as pd
import joblib
import os
from io import BytesIO

from crop_coordinates_1k import OWScoreboardCropper
from read_number_cnn_model import OWStatsRecognizer
from hero_classification import OWHeroTemplateClassifier
from feature_transformer import OWFeatureTransformer

app = FastAPI(title="Overwatch Win Probability Predictor")

# CORS 설정 (React 개발 서버용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 객체 초기화
cropper = OWScoreboardCropper()
stats_rec = OWStatsRecognizer(cropper=cropper)
hero_cls = OWHeroTemplateClassifier(cropper=cropper, threshold=0.5)
transformer = OWFeatureTransformer()

# 모델 로드
try:
    artifact = joblib.load("xgb_win_model.joblib")
    model = artifact["model"]
    feature_cols = artifact["feature_cols"]
except Exception as e:
    print(f"Warning: Model loading failed - {e}")
    model = None
    feature_cols = None


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


def predict_win_probability(df_raw):
    """승률 예측"""
    features = transformer.transform(df_raw, drop_id_cols=True)
    win_p = model.predict_proba(features[feature_cols])[:, 1]

    heroes = df_raw["hero"].astype(str).values
    
    # 팀별 정규화
    result = pd.DataFrame({"hero": heroes, "win_proba": win_p})
    
    blue_sum = result.iloc[:5]["win_proba"].sum()
    red_sum = result.iloc[5:10]["win_proba"].sum()
    
    if blue_sum > 0:
        result.loc[:4, "win_proba"] *= 5 / blue_sum
    if red_sum > 0:
        result.loc[5:9, "win_proba"] *= 5 / red_sum
    
    return result


@app.get("/")
def read_root():
    return {"message": "Overwatch Win Probability API", "status": "running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """이미지 업로드 및 승률 예측"""
    
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
        
        # 승률 예측
        result = predict_win_probability(df_raw)
        
        # JSON 형식으로 변환
        blue_team = []
        red_team = []
        
        for idx, row in result.iterrows():
            player_data = {
                "hero": row["hero"],
                "win_probability": round(float(row["win_proba"]), 4),
                "kills": int(df_raw.iloc[idx]["kills"]),
                "assists": int(df_raw.iloc[idx]["assists"]),
                "deaths": int(df_raw.iloc[idx]["deaths"]),
                "damage": int(df_raw.iloc[idx]["damage"]),
                "heal": int(df_raw.iloc[idx]["heal"]),
                "mitig": int(df_raw.iloc[idx]["mitig"]),
            }
            
            if idx < 5:
                blue_team.append(player_data)
            else:
                red_team.append(player_data)
        
        # 팀 평균 승률
        blue_avg = round(sum(p["win_probability"] for p in blue_team) / 5, 4)
        red_avg = round(sum(p["win_probability"] for p in red_team) / 5, 4)
        
        return JSONResponse({
            "success": True,
            "blue_team": blue_team,
            "red_team": red_team,
            "team_averages": {
                "blue": blue_avg,
                "red": red_avg
            }
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


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