# read_number_cnn_model.py

import os
import cv2
import numpy as np
import onnxruntime as ort

from crop_coordinates_1k import OWScoreboardCropper

# ====== 하이퍼파라미터 ====== #
MAX_LEN = 5
NUM_CLASSES = 11   # 0~9 + blank
BLANK = 10

TARGET_H = 32
TARGET_W = 128


# ====== 전처리 (ONNX 입력용) ====== #
def preprocess_crop_to_input(crop: np.ndarray) -> np.ndarray:
    """
    crop: BGR 이미지 (H, W, 3)
    return: (1, 1, TARGET_H, TARGET_W) float32 numpy 배열
    """
    if crop is None or crop.size == 0:
        raise RuntimeError("Empty crop")

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # 세로 크기를 TARGET_H에 맞추고 가로는 비율 유지
    scale = TARGET_H / float(h)
    new_w = max(1, int(w * scale))

    interp = cv2.INTER_CUBIC if scale > 1.0 else cv2.INTER_AREA
    resized = cv2.resize(gray, (new_w, TARGET_H), interpolation=interp)

    # 가로가 TARGET_W보다 크면 줄이고, 작으면 양쪽 패딩
    if new_w > TARGET_W:
        resized = cv2.resize(resized, (TARGET_W, TARGET_H),
                             interpolation=cv2.INTER_AREA)
    else:
        pad_left = (TARGET_W - new_w) // 2
        pad_right = TARGET_W - new_w - pad_left
        resized = cv2.copyMakeBorder(
            resized, 0, 0, pad_left, pad_right,
            borderType=cv2.BORDER_CONSTANT,
            value=0
        )

    # [0, 255] -> [0, 1]
    resized = resized.astype(np.float32) / 255.0

    # (H, W) -> (1, 1, H, W)
    return resized[None, None, :, :]


# ====== 디코더 (numpy 버전) ====== #
def decode_digits(logits: np.ndarray) -> int:
    """
    logits: (1, MAX_LEN, NUM_CLASSES) 형태의 numpy 배열이라고 가정
    """
    # 안정적인 softmax
    # shape: (1, MAX_LEN, NUM_CLASSES)
    logits_max = logits.max(axis=-1, keepdims=True)
    exp = np.exp(logits - logits_max)
    probs = exp / exp.sum(axis=-1, keepdims=True)

    preds = probs.argmax(axis=-1)[0].tolist()  # 첫 배치만 사용

    digits = [str(p) for p in preds if p != BLANK]
    if not digits:
        return 0

    try:
        return int("".join(digits))
    except Exception:
        return 0


# ====== 메인 OCR 클래스 (ONNX Runtime 사용) ====== #
class OWStatsRecognizer:
    def __init__(
        self,
        cropper=None,
        ckpt_path: str = "checkpoints/score_number_net.onnx",
    ):
        """
        ckpt_path: ONNX 파일 경로 (예: checkpoints/score_number_net.onnx)
        """
        self.cropper = cropper or OWScoreboardCropper()

        if not os.path.exists(ckpt_path):
            raise FileNotFoundError(ckpt_path)

        # ONNX Runtime 세션 생성
        self.session = ort.InferenceSession(
            ckpt_path,
            providers=["CPUExecutionProvider"],
        )

        # 입력/출력 이름 자동으로 추출
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

        self.stat_keys = ["kills", "assists", "deaths", "damage", "heal", "mitig"]

        print("[INFO] ONNX checkpoint loaded:", ckpt_path)

    def _crop_from_norm(self, img_norm, box):
        x0, y0, x1, y1 = box
        return img_norm[y0:y1, x0:x1]

    def _ocr(self, crop) -> int:
        """
        단일 스탯 박스에 대한 OCR
        """
        try:
            x = preprocess_crop_to_input(crop)
        except RuntimeError:
            return 0

        # ONNX 추론
        outputs = self.session.run(
            [self.output_name],
            {self.input_name: x},
        )[0]  # shape: (1, MAX_LEN, NUM_CLASSES)

        return decode_digits(outputs)

    def read_all(self, img):
        """
        img: BGR 전체 스코어보드 이미지
        return: {"blue": [ {kills,...}, ... ], "red": [ ... ] }
        """
        boxes = self.cropper.get_player_boxes(img)
        img_norm = self.cropper.normalize_image(img)

        result = {"blue": [], "red": []}

        for team in ["blue", "red"]:
            for slot in boxes[team]:
                slot_res = {}

                for key in self.stat_keys:
                    crop = self._crop_from_norm(img_norm, slot[key])
                    value = self._ocr(crop)
                    slot_res[key] = value

                result[team].append(slot_res)

        return result


# -------- 간단 테스트 --------
if __name__ == "__main__":
    img_path = r"test1.png"
    img = cv2.imread(img_path)

    cropper = OWScoreboardCropper()
    recognizer = OWStatsRecognizer(
        cropper=cropper,
        ckpt_path="checkpoints/score_number_net.onnx",
    )

    stats = recognizer.read_all(img)
    print("blue:", stats["blue"])
    print("red:", stats["red"])
