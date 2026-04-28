"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, getScoreColor, getScoreBg } from "@/lib/utils";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from "recharts";
import {
  Download, Share2, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Lightbulb, Star, Award, Shield
} from "lucide-react";

const MOCK_REPORT = {
  overall_score: 82,
  percentile: 76,
  summary: "Strong communicator with clear structure and relevant examples. Your STAR framework usage was consistent. Main areas to improve: adding more quantifiable impact to your examples and deepening technical depth when discussing cross-functional work.",
  competency_scores: [
    { subject: "Clarity", A: 88 }, { subject: "Depth", A: 72 }, { subject: "Structure", A: 85 },
    { subject: "Relevance", A: 90 }, { subject: "Confidence", A: 78 }, { subject: "Impact", A: 68 },
  ],
  top_strengths: [
    "Excellent use of STAR method throughout",
    "Clear and concise communication style",
    "Good self-awareness and growth mindset",
  ],
  top_improvements: [
    "Add more specific metrics and quantified impact (e.g., '40% reduction in X')",
    "Expand on how your decisions affected business outcomes",
    "Practice pausing less between thoughts for more confident delivery",
  ],
  question_breakdowns: [
    {
      question: "Tell me about yourself and why you're interested in this role.",
      transcript: "I'm a software engineer with 4 years of experience building scalable systems. I've worked at two startups where I led backend initiatives...",
      scores: { overall: 85, clarity: 90, depth: 78, structure: 88, relevance: 85 },
      feedback: "Strong opening with clear narrative arc. Good connection between your background and the role.",
      strengths: ["Clear chronological structure", "Strong motivation shown"],
      improvements: ["Add 1-2 specific achievements with numbers", "Mention what you want to learn in the role"],
      ideal_hint: "A strong answer here includes: your background in 2 sentences, 1-2 key achievements with metrics, and a specific reason why THIS company excites you.",
    },
    {
      question: "Describe a time when you had to deal with a difficult team member.",
      transcript: "There was a situation where a senior engineer on my team was resistant to adopting new code review practices I was trying to implement...",
      scores: { overall: 78, clarity: 82, depth: 70, structure: 82, relevance: 80 },
      feedback: "Good conflict resolution skills shown. The resolution was well-described but the impact on the team outcome was vague.",
      strengths: ["Empathetic approach demonstrated", "Clear STAR structure"],
      improvements: ["Quantify the outcome — did team velocity improve?", "What did you learn from this?"],
      ideal_hint: "Strong answers describe the situation briefly (20%), the specific actions you took (50%), and the measurable result with lessons learned (30%).",
    },
    {
      question: "What's your greatest professional achievement so far?",
      transcript: "I led the migration of our monolithic backend to microservices which significantly improved our deployment frequency...",
      scores: { overall: 88, clarity: 88, depth: 85, structure: 90, relevance: 88 },
      feedback: "Excellent answer. Technical depth was impressive and the business impact was clearly articulated.",
      strengths: ["Strong technical credibility", "Clear business impact", "Leadership shown"],
      improvements: ["Mention team collaboration aspect more", "What would you do differently?"],
      ideal_hint: "This was a strong answer. One enhancement: briefly mentioning the challenge overcome shows resilience.",
    },
  ],
};

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="50" y="46" textAnchor="middle" fill="#f8fafc" fontSize="20" fontWeight="700">{score}</text>
      <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="10">/100</text>
    </svg>
  );
}

