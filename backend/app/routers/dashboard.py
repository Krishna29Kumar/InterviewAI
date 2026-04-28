from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from app.core.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    sessions = await db.sessions.find(
        {"user_id": user_id, "status": "completed"}
    ).to_list(length=100)

    total = len(sessions)
    avg_score = sum(s.get("overall_score") or 0 for s in sessions) / max(total, 1)

    week_ago = datetime.utcnow() - timedelta(days=7)
    this_week = len([s for s in sessions if s["started_at"] >= week_ago])

    # Streak
    streak = 0
    today = datetime.utcnow().date()
    for i in range(30):
        day = today - timedelta(days=i)
        if any(s["started_at"].date() == day for s in sessions):
            streak += 1
        elif i > 0:
            break

    score_history = [
        {"date": s["started_at"].strftime("%a"), "score": round(s.get("overall_score") or 0)}
        for s in sorted(sessions, key=lambda x: x["started_at"])[-10:]
    ]

    domain_counts = {}
    for s in sessions:
        domain_counts[s["domain"]] = domain_counts.get(s["domain"], 0) + 1
    top_domain = max(domain_counts, key=domain_counts.get) if domain_counts else "N/A"

    recent = sorted(sessions, key=lambda x: x["started_at"], reverse=True)[:5]

    return {
        "total_sessions": total,
        "avg_score": round(avg_score, 1),
        "sessions_this_week": this_week,
        "streak_days": streak,
        "top_domain": top_domain,
        "score_history": score_history,
        "recent_sessions": [
            {
                "id": str(s["_id"]),
                "type": s["type"],
                "domain": s["domain"],
                "score": round(s.get("overall_score") or 0),
                "date": s["started_at"].isoformat(),
                "duration": f"{s['duration_minutes']} min",
            }
            for s in recent
        ],
    }
