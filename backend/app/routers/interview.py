from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
import random
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.schemas.interview import StartInterviewRequest, SubmitAnswerRequest
from app.services.ai_service import evaluate_answer, generate_follow_up, generate_report

router = APIRouter(prefix="/api/interview", tags=["interview"])

QUESTION_BANK = {
    "behavioral": [
        {"text": "Tell me about yourself and why you're applying for this role.", "category": "intro", "duration": 120},
        {"text": "Describe a time you had a conflict with a colleague. How did you resolve it?", "category": "conflict", "duration": 150},
        {"text": "Tell me about your greatest professional achievement.", "category": "achievement", "duration": 150},
        {"text": "Describe a situation where you had to lead without formal authority.", "category": "leadership", "duration": 150},
        {"text": "Tell me about a time you failed. What did you learn?", "category": "growth", "duration": 120},
        {"text": "How do you handle working under pressure and tight deadlines?", "category": "stress", "duration": 120},
    ],
    "technical": [
        {"text": "Explain the difference between a process and a thread.", "category": "os", "duration": 120},
        {"text": "How would you design a URL shortening service like bit.ly?", "category": "system_design", "duration": 300},
        {"text": "What is the time complexity of quicksort and when would you avoid it?", "category": "algorithms", "duration": 120},
        {"text": "Explain CAP theorem and give a real-world example.", "category": "distributed", "duration": 150},
        {"text": "How does garbage collection work in modern languages?", "category": "memory", "duration": 120},
    ],
    "hr": [
        {"text": "Where do you see yourself in 5 years?", "category": "career", "duration": 90},
        {"text": "Why do you want to leave your current role?", "category": "motivation", "duration": 90},
        {"text": "What's your expected salary range?", "category": "compensation", "duration": 60},
        {"text": "How do you handle pressure and tight deadlines?", "category": "stress", "duration": 120},
        {"text": "What do you know about our company and why do you want to join us?", "category": "research", "duration": 120},
    ],
    "system_design": [
        {"text": "Design a distributed cache system like Redis.", "category": "caching", "duration": 300},
        {"text": "How would you design Twitter's newsfeed?", "category": "social", "duration": 300},
        {"text": "Design a ride-sharing backend like Uber.", "category": "realtime", "duration": 300},
        {"text": "How would you build a notification service handling 1M messages/day?", "category": "messaging", "duration": 300},
    ],
    "case": [
        {"text": "Estimate the number of piano tuners in New York City.", "category": "estimation", "duration": 180},
        {"text": "Our revenue dropped 20% last quarter. Walk me through how you'd diagnose this.", "category": "diagnosis", "duration": 240},
        {"text": "How would you improve our mobile app's retention rate?", "category": "product", "duration": 240},
    ],
}

def select_questions(interview_type: str, duration_minutes: int) -> list:
    bank = QUESTION_BANK.get(interview_type, QUESTION_BANK["behavioral"])
    num = max(3, min(len(bank), duration_minutes // 3))
    selected = random.sample(bank, min(num, len(bank)))
    return [{"id": str(ObjectId()), **q} for q in selected]


@router.post("/start")
async def start_interview(
    data: StartInterviewRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    questions = select_questions(data.type, data.duration_minutes)

    session_doc = {
        "user_id": str(current_user["_id"]),
        "type": data.type,
        "domain": data.domain,
        "difficulty": data.difficulty,
        "duration_minutes": data.duration_minutes,
        "status": "active",
        "job_description": data.job_description,
        "questions": questions,
        "answers": [],
        "overall_score": None,
        "percentile": None,
        "report": None,
        "started_at": datetime.utcnow(),
        "ended_at": None,
    }
    result = await db.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)

    return {
        "session_id": session_id,
        "questions": questions,
        "message": "Interview started. Good luck!",
    }


@router.post("/session/{session_id}/answer")
async def submit_answer(
    session_id: str,
    data: SubmitAnswerRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    session = await db.sessions.find_one({
        "_id": ObjectId(session_id),
        "user_id": str(current_user["_id"]),
        "status": "active",
    })
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")

    # AI evaluation
    eval_result = evaluate_answer(
        question=data.question_text,
        answer=data.answer,
        interview_type=session["type"],
        domain=session["domain"],
    )
    scores = eval_result.get("scores", {})
    cheating = eval_result.get("cheating", {})

    answer_doc = {
        "question_id": data.question_id,
        "question_text": data.question_text,
        "transcript": data.answer,
        "duration_seconds": data.duration_seconds,
        "score_overall": scores.get("overall"),
        "score_clarity": scores.get("clarity"),
        "score_depth": scores.get("depth"),
        "score_relevance": scores.get("relevance"),
        "score_structure": scores.get("structure"),
        "ai_feedback": eval_result.get("feedback"),
        "strengths": eval_result.get("strengths", []),
        "improvements": eval_result.get("improvements", []),
        "ideal_answer_hint": eval_result.get("ideal_answer_hint"),
        "cheating_suspicious": cheating.get("suspicious", False),
        "cheating_confidence": cheating.get("confidence", 0.0),
        "cheating_flags": cheating.get("flags", []),
        "submitted_at": datetime.utcnow(),
    }

    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"answers": answer_doc}}
    )

    follow_up = generate_follow_up(data.question_text, data.answer, session["domain"])

    return {
        "answer_id": data.question_id,
        "score": {
            "overall": scores.get("overall", 75),
            "clarity": scores.get("clarity", 75),
            "depth": scores.get("depth", 75),
            "relevance": scores.get("relevance", 75),
            "structure": scores.get("structure", 75),
            "feedback": eval_result.get("feedback", ""),
            "strengths": eval_result.get("strengths", []),
            "improvements": eval_result.get("improvements", []),
            "ideal_answer_hint": eval_result.get("ideal_answer_hint", ""),
            "cheating_signals": cheating,
        },
        "follow_up": follow_up,
    }


