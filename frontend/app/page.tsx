import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import {
  BrainCircuit, Mic, BarChart3, Shield, Zap, Star,
  ChevronRight, CheckCircle2, Clock, Target
} from "lucide-react";

const features = [
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: "Adaptive AI Interviewer",
    desc: "Asks real follow-up questions based on your answers. Dynamic difficulty that adjusts to your performance.",
    color: "brand",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Real-Time Transcription",
    desc: "Speak naturally. Whisper AI transcribes your answers live, so you can focus on talking — not typing.",
    color: "purple",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Deep Score Analytics",
    desc: "Scored on clarity, depth, structure, relevance. Competency radar chart. Track your progress week-over-week.",
    color: "emerald",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Cheating Detection",
    desc: "Perplexity scoring and behavioral signals flag AI-generated answers. Ensures your score is meaningful.",
    color: "amber",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Company-Specific Modes",
    desc: "Paste any job description. We extract key competencies and build a tailored question set automatically.",
    color: "rose",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Feedback Reports",
    desc: "PDF-exportable coaching reports after every session. Ideal answers, strengths, weaknesses — all in one place.",
    color: "sky",
  },
];

const domains = [
  "Software Engineering", "Product Management", "Data Science",
  "System Design", "Behavioral / STAR", "HR & Leadership",
  "Marketing", "Finance", "Consulting Case",
];

const stats = [
  { value: "50K+", label: "Sessions completed" },
  { value: "94%", label: "Users report confidence boost" },
  { value: "15+", label: "Interview domains" },
  { value: "< 1.5s", label: "AI response latency" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-brand-300 mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            AI-powered · Real-time · Free to start
          </div>

          <h1
            className="font-display text-6xl md:text-7xl lg:text-8xl font-bold leading-tight animate-fade-up animate-delay-100"
            style={{ opacity: 0 }}
          >
            <span className="text-slate-100">Ace every</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #818cf8 50%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              interview.
            </span>
          </h1>

          <p
            className="mt-8 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-up animate-delay-200"
            style={{ opacity: 0 }}
          >
            Practice with an AI that asks real follow-up questions, scores your answers in real-time,
            and gives you the coaching report your dream job demands.
          </p>

          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-300"
            style={{ opacity: 0 }}
          >
            <Link href="/auth/register">
              <Button
                size="lg"
                className="group min-w-[200px] glow-brand"
              >
                Start free practice
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="min-w-[180px]">
                See how it works
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 animate-fade-up animate-delay-400"
            style={{ opacity: 0 }}
          >
            {["No credit card required", "3 free sessions/month", "Instant setup"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-brand-500/10 bg-[#0f172a]/60 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl font-bold text-brand-400">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100">
              Everything you need to<br />
              <span style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                land the role.
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
              Not just another flashcard app. A full simulation with coaching.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 hover:border-brand-500/30 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center mb-5 group-hover:bg-brand-600/20 transition-colors`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-100 text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="py-20 px-6 bg-[#0f172a]/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-slate-100 mb-4">15+ domains covered</h2>
          <p className="text-slate-400 mb-12">From SWE system design to consulting case interviews.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {domains.map((d) => (
              <span
                key={d}
                className="glass px-4 py-2 rounded-full text-sm text-slate-300 hover:text-brand-300 hover:border-brand-500/30 transition-all cursor-default"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-slate-100">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: <Target className="w-6 h-6" />, title: "Choose your interview", desc: "Pick domain, difficulty, and duration. Paste a JD for company-specific questions." },
              { step: "02", icon: <Mic className="w-6 h-6" />, title: "Speak your answers", desc: "The AI listens, transcribes live, asks real follow-ups. Feels like a real interview." },
              { step: "03", icon: <BarChart3 className="w-6 h-6" />, title: "Get your report", desc: "Instant coaching report with scores, ideal answers, and what to practice next." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="font-mono text-sm text-brand-500 font-bold">{item.step}</div>
                    <div className="w-10 h-10 rounded-xl bg-brand-600/10 text-brand-400 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-100 text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative glass rounded-3xl p-12 text-center overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(30,41,59,0.8) 100%)" }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.3) 0%, transparent 70%)" }}
            />
            <div className="relative">
              <Star className="w-10 h-10 text-brand-400 mx-auto mb-6" />
              <h2 className="font-display text-4xl font-bold text-slate-100 mb-4">
                Your next offer starts here.
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Join thousands of candidates who practice smarter.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="glow-brand">
                  Start practicing for free
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-500/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <BrainCircuit className="w-4 h-4" />
            <span>© 2025 InterviewAI. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
