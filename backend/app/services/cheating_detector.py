"""
Cheating Detection Service
Three signals combined into a confidence score:

1. Behavioral signals  — response latency, speech pace, pause patterns
2. Perplexity scoring  — LLM rates how "surprising" each sentence is
3. Semantic similarity — compare against known answer templates (Month 3+)

Note: No scipy/numpy dependency — pure Python + Claude API only.
"""
import re
from typing import Optional
from app.core.config import settings
from ultralytics import YOLO
import numpy as np
import cv2
import base64
import time
from collections import deque

# ─────────────────────────────────────────
# Model load karo (pehli baar auto-download hoga ~6MB)
# ─────────────────────────────────────────
model = YOLO('yolov8n-pose.pt')

# COCO 17 keypoint indices
NOSE           = 0
LEFT_EYE       = 1
RIGHT_EYE      = 2
LEFT_EAR       = 3
RIGHT_EAR      = 4
LEFT_SHOULDER  = 5
RIGHT_SHOULDER = 6
LEFT_ELBOW     = 7
RIGHT_ELBOW    = 8
LEFT_WRIST     = 9
RIGHT_WRIST    = 10
LEFT_HIP       = 11
RIGHT_HIP      = 12

# Flickering rokne ke liye last 5 frames ki history
_history: deque = deque(maxlen=5)


