/**
 * v3 — plain textarea (Monaco editor removed per request), but keeps:
 *   1. Camera turning off mid-session -> immediate termination (like tab-switch)
 *   2. Two separate final scores: Completion Score (0 if nothing answered,
 *      else proportional) and Posture/Integrity Score (from proctoring hook)
 *   3. Camera permission requested before fullscreen (avoids some browsers
 *      auto-exiting fullscreen when the permission popup appears)
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Send, Timer, CameraOff, Shield, Maximize } from 'lucide-react';

import { useAnomalyDetector } from '../hooks/useAnomalyDetector';
import { useCopyPasteDetector } from '../hooks/useCopyPasteDetector';
import { useFullscreenEnforcer } from '../hooks/useFullscreenEnforcer';
import TerminationModal from '../components/TerminationModal';
import AnomalyOverlay from '../components/AnomalyOverlay';
import { nextDSAQuestion, prevDSAQuestion, saveDSAAnswer, clearDSASession } from '../redux/slices/dsaSlice';

const QUESTION_TIME_LIMIT = 900; // 15 min per question

const CompanyDSASession = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { problems, currentIndex, answers, config } = useSelector((state) => state.dsa);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camEnabled, setCamEnabled] = useState(false);
  const [violation, setViolation] = useState(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [anomalySummary, setAnomalySummary] = useState(null);
  const [completionScore, setCompletionScore] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const currentProblem = problems[currentIndex];
  const totalQuestions = problems.length;

  const {
    currentAnomalies, currentScore, isCameraOn, tabSwitchCount,
    isServiceOnline, getSessionSummary, reset: resetAnomalies,
  } = useAnomalyDetector({ videoRef, isActive: camEnabled, intervalMs: 2000 });

  useCopyPasteDetector({
    currentQuestion: currentProblem?.title || '',
    isActive: sessionStarted && !violation,
    onViolation: (v) => { setViolation(v); stopWebcam(); },
  });

  // Violation ho jaaye toh browser ko fullscreen se bhi nikal do —
  // warna user ko manually Esc dabaana padta tha, lagta tha kuch atka hai
  useEffect(() => {
    if (violation && document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
  }, [violation]);

  const { isFullscreen, showWarning, enterFullscreen } = useFullscreenEnforcer({
    isActive: sessionStarted && !violation,
    graceMs: 5000,
    onExitTooLong: () => {
      setViolation({ type: 'fullscreen_exit', timestamp: new Date().toISOString() });
      stopWebcam();
    },
  });

  // Tab switch — strict: instant terminate
  useEffect(() => {
    if (sessionStarted && tabSwitchCount > 0 && !violation) {
      setViolation({ type: 'tab_switch', timestamp: new Date().toISOString() });
      stopWebcam();
    }
  }, [tabSwitchCount, sessionStarted, violation]);

  // Camera off DURING an active session — strict: instant terminate.
  // Because of this, reaching the final report screen always means the
  // camera was on for the whole session, so the posture score is meaningful.
  useEffect(() => {
    if (sessionStarted && camEnabled && !isCameraOn && !violation) {
      setViolation({ type: 'camera_off', timestamp: new Date().toISOString() });
    }
  }, [isCameraOn, sessionStarted, violation, camEnabled]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamEnabled(true); resetAnomalies();
      return true;
    } catch (err) {
      toast.error('Camera permission denied!');
      return false;
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCamEnabled(false);
  };

  // Camera pehle maangte hain, phir fullscreen (kuch browsers permission
  // popup ke waqt fullscreen se apne aap bahar nikal jaate hain)
  const handleBeginSession = async () => {
    const camOk = await startWebcam();
    if (!camOk) return;
    await enterFullscreen();
    setSessionStarted(true);
  };

  // BUG FIX: jab session start hota hai tabhi <video> tag DOM mein aata hai
  // (pre-start screen pe video element exist hi nahi karta). Isliye stream
  // ko re-attach karna zaroori hai yahan, warna videoRef.current us waqt
  // null tha jab startWebcam() ne assign karne ki koshish ki thi.
  useEffect(() => {
    if (sessionStarted && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [sessionStarted]);

  useEffect(() => { if (!problems.length) navigate('/dsa-practice/setup'); }, [problems, navigate]);

  useEffect(() => {
    const existing = answers.find((a) => a.problemId === currentProblem?._id);
    setCode(existing ? existing.code : (currentProblem?.starterCode || '// Yahan apna solution likho\n'));
    setTimeLeft(QUESTION_TIME_LIMIT);
  }, [currentIndex, currentProblem]);

  useEffect(() => {
    if (!sessionStarted || violation) return;
    if (timeLeft <= 0) { toast.error('Time limit khatam!'); handleSaveAndNext(); return; }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, sessionStarted, violation]);

  const blockClipboard = (e) => { e.preventDefault(); toast.error('Copy/Paste allowed nahi hai!'); };
  const blockKeys = (e) => {
    if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
      e.preventDefault(); toast.error('Shortcuts disabled!');
    }
  };

  const handleSaveAndNext = () => {
    dispatch(saveDSAAnswer({ problemId: currentProblem._id, code }));
    if (currentIndex < totalQuestions - 1) dispatch(nextDSAQuestion());
  };

  const handleSaveAndPrev = () => {
    dispatch(saveDSAAnswer({ problemId: currentProblem._id, code }));
    if (currentIndex > 0) dispatch(prevDSAQuestion());
  };

  // Completion score: 0 agar kisi bhi question ka answer nahi diya
  // (ya sirf starter template chhoda). Warna proportional score.
  const computeCompletionScore = (allAnswers) => {
    if (!totalQuestions) return 0;
    let attempted = 0;
    problems.forEach((p) => {
      const ans = allAnswers.find((a) => a.problemId === p._id);
      const codeText = (ans?.code || '').trim();
      const starterText = (p.starterCode || '// Yahan apna solution likho\n').trim();
      if (codeText && codeText !== starterText) attempted += 1;
    });
    if (attempted === 0) return 0;
    return Math.round((attempted / totalQuestions) * 100);
  };

  const handleFinalSubmit = () => {
    const finalAnswerObj = { problemId: currentProblem._id, code };
    dispatch(saveDSAAnswer(finalAnswerObj));
    const allAnswers = [...answers.filter((a) => a.problemId !== currentProblem._id), finalAnswerObj];

    const score = computeCompletionScore(allAnswers);
    setCompletionScore(score);

    stopWebcam();
    const summary = getSessionSummary();
    setAnomalySummary(summary);
    setShowReport(true);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60) < 10 ? '0' : ''}${s % 60}`;

  if (!currentProblem) return null;

  // ── PRE-START SCREEN ──
  if (!sessionStarted) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        <div className="glass-panel rounded-2xl border border-amber-500/30 p-8 space-y-5">
          <Maximize className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Strict Mode Session</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {config?.company} — {config?.difficulty} — {totalQuestions} Questions<br /><br />
            Ye session <strong className="text-amber-400">fullscreen mode</strong> mein chalega, camera
            ON rehna zaroori hai.
            Fullscreen se bahar aana, camera band karna, tab switch karna, ya copy-paste karna — sab
            <strong className="text-rose-400"> turant session terminate</strong> kar dega.
          </p>
          <button onClick={handleBeginSession}
            className="w-full py-3.5 rounded-xl bg-neon-gradient text-white font-bold text-sm hover:scale-[1.02] transition">
            Agree & Start (Camera + Fullscreen)
          </button>
        </div>
      </div>
    );
  }

  // ── FINAL REPORT SCREEN ──
  if (showReport && anomalySummary && completionScore !== null) {
    const postureColor = anomalySummary.averageScore >= 80 ? '#22c55e' : anomalySummary.averageScore >= 55 ? '#f59e0b' : '#ef4444';
    const completionColor = completionScore >= 60 ? '#22c55e' : completionScore >= 30 ? '#f59e0b' : '#ef4444';
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">DSA Practice Complete!</h2>
          <p className="text-gray-400 text-sm">{config?.company} — Final Report:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl border border-darkBorder p-6 text-center space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Completion Score</p>
            <p className="text-4xl font-extrabold" style={{ color: completionColor }}>{completionScore}%</p>
            <p className="text-[11px] text-gray-500">
              {completionScore === 0
                ? 'Koi bhi question attempt nahi kiya gaya'
                : 'Based on questions actually answered'}
            </p>
          </div>
          <div className="glass-panel rounded-2xl border border-darkBorder p-6 text-center space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Posture / Integrity Score</p>
            <p className="text-4xl font-extrabold" style={{ color: postureColor }}>{anomalySummary.averageScore}/100</p>
            <p className="text-[11px] text-gray-500">{anomalySummary.overallRating}</p>
          </div>
        </div>

        <div className="text-center">
          <button onClick={() => { dispatch(clearDSASession()); navigate('/dashboard'); }}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm hover:scale-105 transition">
            Back to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 relative z-10">
      <TerminationModal violation={violation} onConfirm={() => { dispatch(clearDSASession()); navigate('/dashboard'); }} />
      <AnomalyOverlay anomalies={currentAnomalies} score={currentScore} isCameraOn={isCameraOn} />

      {showWarning && !violation && (
        <div className="fixed top-16 left-0 right-0 z-[99999] bg-rose-600 border-b-4 border-rose-400 text-white px-6 py-4 font-extrabold text-sm shadow-2xl flex items-center justify-center gap-2 animate-pulse">
          ⚠️ Fullscreen se bahar ho! 5 second mein wapas na aaye toh session terminate ho jayega.
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-darkBorder">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {config?.company}
            </span>
            <span className="text-xs font-semibold text-neonPurple bg-neonPurple/10 border border-neonPurple/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {currentProblem.difficulty}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-2 tracking-tight">Company DSA — Strict Mode</h2>
        </div>

        <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 animate-pulse' : 'border-darkBorder bg-white/5 text-gray-200 font-mono font-bold'}`}>
          <Timer className="w-4 h-4 text-neonBlue" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Camera + Proctoring */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl border border-darkBorder overflow-hidden bg-black/40 relative" style={{ aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camEnabled ? 'block' : 'hidden'}`} />
            {!camEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-2 bg-black/50">
                <CameraOff className="w-10 h-10 text-gray-500" />
                <p className="text-sm text-gray-300">Camera Required</p>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-darkBorder p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-darkBorder pb-3">
              <span className="text-xs font-bold text-gray-300 uppercase">Strict Verification</span>
              <Shield className="w-4 h-4 text-neonBlue" />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Posture Score (live)</span>
              <span className="font-bold" style={{ color: currentScore >= 80 ? '#22c55e' : currentScore >= 55 ? '#f59e0b' : '#ef4444' }}>
                {currentScore}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${currentScore}%`, backgroundColor: currentScore >= 80 ? '#22c55e' : currentScore >= 55 ? '#f59e0b' : '#ef4444' }} />
            </div>
            <div className="flex justify-between text-xs pt-2">
              <span className="text-gray-400">Camera</span>
              <span className={isCameraOn ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {isCameraOn ? 'ON (required)' : 'OFF!'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Fullscreen</span>
              <span className={isFullscreen ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {isFullscreen ? 'Active' : 'Exited!'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">AI Proctoring</span>
              <span className={isServiceOnline ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {isServiceOnline ? 'Active' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Question + Answer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-darkBorder p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-darkBorder pb-3">
              <span className="text-xs font-bold text-neonPurple uppercase tracking-widest">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-neon-gradient" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
              </div>
            </div>
            <h3 className="text-xl text-white font-bold">{currentProblem.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{currentProblem.description}</p>
            {currentProblem.topics?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {currentProblem.topics.map((t) => (
                  <span key={t} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-gray-400">{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-darkBorder overflow-hidden">
            <div className="bg-black/20 border-b border-darkBorder px-4 py-3 flex items-center gap-2">
              <div className="flex space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-xs font-mono text-gray-400 pl-2 border-l border-white/5">solution.js</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>STRICT MODE: Copy-paste, right-click, tab switch, fullscreen exit, camera off — sab pe turant termination.</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onCopy={blockClipboard} onPaste={blockClipboard} onCut={blockClipboard}
                onKeyDown={blockKeys} onContextMenu={(e) => e.preventDefault()}
                spellCheck={false}
                className="w-full min-h-[320px] p-4 rounded-xl text-sm font-mono text-gray-200 glass-input resize-none focus:ring-1 focus:ring-neonBlue/30"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={handleSaveAndPrev} disabled={currentIndex === 0}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-darkBorder bg-white/3 text-gray-300 text-xs font-bold disabled:opacity-20 disabled:pointer-events-none">
              <ChevronLeft className="w-4 h-4" /><span>Back</span>
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button onClick={handleFinalSubmit}
                className="flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-neon-gradient text-white font-extrabold text-xs hover:scale-[1.03] transition">
                <Send className="w-4 h-4" /><span>Submit & Finish</span>
              </button>
            ) : (
              <button onClick={handleSaveAndNext}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:scale-[1.02] transition">
                <span>Save & Next</span><ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDSASession;
