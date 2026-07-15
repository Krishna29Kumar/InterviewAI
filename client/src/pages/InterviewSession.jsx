import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { saveAnswer, nextQuestion, prevQuestion, submitInterview } from '../redux/slices/interviewSlice';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { initiateSocketConnection, disconnectSocket, emitSocketEvent } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Volume2, VolumeX, Mic, Square, ChevronLeft, ChevronRight, Send, Timer, Loader2, AlertTriangle, CameraOff, Shield } from 'lucide-react';
import { useAnomalyDetector, MAX_WARNINGS } from '../hooks/useAnomalyDetector';
import { useCopyPasteDetector } from '../hooks/useCopyPasteDetector';
import TerminationModal from '../components/TerminationModal';
import AnomalyOverlay from '../components/AnomalyOverlay';
import AnomalyReport from '../components/AnomalyReport';
const QUESTION_TIME_LIMIT = 180;
const InterviewSession = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentInterview, currentIndex, answers, loading } = useSelector((state) => state.interview);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camEnabled, setCamEnabled] = useState(false);
  const [violation, setViolation] = useState(null);
  const [camError, setCamError] = useState('');
  const [anomalySummary, setAnomalySummary] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const { currentAnomalies, currentScore, isCameraOn, tabSwitchCount, isServiceOnline, getSessionSummary, reset: resetAnomalies, warningCount } = useAnomalyDetector({ videoRef, isActive: camEnabled, intervalMs: 3000 });

  const { isRecording, transcript, audioUrl, isTranscribing, error: micError, startRecording, stopRecording, resetTranscript } = useSpeechToText();
  const { speak, stop: stopSpeech, isPlaying: isSpeaking } = useTextToSpeech();
  const [answerText, setAnswerText] = useState('');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const totalQuestions = currentInterview?.questions?.length || 0;
  const currentQuestionText = currentInterview?.questions?.[currentIndex]?.questionText || '';

  // Copy-paste detection (currentQuestionText ke baad)
  useCopyPasteDetector({
    currentQuestion: currentQuestionText,
    isActive: !!currentInterview && !violation,
    onViolation: async (v) => {
      setViolation(v);
      stopWebcam();
    },
  });
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamEnabled(true); setCamError(''); resetAnomalies();
    } catch (err) { setCamError('Camera access nahi mili.'); toast.error('Camera permission denied!'); }
  };
  const stopWebcam = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCamEnabled(false);
  };
  // User ne khud camera-off button dabaya (session ke dauran) — yeh bhi
  // ek violation hai, warna candidate jaan-boojh kar khud camera band
  // karke proctoring se bach sakta tha.
  const handleManualCameraOff = () => {
    if (currentInterview && !violation) {
      setViolation({ type: 'camera_off', timestamp: new Date().toISOString() });
    }
    stopWebcam();
  };
  useEffect(() => { if (currentInterview) startWebcam(); return () => stopWebcam(); }, [currentInterview?._id]);

  // Camera off DURING active session — strict: instant terminate + 0 score
  useEffect(() => {
    if (currentInterview && camEnabled && !isCameraOn && !violation) {
      setViolation({ type: 'camera_off', timestamp: new Date().toISOString() });
      stopWebcam();
    }
  }, [isCameraOn, currentInterview, violation, camEnabled]);
  useEffect(() => { if (tabSwitchCount > 0) toast.error('Tab switch detected! (' + tabSwitchCount + 'x)'); }, [tabSwitchCount]);
  useEffect(() => {
    if (warningCount > 0 && warningCount < MAX_WARNINGS) {
      toast.error(`Proctoring Warning ${warningCount}/${MAX_WARNINGS}! Sustained anomaly detected.`);
    }
  }, [warningCount]);
  useEffect(() => {
    if (warningCount >= MAX_WARNINGS && !violation) {
      setViolation({ type: 'proctoring_warnings', timestamp: new Date().toISOString() });
      stopWebcam();
    }
  }, [warningCount, violation]);
  useEffect(() => { if (!currentInterview) navigate('/setup'); }, [currentInterview, navigate]);
  useEffect(() => {
    if (currentInterview?._id) { initiateSocketConnection(currentInterview._id); emitSocketEvent('start_interview', { interviewId: currentInterview._id, role: currentInterview.role }); }
    return () => disconnectSocket();
  }, [currentInterview?._id]);
  useEffect(() => {
    const existing = answers.find((ans) => ans.questionIndex === currentIndex);
    setAnswerText(existing ? existing.answerText : ''); resetTranscript(); setTimeLeft(QUESTION_TIME_LIMIT);
  }, [currentIndex]);
  useEffect(() => { if (transcript) setAnswerText(transcript); }, [transcript]);
  useEffect(() => {
    if (timeLeft <= 0) { toast.error('Time limit reached.'); handleSaveAndNext(); return; }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);
  useEffect(() => { if (micError) toast.error(micError); }, [micError]);
  const handleCopy = (e) => { e.preventDefault(); toast.error('Copy not allowed!'); };
  const handlePaste = (e) => { e.preventDefault(); toast.error('Paste not allowed!'); };
  const handleCut = (e) => { e.preventDefault(); toast.error('Cut not allowed!'); };
  const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && ['c','v','x','a'].includes(e.key.toLowerCase())) { e.preventDefault(); toast.error('Shortcuts disabled!'); } };
  const handleSaveAndNext = () => {
    stopRecording(); stopSpeech();
    dispatch(saveAnswer({ questionIndex: currentIndex, answerText: answerText || 'No answer provided.', audioUrl: audioUrl || '' }));
    emitSocketEvent('submit_answer', { interviewId: currentInterview._id, questionIndex: currentIndex });
    if (currentIndex < totalQuestions - 1) dispatch(nextQuestion());
  };
  const handleSaveAndPrev = () => {
    stopRecording(); stopSpeech();
    dispatch(saveAnswer({ questionIndex: currentIndex, answerText: answerText || 'No answer provided.', audioUrl: audioUrl || '' }));
    if (currentIndex > 0) dispatch(prevQuestion());
  };
  const handleFinalSubmit = async () => {
    stopRecording(); stopSpeech(); stopWebcam();
    const summary = getSessionSummary(); setAnomalySummary(summary);
    const finalAnswerObj = { questionIndex: currentIndex, answerText: answerText || 'No answer provided.', audioUrl: audioUrl || '' };
    dispatch(saveAnswer(finalAnswerObj));
    const allAnswers = [...answers.filter((a) => a.questionIndex !== currentIndex), finalAnswerObj];
    emitSocketEvent('request_evaluation', { interviewId: currentInterview._id });
    const resultAction = await dispatch(submitInterview({ interviewId: currentInterview._id, answers: allAnswers }));
    if (submitInterview.fulfilled.match(resultAction)) { toast.success('Interview evaluated!'); setShowReport(true); }
    else toast.error(resultAction.payload || 'Evaluation failed.');
  };
  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60)<10?'0':''}${s%60}`;
  if (!currentInterview) return null;
  if (showReport && anomalySummary) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Interview Complete!</h2>
          <p className="text-gray-400 text-sm">Proctoring report:</p>
        </div>
        <AnomalyReport summary={anomalySummary} />
        <div className="text-center">
          <button onClick={() => navigate('/dashboard')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm hover:scale-105 transition">View Results →</button>
        </div>
      </div>
    );
  }
  const scoreColor = currentScore >= 80 ? '#22c55e' : currentScore >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 relative z-10">
      <TerminationModal violation={violation} onConfirm={() => navigate('/dashboard')} />
      <AnomalyOverlay anomalies={currentAnomalies} score={currentScore} isCameraOn={isCameraOn} />
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-darkBorder">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {currentInterview.role}
            </span>
            <span className="text-xs font-semibold text-neonPurple bg-neonPurple/10 border border-neonPurple/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {currentInterview.difficulty}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-2 tracking-tight">Secure Assessment Session</h2>
        </div>
        
        {/* System & Clock Info */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-darkBorder bg-white/3 text-gray-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connection Secure</span>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${timeLeft < 30 ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 animate-pulse' : 'border-darkBorder bg-white/5 text-gray-200 font-mono font-bold'}`}>
            <Timer className="w-4 h-4 text-neonBlue" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Splitscreen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Camera Feed & Proctoring Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Webcam Box */}
          <div className="glass-panel rounded-2xl border border-darkBorder overflow-hidden bg-black/40 relative shadow-lg" style={{ aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camEnabled ? 'block' : 'hidden'}`} />
            
            {!camEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-black/50 backdrop-blur-sm">
                <CameraOff className="w-10 h-10 text-gray-500" />
                <p className="text-sm font-semibold text-gray-300">Webcam Inactive</p>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Camera is required for candidate identity verification during the session.
                </p>
                {camError && <p className="text-xs text-rose-400">{camError}</p>}
                <button onClick={startWebcam} className="text-xs px-4 py-2 rounded-xl bg-neonBlue/10 border border-neonBlue/30 text-neonBlue hover:bg-neonBlue/20 font-bold transition duration-200">
                  Enable Video Feed
                </button>
              </div>
            )}
            
            {camEnabled && (
              <>
                {/* Live Badge */}
                <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-black/75 rounded-full px-3 py-1 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Live Feed</span>
                </div>
                {/* Toggle Cam */}
                <button onClick={handleManualCameraOff} className="absolute top-3 right-3 p-2 rounded-full bg-black/75 text-gray-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 transition duration-200">
                  <CameraOff className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Proctoring Log Box */}
          <div className="glass-panel rounded-2xl border border-darkBorder p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-darkBorder pb-3">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Verification Console</span>
              <Shield className="w-4 h-4 text-neonBlue" />
            </div>
            
            <div className="space-y-3.5">
              {/* Score Metric */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 text-xs">Integrity Score:</span>
                <span className="font-bold" style={{ color: scoreColor }}>
                  {currentScore}/100
                </span>
              </div>
              
              {/* Integrity Progress Bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${currentScore}%`, backgroundColor: scoreColor }} />
              </div>

              {/* Status List */}
              <div className="pt-2 divide-y divide-white/5 text-xs text-gray-400">
                <div className="flex justify-between py-2.5">
                  <span>Tab Focus Status</span>
                  {tabSwitchCount > 0 ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Failed ({tabSwitchCount}x)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Secure</span>
                  )}
                </div>
                <div className="flex justify-between py-2.5">
                  <span>Eye Tracking Gaze</span>
                  <span className="text-emerald-400 font-semibold">Calibrated</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span>AI Proctoring Service</span>
                  <span className={isServiceOnline ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {isServiceOnline ? "Active" : "Connecting..."}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span>Proctoring Warnings</span>
                  <span className={warningCount > 0 ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"}>
                    {warningCount}/{MAX_WARNINGS}
                  </span>
                </div>
              </div>

              {/* Active Violations Alerts */}
              {camEnabled && currentAnomalies.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Active Alerts:</p>
                  {currentAnomalies.slice(0, 2).map((anomaly) => (
                    <div key={anomaly} className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{anomaly.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question & Workspace */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Question Box */}
          <div className="glass-panel rounded-2xl border border-darkBorder p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-darkBorder pb-3">
              <span className="text-xs font-bold text-neonPurple uppercase tracking-widest">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-neon-gradient transition-all duration-300" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-xl text-white font-semibold leading-relaxed tracking-tight">
                {currentQuestionText}
              </p>
            </div>

            {/* Read Aloud Section */}
            <div className="pt-2 flex items-center space-x-3">
              <button 
                onClick={() => isSpeaking ? stopSpeech() : speak(currentQuestionText)} 
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${isSpeaking ? 'bg-neonPurple/20 border-neonPurple/50 text-neonPurple shadow-neon-purple/20' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? 'Mute Question' : 'Read Out Loud (TTS)'}</span>
              </button>
            </div>
          </div>

          {/* Response Pad Box */}
          <div className="glass-panel rounded-2xl border border-darkBorder overflow-hidden flex flex-col">
            {/* Header bar representing file edit tab */}
            <div className="bg-black/20 border-b border-darkBorder px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-xs font-mono text-gray-400 pl-2 border-l border-white/5">candidate_response.md</span>
              </div>
              {isTranscribing && (
                <span className="flex items-center space-x-1.5 text-xs text-neonBlue">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting Speech to Text...</span>
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Keyboard paste restriction notice */}
              <div className="text-[11px] text-gray-500 bg-white/3 border border-darkBorder rounded-xl p-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <span>Notice: Keyboard shortcuts, right-clicks, and paste actions are disabled for assessment validity.</span>
              </div>

              {/* Response textarea */}
              <textarea 
                value={answerText} 
                onChange={(e) => setAnswerText(e.target.value)} 
                onCopy={handleCopy} 
                onPaste={handlePaste} 
                onCut={handleCut} 
                onKeyDown={handleKeyDown} 
                onContextMenu={(e) => e.preventDefault()} 
                placeholder="Compose your response here. Provide detailed explanations, code snippets, or architecture details where applicable..." 
                className="w-full min-h-[220px] p-4 rounded-xl text-sm font-mono text-gray-200 glass-input resize-none focus:ring-1 focus:ring-neonBlue/30" 
              />

              {/* Audio/Voice Recording Controls */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-darkBorder/40">
                <button 
                  onClick={() => isRecording ? stopRecording() : startRecording()} 
                  disabled={isTranscribing} 
                  className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isRecording ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/20' : 'bg-neonBlue/15 border border-neonBlue/30 text-neonBlue hover:bg-neonBlue/25'}`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Voice Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Respond by Spoken Voice</span>
                    </>
                  )}
                </button>

                {audioUrl && !isRecording && (
                  <div className="flex items-center space-x-3 bg-white/3 rounded-xl px-4 py-2 border border-darkBorder">
                    <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Review Speech:</span>
                    <audio src={audioUrl} controls className="h-8 max-w-[180px] opacity-90 scale-90 origin-left" />
                  </div>
                )}
              </div>

              {micError && (
                <div className="text-xs text-amber-400 bg-amber-400/5 border border-amber-400/10 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Microphone initialization error: {micError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button 
              onClick={handleSaveAndPrev} 
              disabled={currentIndex === 0} 
              className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-darkBorder bg-white/3 text-gray-300 hover:text-white text-xs font-bold disabled:opacity-20 disabled:pointer-events-none hover:bg-white/5 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back Question</span>
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button 
                onClick={handleFinalSubmit} 
                disabled={loading} 
                className="flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-neon-gradient text-white font-extrabold text-xs shadow-neon-blue hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Answers...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & End Assessment</span>
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handleSaveAndNext} 
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-neonBlue/40 text-white text-xs font-bold transition-all duration-200 hover:scale-[1.02]"
              >
                <span>Save & Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Analysis Loading Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-darkBg/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-2xl border border-neonPurple/30 max-w-md text-center space-y-4 shadow-2xl">
              <Loader2 className="w-12 h-12 text-neonPurple animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Analyzing Interview</h3>
              <p className="text-gray-400 text-xs">AI is evaluating your answers. 10-15 seconds.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default InterviewSession;
