"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { interviewAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Briefcase, Code2, Heart, Brain, BarChart, Clock, ChevronRight, Zap, FileText } from "lucide-react";

const TYPES = [
  { id: "behavioral", label: "Behavioral", icon: <Heart className="w-5 h-5" />, desc: "STAR method, leadership, conflict resolution" },
  { id: "technical", label: "Technical", icon: <Code2 className="w-5 h-5" />, desc: "DSA, system design, coding problems" },
  { id: "hr", label: "HR / Culture", icon: <Briefcase className="w-5 h-5" />, desc: "Culture fit, salary, career goals" },
  { id: "system_design", label: "System Design", icon: <Brain className="w-5 h-5" />, desc: "Architecture, scalability, trade-offs" },
  { id: "case", label: "Case Study", icon: <BarChart className="w-5 h-5" />, desc: "Consulting, product strategy, estimation" },
];

const DOMAINS = [
  "Software Engineering", "Product Management", "Data Science", "Marketing",
  "Finance", "HR/Recruiting", "Consulting", "Sales", "Design", "Operations",
];

const DIFFICULTIES = [
  { id: "easy", label: "Fresher", desc: "0–2 yrs experience", color: "emerald" },
  { id: "medium", label: "Mid-level", desc: "2–5 yrs experience", color: "amber" },
  { id: "hard", label: "Senior", desc: "5+ yrs experience", color: "rose" },
];

const DURATIONS = [15, 30, 45, 60];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    type: "", domain: "", difficulty: "", duration_minutes: 30, job_description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canProceed = () => {
    if (step === 1) return !!config.type;
    if (step === 2) return !!config.domain && !!config.difficulty;
    return true;
  };

  const handleStart = async () => {
    setLoading(true); setError("");
    try {
      const res = await interviewAPI.start(config);
      router.push(`/interview/${res.data.session_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start. Please try again.");
      setLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-2xl font-bold text-slate-100">Configure your interview</h1>
            <span className="text-sm text-slate-500">Step {step} of {totalSteps}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i < step ? "bg-brand-500" : "bg-slate-800")} />
            ))}
          </div>
        </div>

        {/* Step 1: Interview type */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-up" style={{ opacity: 0 }}>
            <h2 className="text-lg font-medium text-slate-300 mb-6">What type of interview?</h2>
            {TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setConfig({ ...config, type: t.id })}
                className={cn(
                  "w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left",
                  config.type === t.id
                    ? "bg-brand-600/15 border-brand-500/50 shadow-lg shadow-brand-900/20"
                    : "glass hover:border-brand-500/20"
                )}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  config.type === t.id ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400")}>
                  {t.icon}
                </div>
                <div>
                  <p className={cn("font-semibold", config.type === t.id ? "text-brand-300" : "text-slate-200")}>{t.label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{t.desc}</p>
                </div>
                {config.type === t.id && <div className="ml-auto w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Domain & Difficulty */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-up" style={{ opacity: 0 }}>
            <div>
              <h2 className="text-lg font-medium text-slate-300 mb-4">Your domain</h2>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map((d) => (
                  <button key={d} onClick={() => setConfig({ ...config, domain: d })}
                    className={cn("px-4 py-2 rounded-xl text-sm border transition-all",
                      config.domain === d ? "bg-brand-600/20 border-brand-500/40 text-brand-300" : "glass text-slate-400 hover:text-slate-200")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-slate-300 mb-4">Difficulty level</h2>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map((d) => (
                  <button key={d.id} onClick={() => setConfig({ ...config, difficulty: d.id })}
                    className={cn("p-4 rounded-2xl border text-center transition-all",
                      config.difficulty === d.id ? "bg-brand-600/15 border-brand-500/40" : "glass hover:border-slate-600")}>
                    <p className={cn("font-semibold text-sm", config.difficulty === d.id ? "text-brand-300" : "text-slate-300")}>{d.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-slate-300 mb-4">Duration</h2>
              <div className="flex gap-3">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setConfig({ ...config, duration_minutes: d })}
                    className={cn("flex-1 py-3 rounded-xl text-sm border font-medium transition-all flex items-center justify-center gap-1.5",
                      config.duration_minutes === d ? "bg-brand-600/20 border-brand-500/40 text-brand-300" : "glass text-slate-400 hover:text-slate-200")}>
                    <Clock className="w-3.5 h-3.5" />{d}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: JD (optional) + confirm */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up" style={{ opacity: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-brand-400" />
                <h2 className="text-lg font-medium text-slate-300">Job description <span className="text-slate-500 text-sm">(optional)</span></h2>
              </div>
              <textarea
                value={config.job_description}
                onChange={(e) => setConfig({ ...config, job_description: e.target.value })}
                placeholder="Paste the job description here to get company-specific questions tailored to the role..."
                rows={6}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50 resize-none"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-brand-500" />
                AI will extract competencies and tailor questions to this specific role
              </p>
            </div>

            {/* Summary */}
            <Card className="bg-brand-900/20 border-brand-500/20">
              <h3 className="font-medium text-slate-200 mb-4">Interview summary</h3>
              <div className="space-y-2">
                {[
                  ["Type", TYPES.find((t) => t.id === config.type)?.label],
                  ["Domain", config.domain],
                  ["Difficulty", DIFFICULTIES.find((d) => d.id === config.difficulty)?.label],
                  ["Duration", `${config.duration_minutes} minutes`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-300 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">← Back</Button>
          )}
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1 glow-brand">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleStart} loading={loading} className="flex-1 glow-brand" size="lg">
              Start interview →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