# ─────────────────────────────────────────
# Helper functions
# ─────────────────────────────────────────
def _decode(b64: str):
    if ',' in b64:
        b64 = b64.split(',')[1]
    buf = base64.b64decode(b64)
    arr = np.frombuffer(buf, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _kp(kps, confs, idx, min_conf=0.40):
    """Keypoint lo agar confidence enough hai."""
    return kps[idx] if confs[idx] >= min_conf else None


def _dist(a, b):
    return float(np.linalg.norm(np.array(a, dtype=float) - np.array(b, dtype=float)))


# ─────────────────────────────────────────
# MAIN FUNCTION
# ─────────────────────────────────────────
def analyze_frame(image_b64: str) -> dict:
    t0 = time.time()

    # 1. Image decode
    try:
        frame = _decode(image_b64)
        if frame is None:
            raise ValueError("decode fail")
    except Exception as e:
        return {
            "anomalies": ["frame_decode_error"],
            "score": 100, "details": {"err": str(e)},
            "person_count": 0, "ms": 0
        }

    H, W = frame.shape[:2]

    # 2. YOLOv8n inference
    res = model(frame, verbose=False, conf=0.30)

    anomalies = []
    details   = {}

    # 3. Koi banda nahi
    if (not res or res[0].keypoints is None
            or len(res[0].keypoints.xy) == 0):
        return {
            "anomalies": ["no_person_detected"],
            "score": 40,
            "details": {"msg": "Camera mein koi nahi dikh raha"},
            "person_count": 0,
            "ms": round((time.time() - t0) * 1000)
        }

    n_persons = len(res[0].keypoints.xy)
    details["person_count"] = n_persons

    # 4. Multiple people
    if n_persons > 1:
        anomalies.append("multiple_people")

    # Primary person
    kps   = res[0].keypoints.xy[0].cpu().numpy()
    confs = res[0].keypoints.conf[0].cpu().numpy()

    nose  = _kp(kps, confs, NOSE)
    leye  = _kp(kps, confs, LEFT_EYE)
    reye  = _kp(kps, confs, RIGHT_EYE)
    lear  = _kp(kps, confs, LEFT_EAR)
    rear  = _kp(kps, confs, RIGHT_EAR)
    lsh   = _kp(kps, confs, LEFT_SHOULDER)
    rsh   = _kp(kps, confs, RIGHT_SHOULDER)
    lw    = _kp(kps, confs, LEFT_WRIST,  0.45)
    rw    = _kp(kps, confs, RIGHT_WRIST, 0.45)
    le    = _kp(kps, confs, LEFT_ELBOW,  0.40)
    re    = _kp(kps, confs, RIGHT_ELBOW, 0.40)

    # ── CHECK: Face turned away / looking sideways ──
    if nose is not None and leye is not None and reye is not None:
        eye_cx = (leye[0] + reye[0]) / 2
        eye_cy = (leye[1] + reye[1]) / 2
        face_w = (_dist(lear, rear) if (lear is not None and rear is not None)
                  else _dist(leye, reye) * 3.5)
        face_w = max(face_w, 30)

        h_off = abs(float(nose[0]) - float(eye_cx)) / face_w
        v_off = (float(nose[1]) - float(eye_cy)) / face_w

        details["face_h_off"] = round(h_off, 3)
        details["face_v_off"] = round(v_off, 3)

        if h_off > 0.22:
            anomalies.append("face_turned_away")
            details["turn_dir"] = "right" if nose[0] > eye_cx else "left"
        if v_off > 0.42:
            anomalies.append("looking_down")

    # ── CHECK: Eyes not on screen (face ke frame pe position) ──
    if leye is not None and reye is not None:
        fcx = (leye[0] + reye[0]) / 2
        fcy = (leye[1] + reye[1]) / 2
        if fcx < W * 0.18:
            anomalies.append("eyes_not_on_screen"); details["gaze"] = "far_left"
        elif fcx > W * 0.82:
            anomalies.append("eyes_not_on_screen"); details["gaze"] = "far_right"
        elif fcy < H * 0.08:
            anomalies.append("eyes_not_on_screen"); details["gaze"] = "far_up"

    # ── CHECK: Posture — slouch, lean, uneven shoulders ──
    if lsh is not None and rsh is not None:
        tilt  = abs(float(lsh[1]) - float(rsh[1]))
        s_w   = _dist(lsh, rsh)
        details["sh_tilt"] = round(tilt)

        if tilt > s_w * 0.22:
            anomalies.append("uneven_shoulders")

        lean_ratio = abs((lsh[0] + rsh[0]) / 2 - W / 2) / W
        if lean_ratio > 0.22:
            anomalies.append("leaning_sideways")

        if nose is not None:
            n2s = float(((lsh[1] + rsh[1]) / 2) - nose[1])
            details["nose_to_sh"] = round(n2s)
            if n2s < 45:
                anomalies.append("slouching")

    # ── CHECK: Hand near face ──
    hand_flagged = False
    if nose is not None:
        for w_kp, side in [(lw, "left"), (rw, "right")]:
            if w_kp is not None and _dist(w_kp, nose) < 90:
                anomalies.append("hand_near_face")
                details["hand_side"] = side
                hand_flagged = True
                break

    # ── CHECK: Excessive hand gesture (wrist too high) ──
    if not hand_flagged:
        for w_kp in [lw, rw]:
            if w_kp is not None and float(w_kp[1]) < H * 0.12:
                anomalies.append("excessive_hand_gesture")
                break

    # ── CHECK: Arms out of frame ──
    for e_kp in [le, re]:
        if e_kp is not None:
            if float(e_kp[0]) < W * 0.04 or float(e_kp[0]) > W * 0.96:
                anomalies.append("arms_out_of_frame")
                break

    # ── CHECK: Too far / too close ──
    if lsh is not None or rsh is not None:
        sy = float((lsh[1] if lsh is not None else rsh[1]))
        if sy > H * 0.88: anomalies.append("too_far_from_camera")
    if nose is not None and float(nose[1]) < H * 0.05:
        anomalies.append("too_close_to_camera")

    # ── SCORE ──
    cuts = {
        "no_person_detected": 35, "multiple_people": 30,
        "face_turned_away": 25,   "eyes_not_on_screen": 22,
        "looking_down": 18,       "hand_near_face": 22,
        "slouching": 15,          "uneven_shoulders": 10,
        "leaning_sideways": 10,   "excessive_hand_gesture": 12,
        "arms_out_of_frame": 8,   "too_far_from_camera": 10,
        "too_close_to_camera": 8,
    }
    anomalies = list(set(anomalies))
    score = max(0, 100 - sum(cuts.get(a, 10) for a in anomalies))

    # Smoothing — sirf stable anomalies report karo
    _history.append(set(anomalies))
    if len(_history) >= 2:
        anomalies = [a for a in anomalies
                     if sum(1 for h in _history if a in h) >= 2]

    return {
        "anomalies":    anomalies,
        "score":        score,
        "details":      details,
        "person_count": n_persons,
        "ms":           round((time.time() - t0) * 1000),
    }


try:
    import anthropic
    _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
except ImportError:
    _client = None


# ── Signal 1: Behavioral ──────────────────────────────────────────────────────

def behavioral_score(transcript: str, duration_seconds: int, question_text: str) -> dict:
    """
    Returns a suspicion score (0-1) based on:
    - Words per second (natural speech = 2-3 wps; reading = 3.5+ wps)
    - Filler word presence (um, uh, like, you know)
    - Perfect sentence starts (AI tends to start with "Certainly", "Of course", etc.)
    - Self-corrections ("actually, let me rephrase...")
    """
    words = transcript.split()
    word_count = len(words)
    wps = word_count / max(duration_seconds, 1)

    flags = []
    suspicion = 0.0

    # Reading speed check
    if wps > 3.8:
        flags.append(f"High speech rate ({wps:.1f} words/sec — typical reading pace)")
        suspicion += 0.3

    # Filler word check (absence is suspicious in long answers)
    filler_pattern = r"\b(um|uh|like|you know|i mean|sort of|kind of|basically|actually)\b"
    filler_count = len(re.findall(filler_pattern, transcript.lower()))
    if word_count > 80 and filler_count == 0:
        flags.append("No natural filler words in a long response")
        suspicion += 0.2

    # AI-style opening
    ai_openers = ["certainly", "of course", "absolutely", "great question", "i'd be happy to"]
    if any(transcript.lower().startswith(o) for o in ai_openers):
        flags.append("Response starts with AI-style affirmation")
        suspicion += 0.25

    # Unusually perfect structure
    sentences = re.split(r'[.!?]+', transcript.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    if len(sentences) >= 4:
        perfect = sum(1 for s in sentences if s and s[0].isupper())
        if perfect / len(sentences) > 0.95:
            flags.append("Unusually uniform sentence structure")
            suspicion += 0.15

    return {
        "signal": "behavioral",
        "suspicion": min(suspicion, 1.0),
        "flags": flags,
        "wps": round(wps, 2),
        "filler_count": filler_count,
    }


# ── Signal 2: Perplexity scoring ──────────────────────────────────────────────

PERPLEXITY_PROMPT = """You are evaluating whether a spoken interview answer was generated by AI or spoken naturally by a human.

Analyze the text for these AI-generation markers:
- Unnaturally smooth transitions between ideas
- Over-structured paragraphs in what should be spoken speech
- Absence of self-corrections or reformulations
- Formulaic patterns ("Firstly... Secondly... Finally...")
- Suspiciously comprehensive coverage of all sub-points
- Lacks personal voice or conversational rhythm

Rate the likelihood this was AI-generated on a scale of 0.0 to 1.0.
Respond ONLY with JSON: {"ai_probability": 0.0-1.0, "reason": "one sentence explanation"}"""

def perplexity_score(transcript: str) -> dict:
    """Uses Claude to estimate if the answer was AI-generated."""
    if not _client or len(transcript.split()) < 30:
        return {"signal": "perplexity", "suspicion": 0.0, "flags": [], "ai_probability": 0.0}

    try:
        import json
        resp = _client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=150,
            system=PERPLEXITY_PROMPT,
            messages=[{"role": "user", "content": f"Interview answer:\n\n{transcript}"}]
        )
        raw = resp.content[0].text.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        data = json.loads(raw)
        ai_prob = data.get("ai_probability", 0.0)
        flags = [data["reason"]] if ai_prob > 0.6 else []
        return {
            "signal": "perplexity",
            "suspicion": ai_prob,
            "flags": flags,
            "ai_probability": ai_prob,
        }
    except Exception:
        return {"signal": "perplexity", "suspicion": 0.0, "flags": [], "ai_probability": 0.0}


# ── Combined detector ─────────────────────────────────────────────────────────

def detect_cheating(
    transcript: str,
    duration_seconds: int,
    question_text: str,
) -> dict:
    """
    Combine all signals into a final cheating assessment.
    Returns: { suspicious, confidence, flags, breakdown }
    """
    b = behavioral_score(transcript, duration_seconds, question_text)
    p = perplexity_score(transcript)

    # Weighted combination: perplexity carries more weight
    combined = (b["suspicion"] * 0.4) + (p["suspicion"] * 0.6)
    all_flags = b["flags"] + p["flags"]
    suspicious = combined > 0.55

    return {
        "suspicious": suspicious,
        "confidence": round(combined, 3),
        "flags": all_flags,
        "breakdown": {
            "behavioral": round(b["suspicion"], 3),
            "perplexity": round(p["suspicion"], 3),
        }
    }
