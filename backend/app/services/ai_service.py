"""
FILE: backend/app/services/ai_service.py
==========================================
Anthropic HATAYA — Ollama llama3 se replace kiya

Kya karta hai:
  1. generate_follow_up() → Ollama se follow-up question
  2. evaluate_answer()    → Ollama se answer scoring
  3. generate_report()    → Ollama se coaching report
"""

import json
import re
import httpx
import asyncio
from typing import Optional
import os

OLLAMA_URL   = os.getenv("OLLAMA_URL",   "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


# ─────────────────────────────────────────────────
# Ollama helper
# ─────────────────────────────────────────────────
async def _ollama(prompt: str, system: str = "", max_tokens: int = 1000) -> Optional[str]:
    """Ollama API call — async."""
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model":  OLLAMA_MODEL,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": max_tokens},
                },
            )
            if resp.status_code == 200:
                return resp.json().get("response", "")
    except Exception as e:
        print(f"[Ollama] Error: {e}")
    return None


def _extract_json(text: str) -> Optional[dict]:
    """Raw text se JSON extract karo."""
    try:
        # Try direct parse
        return json.loads(text.strip())
    except Exception:
        pass
    try:
        # JSON block dhundo
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return None


# ─────────────────────────────────────────────────
# CHAIN 1: Follow-up question generator
# ─────────────────────────────────────────────────
async def generate_follow_up(question: str, answer: str, domain: str) -> Optional[str]:
    """Returns a follow-up question or None if answer is complete."""

    system = """You are an expert interviewer. Decide if a follow-up question is needed.
If the answer is thorough and covers key points with examples → respond with: {"follow_up": null}
If the answer is shallow or missing key details → respond with ONE concise follow-up question.
Respond ONLY with JSON: {"follow_up": "question here"} or {"follow_up": null}
Keep follow-up questions under 25 words."""

    prompt = f"""Question: {question}
Candidate's answer: {answer}
Domain: {domain}"""

    response = await _ollama(prompt, system, max_tokens=150)
    if response:
        data = _extract_json(response)
        if data:
            return data.get("follow_up")
    return None


# ─────────────────────────────────────────────────
# CHAIN 2: Answer evaluator
# ─────────────────────────────────────────────────
async def evaluate_answer(question: str, answer: str,
                           interview_type: str, domain: str) -> dict:
                           
        cleaned_answer = (answer or "").strip()
    
        if len(cleaned_answer) < 15:  # sirf kuch words ya khaali
            return {
            "scores": {"overall": 0, "clarity": 0, "depth": 0, "relevance": 0, "structure": 0},
            "feedback": "No meaningful answer was provided. Please attempt to answer the question to receive feedback and scoring.",
            "strengths": [],
            "improvements": ["Provide a complete answer to the question", "Use the STAR method for behavioral questions" if interview_type == "behavioral" else "Explain your reasoning step by step"],
            "ideal_answer_hint": "",
            "cheating": {"suspicious": False, "confidence": 0.0, "flags": []}
            }
        """Score a candidate answer. Returns structured scoring dict."""

        system = """You are an expert interview coach scoring candidate answers.
Score on these dimensions (0-100 each):
- clarity: How clear and well-articulated?
- depth: Sufficient detail and specifics?
- relevance: How relevant to the question?
- structure: Logical structure (STAR method etc)?
- overall: Weighted average

Respond ONLY with this exact JSON (no markdown):
{
  "scores": {"overall": 0-100, "clarity": 0-100, "depth": 0-100, "relevance": 0-100, "structure": 0-100},
  "feedback": "2-3 sentence feedback",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "ideal_answer_hint": "Brief blueprint of ideal answer",
  "cheating": {"suspicious": false, "confidence": 0.0, "flags": []}
}"""

        prompt = f"""Interview type: {interview_type}
Domain: {domain}
Question: {question}
Candidate's answer: {answer}"""

        response = await _ollama(prompt, system, max_tokens=800)
        if response:
            data = _extract_json(response)
            if data and "scores" in data:
                return data

        return _mock_evaluation()


# ─────────────────────────────────────────────────
# CHAIN 3: End-of-session report generator
# ─────────────────────────────────────────────────
async def generate_report(session_data: dict) -> dict:
    """Generate comprehensive coaching report from all Q&A pairs."""

    system = """You are a senior career coach generating a post-interview coaching report.
Be specific, actionable, and personal. Write like a $500/hr career coach.
Respond ONLY with valid JSON (no markdown):
{
  "overall_score": <number>,
  "percentile": <estimated percentile vs other candidates>,
  "summary": "<3-4 sentence executive summary>",
  "competency_scores": {
    "Communication": <0-100>,
    "Problem Solving": <0-100>,
    "Leadership": <0-100>,
    "Technical": <0-100>,
    "Culture Fit": <0-100>
  },
  "top_strengths": ["strength 1", "strength 2", "strength 3"],
  "top_improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommended_resources": ["resource 1", "resource 2"]
}"""

    prompt = f"Interview session data:\n{json.dumps(session_data, indent=2)}"

    response = await _ollama(prompt, system, max_tokens=1200)
    if response:
        data = _extract_json(response)
        if data and "overall_score" in data:
            return data

    return _mock_report(session_data)


# ─────────────────────────────────────────────────
# Sync wrappers (for non-async contexts)
# ─────────────────────────────────────────────────
def generate_follow_up_sync(question: str, answer: str, domain: str) -> Optional[str]:
    return asyncio.run(generate_follow_up(question, answer, domain))


def evaluate_answer_sync(question: str, answer: str,
                          interview_type: str, domain: str) -> dict:
    return asyncio.run(evaluate_answer(question, answer, interview_type, domain))


def generate_report_sync(session_data: dict) -> dict:
    return asyncio.run(generate_report(session_data))


# ─────────────────────────────────────────────────
# Fallbacks
# ─────────────────────────────────────────────────
def _mock_evaluation() -> dict:
    return {
        "scores": {"overall": 72, "clarity": 75, "depth": 68,
                   "relevance": 78, "structure": 70},
        "feedback": "Good attempt. Consider adding more specific examples and measurable outcomes.",
        "strengths": ["Clear communication", "Relevant experience mentioned"],
        "improvements": ["Add specific metrics", "Use STAR format more explicitly"],
        "ideal_answer_hint": "Include: situation (20%), actions (50%), result + learning (30%)",
        "cheating": {"suspicious": False, "confidence": 0.0, "flags": []},
    }


def _mock_report(session_data: dict) -> dict:
    return {
        "overall_score": 75,
        "percentile": 68,
        "summary": "Strong candidate with clear communication. Key areas: quantify impact, deepen technical depth.",
        "competency_scores": {
            "Communication": 82, "Problem Solving": 70,
            "Leadership": 75, "Technical": 68, "Culture Fit": 80,
        },
        "top_strengths": [
            "Clear structured answers",
            "Strong self-awareness",
            "Relevant examples used",
        ],
        "top_improvements": [
            "Add specific metrics to all examples",
            "Expand on business impact",
            "More concise delivery",
        ],
        "recommended_resources": [
            "Practice STAR method with timed responses (2 min per answer)",
            "Record yourself to improve delivery confidence",
        ],
    }
