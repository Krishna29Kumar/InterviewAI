from pydantic import BaseModel
from typing import Optional, List

class StartInterviewRequest(BaseModel):
    type: str
    domain: str
    difficulty: str
    duration_minutes: int = 30
    job_description: Optional[str] = None

class SubmitAnswerRequest(BaseModel):
    question_id: str
    question_text: str
    answer: str
    duration_seconds: int = 60
