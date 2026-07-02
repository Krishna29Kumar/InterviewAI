import React, { useEffect, useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

const QUESTION_TIME_LIMIT = 180; // 3 minutes per question in seconds

const InterviewSession = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentInterview, currentIndex, answers, loading } = useSelector((state) => state.interview);

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

  // Redirect if session is missing
  useEffect(() => {
    if (!currentInterview) {
      navigate('/setup');
    }
  }, [currentInterview, navigate]);

  // Socket Connection Setup
  useEffect(() => {
    if (currentInterview?._id) {
      initiateSocketConnection(currentInterview._id);
      emitSocketEvent('start_interview', { interviewId: currentInterview._id, role: currentInterview.role });
    }

    return () => {
      disconnectSocket();
    };
  }, [currentInterview]);

  // Load existing answer for current question index
  useEffect(() => {
    const existing = answers.find((ans) => ans.questionIndex === currentIndex);
    setAnswerText(existing ? existing.answerText : '');
    resetTranscript();
    setTimeLeft(QUESTION_TIME_LIMIT);
  }, [currentIndex, answers]);

  // Keep manual text field synced with speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setAnswerText(transcript);
    }
  }, [transcript]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.warn("Time limit reached for this question. Saving current draft.");
      handleSaveAndNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle errors from speech Hook
  useEffect(() => {
    if (micError) {
      toast.error(micError);
    }
  }, [micError]);

  const handleSaveAndNext = () => {
    // Stop recording and speech if running
    stopRecording();
    stopSpeech();

    // Save answer to Redux/Local cache
    dispatch(
      saveAnswer({
        questionIndex: currentIndex,
        answerText: answerText || 'No answer provided.',
        audioUrl: audioUrl || '',
      })
    );

    // Socket notify
    emitSocketEvent('submit_answer', { interviewId: currentInterview._id, questionIndex: currentIndex });

    // Transition index
    if (currentIndex < totalQuestions - 1) {
      dispatch(nextQuestion());
    }
  };

  const handleSaveAndPrev = () => {
    stopRecording();
    stopSpeech();

    dispatch(
      saveAnswer({
        questionIndex: currentIndex,
        answerText: answerText || 'No answer provided.',
        audioUrl: audioUrl || '',
      })
    );

    if (currentIndex > 0) {
      dispatch(prevQuestion());
    }
  };

  const handleFinalSubmit = async () => {
    stopRecording();
    stopSpeech();

    // Save final question answer first
    const finalAnswerObj = {
      questionIndex: currentIndex,
      answerText: answerText || 'No answer provided.',
      audioUrl: audioUrl || '',
    };

    dispatch(saveAnswer(finalAnswerObj));

    // Combine answers with final input
    const allAnswers = [...answers.filter((a) => a.questionIndex !== currentIndex), finalAnswerObj];

    // Trigger Socket notify
    emitSocketEvent('request_evaluation', { interviewId: currentInterview._id });

    // Submit all to API
    const resultAction = await dispatch(
      submitInterview({
        interviewId: currentInterview._id,
        answers: allAnswers,
      })
    );

    if (submitInterview.fulfilled.match(resultAction)) {
      toast.success('Interview evaluated!');
      navigate(`/dashboard`);
    } else {
      toast.error(resultAction.payload || 'Evaluation failed. Please try submitting again.');
    }
  };

  const toggleTextToSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      speak(currentQuestionText);
    }
  };

  const handleMicAction = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentInterview) return null;

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10">
      {/* Session Progress Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-neonBlue bg-neonBlue/10 border border-neonBlue/20 px-2.5 py-0.5 rounded-full">
            {currentInterview.role} Practice
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Question {currentIndex + 1} of {totalQuestions}</h2>
        </div>

        {/* Timer */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${
          timeLeft < 30 ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 animate-pulse' : 'border-darkBorder bg-white/5 text-gray-300'
        }`}>
          <Timer className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-neon-gradient transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Primary Card */}
      <div className="glass-panel rounded-2xl border border-darkBorder overflow-hidden shadow-glass flex flex-col md:flex-row min-h-[400px]">
        {/* Left Side: Question Display */}
        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-darkBorder flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs text-neonPurple font-semibold uppercase tracking-widest">Question prompt</span>
            <p className="text-lg md:text-xl text-white font-medium leading-relaxed">{currentQuestionText}</p>
          </div>

          <div className="pt-8 flex items-center space-x-3">
            <button
              onClick={toggleTextToSpeech}
              className={`p-3 rounded-xl border transition duration-300 ${
                isSpeaking
                  ? 'bg-neonPurple/20 border-neonPurple/50 text-neonPurple'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Read question out loud'}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-xs text-gray-500 font-light">
              {isSpeaking ? 'Utterance synthesizer active...' : 'Read out loud using TTS'}
            </span>
          </div>
        </div>

        {/* Right Side: Answer Input Box */}
        <div className="flex-1 p-8 flex flex-col justify-between bg-darkCard/20 space-y-6">
          <div className="space-y-4 flex-grow flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Your Response</span>
              {isTranscribing && (
                <span className="flex items-center space-x-1 text-xs text-neonBlue">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Whisper transcribing...</span>
                </span>
              )}
            </div>
            
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response here, or tap the microphone to dictate your answer..."
              className="w-full flex-grow min-h-[180px] p-4 rounded-xl text-sm text-gray-200 glass-input resize-none"
            />
          </div>

          {/* Voice Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Record Button */}
              <button
                onClick={handleMicAction}
                disabled={isTranscribing}
                className={`px-5 py-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition duration-300 ${
                  isRecording
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 animate-pulse'
                    : 'bg-neonBlue/10 border border-neonBlue/20 text-neonBlue hover:bg-neonBlue/20'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Answer by Spoken Voice</span>
                  </>
                )}
              </button>

              {/* Replay Option */}
              {audioUrl && !isRecording && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-medium">Replay voice:</span>
                  <audio src={audioUrl} controls className="h-8 max-w-[160px] opacity-75 focus:outline-none" />
                </div>
              )}
            </div>

            {/* Error notifications */}
            {micError && (
              <div className="flex items-center space-x-1.5 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Could not record. Ensure mic access is enabled.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls footer */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleSaveAndPrev}
          disabled={currentIndex === 0}
          className="flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {currentIndex === totalQuestions - 1 ? (
          <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="flex items-center space-x-1.5 px-6 py-3 rounded-xl bg-neon-gradient text-white font-bold text-xs shadow-neon-blue bg-neon-gradient-hover hover:scale-105 active:scale-95 disabled:opacity-50 transition duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Grading answers...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit & Complete</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSaveAndNext}
            className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold transition duration-200"
          >
            <span>Next Question</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Evaluation notification popup */}
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
                Our AI feedback engine is evaluating your technical accuracy, communication pace, grammar fluency, and confidence metrics. This can take up to 10-15 seconds.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewSession;
