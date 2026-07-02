"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Square, Clock, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { interviewAPI } from "@/lib/api";
import { Question } from "@/types";
import { formatDuration, cn } from "@/lib/utils";

type Phase = "ready" | "listening" | "processing" | "answered" | "complete";

const MOCK_QUESTIONS: Question[] = [
  { id: "q1", text: "Tell me about yourself and why you're interested in this role.", category: "behavioral", difficulty: "easy", expected_duration_seconds: 120 },
  { id: "q2", text: "Describe a time when you had to deal with a difficult team member. How did you handle it?", category: "behavioral", difficulty: "medium", expected_duration_seconds: 150 },
  { id: "q3", text: "What's your greatest professional achievement so far?", category: "behavioral", difficulty: "medium", expected_duration_seconds: 120 },
];

export default function InterviewRoomPage() {
  const { sessionId } = useParams();
  const router = useRouter();

  const [questions] = useState<Question[]>(MOCK_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [followUp, setFollowUp] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  // Total session timer
  useEffect(() => {
    totalTimerRef.current = setInterval(() => setTotalElapsed((p) => p + 1), 1000);
    return () => { if (totalTimerRef.current) clearInterval(totalTimerRef.current); };
  }, []);

  const startRecording = useCallback(() => {
    setTranscript("");
    setPhase("listening");
    setElapsed(0);

    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

    // Web Speech API for live transcription
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (e: any) => {
        let final = ""; let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript;
        }
        setTranscript((p) => p + final || interim);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) recognitionRef.current.stop();
    setPhase("processing");

    // Simulate AI processing
    setTimeout(() => {
      setFollowUp("That's interesting! Can you be more specific about the impact that had on the team?");
      setPhase("answered");
    }, 2000);
  }, []);

  const handleNext = async () => {
    if (currentIdx + 1 >= questions.length) {
      // End session
      setSubmitting(true);
      try {
        await interviewAPI.endSession(sessionId as string);
      } catch { /* offline mode ok */ }
      router.push("/dashboard");
      return;
    }
    setCurrentIdx((p) => p + 1);
    setPhase("ready");
    setTranscript("");
    setFollowUp("");
    setElapsed(0);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      {/* Top bar */}
      <div className="glass border-b border-brand-500/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-400">Interview in progress</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-sm font-mono text-slate-300">{formatDuration(totalElapsed)}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Q{currentIdx + 1} of {questions.length}</span>
          <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => { if (confirm("End this interview session?")) router.push("/dashboard"); }}
        >
          <Square className="w-3.5 h-3.5" /> End session
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Left: Question + controls */}
        <div className="flex-1 flex flex-col gap-6 lg:pr-8">
          {/* Question card */}
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-mono text-brand-400 bg-brand-600/10 px-2.5 py-1 rounded-lg">
                Q{currentIdx + 1}
              </span>
              <span className="text-xs text-slate-500 capitalize">{currentQuestion?.category}</span>
              <span className="text-xs text-slate-600">·</span>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">~{currentQuestion?.expected_duration_seconds / 60}m suggested</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-100 leading-relaxed">
              {currentQuestion?.text}
            </h2>

            {/* Follow-up */}
            {followUp && (
              <div className="mt-6 flex items-start gap-3 bg-brand-600/8 border border-brand-500/20 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-brand-400 font-medium mb-1">AI Follow-up</p>
                  <p className="text-sm text-slate-300">{followUp}</p>
                </div>
              </div>
            )}
          </div>

          {/* Recording controls */}
          <div className="glass rounded-2xl p-6 flex flex-col items-center gap-6">
            {/* Waveform */}
            <div className={cn("flex items-center gap-1 h-12", phase !== "listening" && "opacity-20")}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={cn("w-1 rounded-full bg-brand-500", phase === "listening" ? "waveform-bar" : "")}
                  style={{
                    height: phase === "listening" ? `${20 + Math.random() * 28}px` : "6px",
                    animationDelay: `${i * 60}ms`,
                    transition: "height 0.1s",
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            {phase === "listening" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="font-mono text-sm text-slate-300">{formatDuration(elapsed)}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
              {phase === "ready" && (
                <Button onClick={startRecording} size="lg" className="gap-3 glow-brand px-10">
                  <Mic className="w-5 h-5" /> Start answering
                </Button>
              )}
              {phase === "listening" && (
                <Button onClick={stopRecording} variant="danger" size="lg" className="gap-3 px-10">
                  <MicOff className="w-5 h-5" /> Stop & submit
                </Button>
              )}
              {phase === "processing" && (
                <Button loading size="lg" className="px-10">AI is evaluating...</Button>
              )}
              {phase === "answered" && (
                <Button onClick={handleNext} size="lg" className="gap-3 glow-brand px-10" loading={submitting}>
                  {currentIdx + 1 >= questions.length ? (
                    <><CheckCircle2 className="w-5 h-5" /> Finish & get report</>
                  ) : (
                    <>Next question <ChevronRight className="w-5 h-5" /></>
                  )}
                </Button>
              )}
            </div>

            {phase === "ready" && (
              <p className="text-xs text-slate-600 text-center max-w-xs">
                Your microphone will activate. Speak clearly and take your time.
              </p>
            )}
          </div>
        </div>

        {/* Right: Live transcript */}
        <div className="lg:w-80 glass rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className={cn("w-2 h-2 rounded-full", phase === "listening" ? "bg-red-400 animate-pulse" : "bg-slate-600")} />
            <span className="text-sm font-medium text-slate-400">Live transcript</span>
          </div>

          <div className="flex-1 min-h-[200px] max-h-[400px] overflow-y-auto">
            {transcript ? (
              <p className="text-sm text-slate-300 leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-sm text-slate-600 italic">
                {phase === "ready" ? "Your speech will appear here as you speak..." : "Listening..."}
              </p>
            )}
          </div>

          {/* Question list sidebar */}
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Questions</p>
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs",
                  i === currentIdx ? "bg-brand-600/15 text-brand-300" : i < currentIdx ? "text-emerald-500" : "text-slate-600"
                )}
              >
                {i < currentIdx ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0" />}
                <span className="line-clamp-2">{q.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