@router.post("/session/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    session = await db.sessions.find_one({
        "_id": ObjectId(session_id),
        "user_id": str(current_user["_id"]),
    })
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = session.get("answers", [])
    session_data = {
        "type": session["type"],
        "domain": session["domain"],
        "difficulty": session["difficulty"],
        "answers": [
            {
                "question": a["question_text"],
                "answer": a["transcript"],
                "duration_seconds": a["duration_seconds"],
                "scores": {
                    "overall": a.get("score_overall"),
                    "clarity": a.get("score_clarity"),
                    "depth": a.get("score_depth"),
                },
            }
            for a in answers
        ],
    }

    report_data = generate_report(session_data)
    avg_score = sum(a.get("score_overall") or 0 for a in answers) / max(len(answers), 1)

    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "status": "completed",
            "ended_at": datetime.utcnow(),
            "overall_score": report_data.get("overall_score", avg_score),
            "percentile": report_data.get("percentile", 50),
            "report": report_data,
        }}
    )
    return {"message": "Session completed", "session_id": session_id}


@router.get("/session/{session_id}/report")
async def get_report(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    session = await db.sessions.find_one({
        "_id": ObjectId(session_id),
        "user_id": str(current_user["_id"]),
    })
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.get("report"):
        raise HTTPException(status_code=404, detail="Report not generated yet")

    answers = session.get("answers", [])
    breakdowns = [
        {
            "question": {"text": a["question_text"], "id": a["question_id"]},
            "transcript": a["transcript"],
            "scores": {
                "overall": a.get("score_overall"),
                "clarity": a.get("score_clarity"),
                "depth": a.get("score_depth"),
                "relevance": a.get("score_relevance"),
                "structure": a.get("score_structure"),
            },
            "feedback": a.get("ai_feedback"),
            "strengths": a.get("strengths", []),
            "improvements": a.get("improvements", []),
            "ideal_hint": a.get("ideal_answer_hint"),
            "cheating_signals": {
                "suspicious": a.get("cheating_suspicious", False),
                "confidence": a.get("cheating_confidence", 0.0),
                "flags": a.get("cheating_flags", []),
            },
        }
        for a in answers
    ]

    report = session["report"]
    return {
        "session_id": session_id,
        "overall_score": session.get("overall_score"),
        "percentile": session.get("percentile"),
        "summary": report.get("summary"),
        "competency_scores": report.get("competency_scores", {}),
        "top_strengths": report.get("top_strengths", []),
        "top_improvements": report.get("top_improvements", []),
        "recommended_resources": report.get("recommended_resources", []),
        "question_breakdowns": breakdowns,
        "generated_at": session.get("ended_at", datetime.utcnow()).isoformat(),
    }


@router.get("/sessions")
async def list_sessions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.sessions.find(
        {"user_id": str(current_user["_id"])},
        sort=[("started_at", -1)],
        limit=20,
    )
    sessions = await cursor.to_list(length=20)
    return [
        {
            "id": str(s["_id"]),
            "type": s["type"],
            "domain": s["domain"],
            "difficulty": s["difficulty"],
            "status": s["status"],
            "score": s.get("overall_score"),
            "started_at": s["started_at"].isoformat(),
        }
        for s in sessions
    ]
