export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "team";
  created_at: string;
}

export interface InterviewSession {
  id: string;
  type: InterviewType;
  domain: string;
  difficulty: "easy" | "medium" | "hard";
  status: "pending" | "active" | "completed" | "abandoned";
  duration_minutes: number;
  questions: Question[];
  answers: Answer[];
  score?: number;
  started_at: string;
  ended_at?: string;
}

export type InterviewType = "behavioral" | "technical" | "hr" | "system_design" | "case";

export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: string;
  expected_duration_seconds: number;
  follow_ups?: string[];
}

export interface Answer {
  id: string;
  question_id: string;
  transcript: string;
  duration_seconds: number;
  score?: AnswerScore;
  submitted_at: string;
}

export interface AnswerScore {
  overall: number;
  clarity: number;
  depth: number;
  relevance: number;
  structure: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  ideal_answer_hint: string;
  cheating_signals?: {
    suspicious: boolean;
    confidence: number;
    flags: string[];
  };
}

export interface FeedbackReport {
  session_id: string;
  overall_score: number;
  percentile: number;
  summary: string;
  competency_scores: Record<string, number>;
  question_breakdowns: QuestionBreakdown[];
  top_strengths: string[];
  top_improvements: string[];
  recommended_resources: string[];
  generated_at: string;
}

export interface QuestionBreakdown {
  question: Question;
  answer: Answer;
  score: AnswerScore;
}

export interface DashboardStats {
  total_sessions: number;
  avg_score: number;
  sessions_this_week: number;
  streak_days: number;
  top_domain: string;
  competency_radar: Record<string, number>;
  score_history: { date: string; score: number }[];
  recent_sessions: InterviewSession[];
}
