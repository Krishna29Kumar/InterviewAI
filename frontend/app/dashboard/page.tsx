"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  BarChart3, Mic, Clock, TrendingUp, Target, Flame,
  ChevronRight, Play, Award, Calendar
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { cn, getScoreColor, getScoreBg } from "@/lib/utils";

const mockStats = {
  total_sessions: 24,
  avg_score: 78,
  sessions_this_week: 5,
  streak_days: 7,
  score_history: [
    { date: "Mon", score: 62 }, { date: "Tue", score: 70 }, { date: "Wed", score: 68 },
    { date: "Thu", score: 75 }, { date: "Fri", score: 82 }, { date: "Sat", score: 79 },
    { date: "Sun", score: 85 },
  ],
  competency_radar: [
    { subject: "Clarity", A: 82 }, { subject: "Depth", A: 70 }, { subject: "Structure", A: 75 },
    { subject: "Relevance", A: 88 }, { subject: "Confidence", A: 65 }, { subject: "Technical", A: 72 },
  ],
  recent_sessions: [
    { id: "s1", type: "behavioral", domain: "Leadership", score: 85, date: "2h ago", duration: "30 min" },
    { id: "s2", type: "technical", domain: "System Design", score: 72, date: "Yesterday", duration: "45 min" },
    { id: "s3", type: "hr", domain: "Culture Fit", score: 91, date: "2 days ago", duration: "20 min" },
  ],
};

export default function DashboardPage() {
  const [stats] = useState(mockStats);

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-slate-400 mt-1">Track your interview performance and progress</p>
          </div>
          <Link href="/interview">
            <Button size="lg" className="glow-brand gap-2">
              <Play className="w-4 h-4" /> Start interview
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <BarChart3 className="w-5 h-5" />, value: stats.avg_score, label: "Avg score", suffix: "/100" },
            { icon: <Mic className="w-5 h-5" />, value: stats.total_sessions, label: "Total sessions", suffix: "" },
            { icon: <Flame className="w-5 h-5" />, value: `${stats.streak_days}d`, label: "Current streak", suffix: "" },
            { icon: <Calendar className="w-5 h-5" />, value: stats.sessions_this_week, label: "This week", suffix: " sessions" },
          ].map((s) => (
            <Card key={s.label}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-brand-400">{s.icon}</div>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="font-display text-3xl font-bold text-slate-100">
                {s.value}<span className="text-lg text-slate-500 font-normal">{s.suffix}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-5 mb-8">
          {/* Score trend */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-slate-100">Score trend</h2>
                <p className="text-xs text-slate-500 mt-0.5">Last 7 sessions</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.score_history}>
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} stroke="#475569" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", color: "#f8fafc" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Competency radar */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-slate-100">Competency radar</h2>
                <p className="text-xs text-slate-500 mt-0.5">Skill breakdown</p>
              </div>
              <Target className="w-5 h-5 text-brand-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={stats.competency_radar}>
                <PolarGrid stroke="rgba(99,102,241,0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent sessions */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-100">Recent sessions</h2>
            <Button variant="ghost" size="sm">View all <ChevronRight className="w-3 h-3" /></Button>
          </div>
          <div className="space-y-3">
            {stats.recent_sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 glass rounded-xl hover:border-brand-500/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center text-brand-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200 capitalize">{session.type} · {session.domain}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" />{session.duration} · {session.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={cn("px-3 py-1.5 rounded-lg text-sm font-bold border", getScoreBg(session.score))}>
                    <span className={getScoreColor(session.score)}>{session.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
