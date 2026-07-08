"""
FILE: backend/app/routers/anomaly.py
=====================================
Pose detection ka FastAPI router.

Endpoint:
  POST /anomaly/analyze   ← React se frame aata hai
  GET  /anomaly/health    ← Express check karta hai
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.services.cheating_detector import analyze_frame

router = APIRouter(prefix="/anomaly", tags=["anomaly"])


class FrameIn(BaseModel):
    image: str  # base64 JPEG string from browser canvas


@router.get("/health")
def health():
    return {"status": "ok", "service": "yolov8n-pose"}


@router.post("/analyze")
async def analyze(body: FrameIn):
    if not body.image:
        return JSONResponse(status_code=400,
                            content={"error": "image field required"})
    result = analyze_frame(body.image)
    return result
