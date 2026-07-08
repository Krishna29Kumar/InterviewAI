/**
 * FILE: client/src/pages/InterviewSession.jsx — PATCH
 * =====================================================
 * Tumhare existing InterviewSession.jsx mein yeh changes karne hain.
 * Poori file replace mat karo — sirf yeh add karo.
 *
 * ─────────────────────────────────────────────────────
 * STEP A: TOP IMPORTS mein add karo (existing imports ke neeche)
 * ─────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  saveAnswer,
  nextQuestion,
  prevQuestion,
  submitInterview,
  clearActiveInterview,
} from '../redux/slices/interviewSlice';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import {
  initiateSocketConnection,
  disconnectSocket,
  emitSocketEvent,
} from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Volume2,
  VolumeX,
  Mic,
  Square,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Send,
  Timer,
  Info,
  Loader2,
  AlertTriangle,
  Camera,
  CameraOff,
  Eye,
  Shield,
} from 'lucide-react';

// ── Anomaly imports ──
import { useAnomalyDetector } from '../hooks/useAnomalyDetector';
import AnomalyOverlay from '../components/AnomalyOverlay';
import AnomalyReport from '../components/AnomalyReport';

const QUESTION_TIME_LIMIT = 180;

const InterviewSession = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentInterview, currentIndex, answers, loading } = useSelector((state) => state.interview);

  // ── Webcam ref ──
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Webcam state ──
  const [camEnabled, setCamEnabled] = useState(false);
  const [camError, setCamError] = useState('');
  const [anomalySummary, setAnomalySummary] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // ── Anomaly detector hook ──
  const {
    currentAnomalies,
    currentScore,
    isCameraOn,
    tabSwitchCount,
    isServiceOnline,
    getSessionSummary,
    reset: resetAnomalies,
  } = useAnomalyDetector({
    videoRef,
    isActive: camEnabled,
    intervalMs: 3000,
  });

  // Custom Hooks
  const {
    isRecording,
    transcript,
    audioUrl,
    isTranscribing,
    error: micError,
    startRecording,
    stopRecording,
    resetTranscript,
    setTranscript,
  } = useSpeechToText();

  const { speak, stop: stopSpeech, isPlaying: isSpeaking } = useTextToSpeech();

  // Local State
  const [answerText, setAnswerText] = useState('');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);

  const totalQuestions = currentInterview?.questions?.length || 0;
  const currentQuestionText = currentInterview?.questions?.[currentIndex]?.questionText || '';

  // ── Start Webcam ──
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamEnabled(true);
      setCamError('');
      resetAnomalies();
    } catch (err) {
      setCamError('Camera access nahi mili. Browser settings mein allow karo.');
      toast.error('Camera permission denied!');
    }
  };

  // ── Stop Webcam ──
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamEnabled(false);
  };

  // ── Auto start webcam when interview loads ──
  useEffect(() => {
    if (currentInterview) {
      startWebcam();
    }
    return () => stopWebcam();
  }, [currentInterview]);

  // ── Tab switch warning ──
  useEffect(() => {
    if (tabSwitchCount > 0) {
      toast.error(`⚠️ Tab switch detected! (${tabSwitchCount} time${tabSwitchCount > 1 ? 's' : ''})`);
    }
  }, [tabSwitchCount]);

  // Redirect if no session
  useEffect(() => {
    if (!currentInterview) {
      navigate('/setup');
    }
  }, [currentInterview, navigate]);

  // Socket setup
  useEffect(() => {
    if (currentInterview?._id) {
      initiateSocketConnection(currentInterview._id);
      emitSocketEvent('start_interview', {
        interviewId: currentInterview._id,
        role: currentInterview.role,
      });
    }
    return () => disconnectSocket();
  }, [currentInterview]);

  // Load existing answer
  useEffect(() => {
    const existing = answers.find((ans) => ans.questionIndex === currentIndex);
    setAnswerText(existing ? existing.answerText : '');
    resetTranscript();
    setTimeLeft(QUESTION_TIME_LIMIT);
  }, [currentIndex, answers]);

  // Sync transcript
  useEffect(() => {
    if (transcript) setAnswerText(transcript);
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.warn('Time limit reached. Saving current draft.');
      handleSaveAndNext();
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Mic error
  useEffect(() => {
    if (micError) toast.error(micError);
  }, [micError]);

  // ── Anti Copy-Paste ──
  const handleCopy = (e) => { e.preventDefault(); toast.error('Copy not allowed during interview!'); };
  const handlePaste = (e) => { e.preventDefault(); toast.error('Paste not allowed during interview!'); };
  const handleCut = (e) => { e.preventDefault(); toast.error('Cut not allowed during interview!'); };
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      toast.error('Keyboard shortcuts disabled during interview!');
    }
  };

  const handleSaveAndNext = () => {
    stopRecording();
    stopSpeech();
    dispatch(saveAnswer({
      questionIndex: currentIndex,
      answerText: answerText || 'No answer provided.',
      audioUrl: audioUrl || '',
    }));
    emitSocketEvent('submit_answer', {
      interviewId: currentInterview._id,
      questionIndex: currentIndex,
    });
    if (currentIndex < totalQuestions - 1) dispatch(nextQuestion());
  };

  const handleSaveAndPrev = () => {
    stopRecording();
    stopSpeech();
    dispatch(saveAnswer({
      questionIndex: currentIndex,
      answerText: answerText || 'No answer provided.',
      audioUrl: audioUrl || '',
    }));
    if (currentIndex > 0) dispatch(prevQuestion());
  };

  const handleFinalSubmit = async () => {
    stopRecording();
    stopSpeech();
    stopWebcam();

    // Get anomaly summary before submitting
    const summary = getSessionSummary();
    setAnomalySummary(summary);

    const finalAnswerObj = {
      questionIndex: currentIndex,
      answerText: answerText || 'No answer provided.',
      audioUrl: audioUrl || '',
    };
    dispatch(saveAnswer(finalAnswerObj));
    const allAnswers = [
      ...answers.filter((a) => a.questionIndex !== currentIndex),
      finalAnswerObj,
    ];

    emitSocketEvent('request_evaluation', { interviewId: currentInterview._id });

    const resultAction = await dispatch(
      submitInterview({
        interviewId: currentInterview._id,
        answers: allAnswers,
        proctoring: {
          averageScore: summary.averageScore,
          overallRating: summary.overallRating,
          tabSwitches: summary.tabSwitches,
          topIssues: summary.topIssues.map((i) => i.label),
          flagRate: summary.flagRate,
        },
      })
    );

    if (submitInterview.fulfilled.match(resultAction)) {
      toast.success('Interview evaluated!');
      setShowReport(true); // show anomaly report before navigating
    } else {
      toast.error(resultAction.payload || 'Evaluation failed. Please try again.');
    }
  };

  const toggleTextToSpeech = () => {
    if (isSpeaking) stopSpeech();
    else speak(currentQuestionText);
  };

  const handleMicAction = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentInterview) return null;

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;
  const scoreColor = currentScore >= 80 ? '#22c55e' : currentScore >= 55 ? '#f59e0b' : '#ef4444';

  // ── Show report after submit ──
  if (showReport && anomalySummary) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Interview Complete! 🎉</h2>
          <p className="text-gray-400 text-sm">
            AI feedback is being processed. Here is your proctoring report:
          </p>
        </div>
        <AnomalyReport summary={anomalySummary} />
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm hover:scale-105 transition"
          >
            View Full Results on Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10">

      {/* ── Floating Anomaly Warning Overlay ── */}
      <AnomalyOverlay
        anomalies={currentAnomalies}
        score={currentScore}
        isCameraOn={isCameraOn}
      />

      {/* Session Progress Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-2.5 py-0.5 rounded-full">
            {currentInterview.role} Practice
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Question {currentIndex + 1} of {totalQuestions}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Posture Score Badge */}
          {camEnabled && isServiceOnline && (
            <div style={{ borderColor: scoreColor + '44', background: scoreColor + '11' }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold"
            >
              <Shield className="w-3.5 h-3.5" style={{ color: scoreColor }} />
              <span style={{ color: scoreColor }}>{currentScore}/100</span>
            </div>
          )}

          {/* Tab switch counter */}
          {tabSwitchCount > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Tabs: {tabSwitchCount}</span>
            </div>
          )}

          {/* Timer */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${timeLeft < 30
            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 animate-pulse'
            : 'border-darkBorder bg-white/5 text-gray-300'
            }`}>
            <Timer className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wider">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-neon-gradient transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Webcam + Question Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ── Webcam Panel ── */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-darkBorder overflow-hidden bg-black/40 aspect-video relative flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${camEnabled ? 'block' : 'hidden'}`}
            />

            {!camEnabled && (
              <div className="text-center space-y-2 p-4">
                <CameraOff className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-500">Camera off</p>
                {camError && <p className="text-xs text-red-400">{camError}</p>}
                <button
                  onClick={startWebcam}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Camera status indicator */}
            {camEnabled && (
              <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/60 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">Live</span>
              </div>
            )}

            {/* Camera toggle button */}
            {camEnabled && (
              <button
                onClick={stopWebcam}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-red-400 transition"
              >
                <CameraOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Anomaly mini-list below webcam */}
          {camEnabled && currentAnomalies.length > 0 && (
            <div className="mt-2 space-y-1">
              {currentAnomalies.slice(0, 2).map((a) => (
                <div key={a} className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{a.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Question Panel ── */}
        <div className="md:col-span-2 glass-panel rounded-2xl border border-darkBorder p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs text-neonPurple font-semibold uppercase tracking-widest">
              Question prompt
            </span>
            <p className="text-lg text-white font-medium leading-relaxed">
              {currentQuestionText}
            </p>
          </div>

          <div className="pt-6 flex items-center space-x-3">
            <button
              onClick={toggleTextToSpeech}
              className={`p-3 rounded-xl border transition duration-300 ${isSpeaking
                ? 'bg-neonPurple/20 border-neonPurple/50 text-neonPurple'
                : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-xs text-gray-500">
              {isSpeaking ? 'Utterance synthesizer active...' : 'Read out loud using TTS'}
            </span>
          </div>
        </div>
      </div>

      {/* Answer Input */}
      <div className="glass-panel rounded-2xl border border-darkBorder p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
            Your Response
          </span>
          {isTranscribing && (
            <span className="flex items-center space-x-1 text-xs text-neonBlue">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Whisper transcribing...</span>
            </span>
          )}
        </div>

        {/* Anti copy-paste textarea */}
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onCut={handleCut}
          onKeyDown={handleKeyDown}
          onContextMenu={(e) => e.preventDefault()}
          placeholder="Type your response here, or tap the microphone to dictate..."
          className="w-full min-h-[160px] p-4 rounded-xl text-sm text-gray-200 glass-input resize-none"
        />

        {/* Voice Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={handleMicAction}
            disabled={isTranscribing}
            className={`px-5 py-3 rounded-xl font-semibold text-xs flex items-center space-x-2 transition duration-300 ${isRecording
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse'
              : 'bg-neonBlue/10 border border-neonBlue/20 text-neonBlue hover:bg-neonBlue/20'
              }`}
          >
            {isRecording ? (
              <><Square className="w-4 h-4 fill-white" /><span>Stop Recording</span></>
            ) : (
              <><Mic className="w-4 h-4" /><span>Answer by Voice</span></>
            )}
          </button>

          {audioUrl && !isRecording && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Replay:</span>
              <audio src={audioUrl} controls className="h-8 max-w-[160px] opacity-75" />
            </div>
          )}
        </div>

        {micError && (
          <div className="flex items-center space-x-1.5 text-xs text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Could not record. Ensure mic access is enabled.</span>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleSaveAndPrev}
          disabled={currentIndex === 0}
          className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {currentIndex === totalQuestions - 1 ? (
          <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="flex items-center space-x-1.5 px-6 py-3 rounded-xl bg-neon-gradient text-white font-bold text-xs shadow-neon-blue hover:scale-105 active:scale-95 disabled:opacity-50 transition"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>AI Grading...</span></>
            ) : (
              <><Send className="w-3.5 h-3.5" /><span>Submit & Complete</span></>
            )}
          </button>
        ) : (
          <button
            onClick={handleSaveAndNext}
            className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold transition"
          >
            <span>Next Question</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-darkBg/80 backdrop-blur-md z-[999] flex items-center justify-center p-4"
          >
            <div className="glass-panel p-8 rounded-2xl border border-neonPurple/30 shadow-neon-purple max-w-md text-center space-y-4">
              <Loader2 className="w-12 h-12 text-neonPurple animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Analyzing Interview</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                AI is evaluating your answers + proctoring data. This may take 10–15 seconds.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewSession;