"""
AI Service — Three separate chains:
  1. interviewer_chain()   → follow-up question generation
  2. evaluator_chain()     → per-answer scoring (async, non-blocking)
  3. report_chain()        → end-of-session coaching report
"""
import json
import re
from typing import Optional
from app.core.config import settings

try:
    import anthropic
    _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
except ImportError:
    _client = None


# ── CHAIN 1: Interviewer ─────────────────────────────────────────────────────

INTERVIEWER_SYSTEM = """You are an expert professional interviewer conducting a mock interview.
Your job is to decide if you need a single follow-up question based on the candidate's answer.
If the answer is thorough (covers the key points with examples), respond with null.
If the answer is shallow or missing key details, respond with ONE concise follow-up question.
Respond ONLY with JSON: {"follow_up": "question here"} or {"follow_up": null}
Keep follow-up questions under 25 words. Be encouraging but probing."""

def generate_follow_up(question: str, answer: str, domain: str) -> Optional[str]:
    """Returns a follow-up question or None if answer is complete."""
    if not _client:
        return None  # Offline mode

    try:
        resp = _client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            system=INTERVIEWER_SYSTEM,
            messages=[{
                "role": "user",
                "content": f"Question: {question}\n\nCandidate's answer: {answer}\n\nDomain: {domain}"
            }]
        )
        data = json.loads(resp.content[0].text)
        return data.get("follow_up")
    except Exception:
        return None


# ── CHAIN 2: Evaluator ───────────────────────────────────────────────────────

EVALUATOR_SYSTEM = """You are an expert interview coach scoring candidate answers.
Score the answer on these dimensions (0-100 each):
- clarity: How clear and well-articulated is the answer?
- depth: Does it provide sufficient detail and specifics?
- relevance: How relevant is it to the question asked?
- structure: Does it follow a logical structure (e.g., STAR for behavioral)?
- overall: Weighted average of all dimensions.

Also flag potential cheating signals:
- Is the response suspiciously perfect/formal for spontaneous speech?
- Does it lack natural speech patterns (filler words, self-corrections)?
- Is perplexity (surprise at each word) unusually low?

Respond ONLY with this JSON structure:
{
  "scores": {"overall": 0-100, "clarity": 0-100, "depth": 0-100, "relevance": 0-100, "structure": 0-100},
  "feedback": "2-3 sentence overall feedback",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "ideal_answer_hint": "Brief blueprint of what an ideal answer includes",
  "cheating": {"suspicious": false, "confidence": 0.0-1.0, "flags": []}
}"""

def evaluate_answer(question: str, answer: str, interview_type: str, domain: str) -> dict:
    """Score a candidate answer. Returns structured scoring JSON."""
    if not _client:
        return _mock_evaluation()

    try:
        resp = _client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            system=EVALUATOR_SYSTEM,
            messages=[{
                "role": "user",
                "content": (
                    f"Interview type: {interview_type}\nDomain: {domain}\n"
                    f"Question: {question}\n\nCandidate's answer:\n{answer}"
                )
            }]
        )
        raw = resp.content[0].text.strip()
        # Strip markdown fences if present
        raw = re.sub(r"```json|```", "", raw).strip()
        return json.loads(raw)
    except Exception as e:
        return _mock_evaluation()

def _mock_evaluation() -> dict:
    """Fallback when AI is not configured."""
    return {
        "scores": {"overall": 75, "clarity": 78, "depth": 70, "relevance": 80, "structure": 72},
        "feedback": "Good attempt. Consider adding more specific examples and measurable outcomes.",
        "strengths": ["Clear communication", "Relevant experience mentioned"],
        "improvements": ["Add specific metrics", "Use STAR format more explicitly"],
        "ideal_answer_hint": "Include: situation (20%), actions (50%), measurable result + learning (30%)",
        "cheating": {"suspicious": False, "confidence": 0.0, "flags": []}
    }


# ── CHAIN 3: Report Generator ────────────────────────────────────────────────

REPORT_SYSTEM = """You are a senior career coach generating a comprehensive post-interview coaching report.
You receive all Q&A pairs with their individual scores.

Generate a holistic report that synthesizes patterns across all answers.
The report should feel like it was written by a $500/hr career coach — specific, actionable, personal.

Respond ONLY with JSON:
{
  "overall_score": number,
  "percentile": number (estimated vs other candidates),
  "summary": "3-4 sentence executive summary of performance",
  "competency_scores": {"Communication": 0-100, "Problem Solving": 0-100, "Leadership": 0-100, "Technical": 0-100, "Culture Fit": 0-100},
  "top_strengths": ["strength 1", "strength 2", "strength 3"],
  "top_improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommended_resources": ["resource/practice suggestion 1", "resource 2"]
}"""

def generate_report(session_data: dict) -> dict:
    """Generate end-of-session coaching report from all Q&A pairs."""
    if not _client:
        return _mock_report(session_data)

    try:
        resp = _client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            system=REPORT_SYSTEM,
            messages=[{
                "role": "user",
                "content": f"Interview session data:\n{json.dumps(session_data, indent=2)}"
            }]
        )
        raw = resp.content[0].text.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        return json.loads(raw)
    except Exception:
        return _mock_report(session_data)

def _mock_report(session_data: dict) -> dict:
    return {
        "overall_score": 78,
        "percentile": 72,
        "summary": "Strong candidate with clear communication skills and relevant experience. Consistent STAR method usage noted. Key areas to develop: quantifying impact and deepening technical depth.",
        "competency_scores": {"Communication": 85, "Problem Solving": 72, "Leadership": 78, "Technical": 70, "Culture Fit": 82},
        "top_strengths": ["Clear and structured answers", "Strong self-awareness", "Relevant examples used"],
        "top_improvements": ["Add specific metrics and numbers to all examples", "Expand on business impact of decisions", "More concise delivery on key points"],
        "recommended_resources": ["Practice STAR method with timed responses (aim for 2 min per answer)", "Read 'Cracking the PM Interview' for case frameworks", "Record yourself to improve delivery confidence"]
    }