export default function ReportPage() {
  const { sessionId } = useParams();
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const report = MOCK_REPORT;

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-100">Interview Report</h1>
            <p className="text-slate-400 mt-1">Behavioral · Mid-level · 30 minutes</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm"><Download className="w-4 h-4" /> Export PDF</Button>
            <Button variant="secondary" size="sm"><Share2 className="w-4 h-4" /> Share</Button>
            <Link href="/interview"><Button size="sm" className="glow-brand"><RefreshCw className="w-4 h-4" /> Practice again</Button></Link>
          </div>
        </div>

        {/* Overall score */}
        <div className="glass rounded-3xl p-8 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.9) 100%)" }}>
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.2) 0%, transparent 60%)" }} />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0">
              <ScoreRing score={report.overall_score} size={140} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-3">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">Top {100 - report.percentile}%</span>
                </div>
                <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 px-4 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-brand-400" />
                  <span className="text-sm text-brand-400 font-medium">Score: {report.overall_score}/100</span>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">{report.summary}</p>
            </div>
          </div>
        </div>

        {/* Competency breakdown */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Radar */}
          <Card>
            <h2 className="font-semibold text-slate-100 mb-5">Competency breakdown</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={report.competency_scores}>
                <PolarGrid stroke="rgba(99,102,241,0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {report.competency_scores.map((c) => (
                <div key={c.subject} className="text-center">
                  <div className={cn("text-lg font-bold font-display", getScoreColor(c.A))}>{c.A}</div>
                  <div className="text-xs text-slate-500">{c.subject}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Strengths & improvements */}
          <div className="space-y-4">
            <Card className="border-emerald-500/20">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold text-slate-100">Top strengths</h2>
              </div>
              <div className="space-y-2.5">
                {report.top_strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-amber-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h2 className="font-semibold text-slate-100">Areas to improve</h2>
              </div>
              <div className="space-y-2.5">
                {report.top_improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Per-question breakdown */}
        <Card className="mb-6">
          <h2 className="font-semibold text-slate-100 mb-5">Question-by-question breakdown</h2>
          <div className="space-y-4">
            {report.question_breakdowns.map((qb, i) => (
              <div key={i} className={cn("glass rounded-xl overflow-hidden border", expandedQ === i ? "border-brand-500/30" : "")}>
                <button
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <span className="text-xs font-mono text-brand-400 bg-brand-600/10 px-2 py-1 rounded shrink-0 mt-0.5">Q{i + 1}</span>
                    <p className="text-sm text-slate-300 line-clamp-2 flex-1">{qb.question}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className={cn("px-3 py-1 rounded-lg text-sm font-bold border", getScoreBg(qb.scores.overall))}>
                      <span className={getScoreColor(qb.scores.overall)}>{qb.scores.overall}</span>
                    </div>
                    {expandedQ === i ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>

                {expandedQ === i && (
                  <div className="px-5 pb-5 space-y-5 border-t border-slate-700/50">
                    {/* Score bar breakdown */}
                    <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(qb.scores).filter(([k]) => k !== "overall").map(([k, v]) => (
                        <div key={k} className="text-center">
                          <div className={cn("text-lg font-bold font-display", getScoreColor(v as number))}>{v as number}</div>
                          <div className="text-xs text-slate-500 capitalize">{k}</div>
                          <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500/60 rounded-full" style={{ width: `${v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Transcript */}
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Your answer</p>
                      <div className="bg-slate-900/50 rounded-xl p-4 text-sm text-slate-400 italic leading-relaxed border border-slate-800">
                        &ldquo;{qb.transcript}&rdquo;
                      </div>
                    </div>

                    {/* AI feedback */}
                    <div className="bg-brand-900/20 border border-brand-500/20 rounded-xl p-4">
                      <p className="text-xs text-brand-400 font-medium mb-2 uppercase tracking-wide">AI Feedback</p>
                      <p className="text-sm text-slate-300">{qb.feedback}</p>
                    </div>

                    {/* Strengths + improvements */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-emerald-400 font-medium mb-2">✓ Strengths</p>
                        {qb.strengths.map((s, j) => <p key={j} className="text-xs text-slate-400 mb-1">· {s}</p>)}
                      </div>
                      <div>
                        <p className="text-xs text-amber-400 font-medium mb-2">↑ Improve</p>
                        {qb.improvements.map((s, j) => <p key={j} className="text-xs text-slate-400 mb-1">· {s}</p>)}
                      </div>
                    </div>

                    {/* Ideal answer hint */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-brand-400" />
                        <p className="text-xs text-brand-400 font-medium uppercase tracking-wide">Ideal answer blueprint</p>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{qb.ideal_hint}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Cheating notice (shown subtly) */}
        <Card className="border-slate-700/30">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-300">Integrity check passed</p>
              <p className="text-xs text-slate-500 mt-0.5">Answer patterns appear organic. No AI-assist indicators detected.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
