"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrainCircuit, User, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const domains = ["Software Engineering","Product Management","Data Science","Marketing","Finance","HR/Recruiting","Consulting","Other"];
const experiences = ["Student","0-2 years","2-5 years","5-10 years","10+ years"];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", domain: "", experience: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setError(""); setLoading(true);
    try {
      const res = await authAPI.register(form);
      setAuth(res.data.user, res.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#020617]">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)" }} />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-slate-100">InterviewAI</span>
          </Link>
          <p className="text-slate-400 mt-4 text-lg">Create your account</p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 w-12 rounded-full transition-all ${s <= step ? "bg-brand-500" : "bg-slate-700"}`} />
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                <Input label="Full name" type="text" placeholder="Alex Johnson" icon={<User className="w-4 h-4" />}
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="Email address" type="email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />}
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <Input label="Password" type="password" placeholder="Min. 8 characters" icon={<Lock className="w-4 h-4" />}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                <Button type="submit" className="w-full" size="lg">Continue →</Button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your domain</label>
                  <div className="grid grid-cols-2 gap-2">
                    {domains.map((d) => (
                      <button key={d} type="button"
                        onClick={() => setForm({ ...form, domain: d })}
                        className={`text-sm px-3 py-2 rounded-xl border transition-all text-left ${form.domain === d ? "bg-brand-600/20 border-brand-500/40 text-brand-300" : "glass border-slate-700/50 text-slate-400 hover:text-slate-200"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Experience level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {experiences.map((ex) => (
                      <button key={ex} type="button"
                        onClick={() => setForm({ ...form, experience: ex })}
                        className={`text-sm px-3 py-2 rounded-xl border transition-all ${form.experience === ex ? "bg-brand-600/20 border-brand-500/40 text-brand-300" : "glass border-slate-700/50 text-slate-400 hover:text-slate-200"}`}>
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button type="submit" loading={loading} className="flex-1 glow-brand">Create account</Button>
                </div>
              </>
            )}
          </form>

          {step === 1 && (
            <div className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
