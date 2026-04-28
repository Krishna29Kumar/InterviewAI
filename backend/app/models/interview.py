from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class QuestionModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    text: str
    category: str
    domain: str
    difficulty: str
    interview_type: str
    expected_duration_seconds: int = 120

    class Config:
        populate_by_name = True

class AnswerModel(BaseModel):
    question_id: str
    question_text: str
    transcript: str
    duration_seconds: int = 0
    score_overall: Optional[float] = None
    score_clarity: Optional[float] = None
    score_depth: Optional[float] = None
    score_relevance: Optional[float] = None
    score_structure: Optional[float] = None
    ai_feedback: Optional[str] = None
    strengths: List[str] = []
    improvements: List[str] = []
    ideal_answer_hint: Optional[str] = None
    cheating_suspicious: bool = False
    cheating_confidence: float = 0.0
    cheating_flags: List[str] = []
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

class SessionModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    type: str
    domain: str
    difficulty: str
    duration_minutes: int = 30
    status: str = "active"
    job_description: Optional[str] = None
    questions: List[QuestionModel] = []
    answers: List[AnswerModel] = []
    overall_score: Optional[float] = None
    percentile: Optional[float] = None
    report: Optional[dict] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
