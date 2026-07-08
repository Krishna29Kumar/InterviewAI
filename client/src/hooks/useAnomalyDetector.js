/**
 * FILE: client/src/hooks/useAnomalyDetector.js
 * ==============================================
 *
 * Yeh hook detect karta hai:
 *   ✅ Pose anomalies (YOLOv8n via backend)
 *   ✅ Tab switch (browser Visibility API)
 *   ✅ Camera off/on
 *   ✅ Background voice / multiple voices (Web Audio API)
 *   ✅ Session ka poora log
 *   ✅ End-of-session summary
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────
// Anomaly ke human-readable labels
// ─────────────────────────────────────────────────
export const ANOMALY_LABELS = {
  no_person_detected:      'Camera mein koi nahi dikh raha',
  multiple_people:         '2 ya zyada log camera mein hain',
  face_turned_away:        'Muh camera se fera hua hai',
  eyes_not_on_screen:      'Aankhen screen pe nahi hain',
  looking_down:            'Neeche dekh rahe ho',
  slouching:               'Seedha baitho — posture kharab hai',
  uneven_shoulders:        'Kandhe ek taraf jhuke hain',
  leaning_sideways:        'Ek taraf jhuke hue ho',
  hand_near_face:          'Haath muh ke paas hai',
  excessive_hand_gesture:  'Haath zyada hilaa rahe ho',
  arms_out_of_frame:       'Haath frame se bahar ja rahe hain',
  too_far_from_camera:     'Camera se bahut door ho',
  too_close_to_camera:     'Camera ke bahut paas ho',
  tab_switched:            'Tab switch kiya!',
  background_voice:        'Background mein awaaz aa rahi hai',
  multiple_voices:         'Ek se zyada awaazein sun rahi hain',
  camera_off:              'Camera band ho gaya',
  frame_decode_error:      'Camera frame read nahi ho raha',
};

export const ANOMALY_SEVERITY = {
  no_person_detected:     'critical',
  multiple_people:        'critical',
  tab_switched:           'critical',
  camera_off:             'critical',
  face_turned_away:       'high',
  eyes_not_on_screen:     'high',
  hand_near_face:         'high',
  multiple_voices:        'high',
  looking_down:           'medium',
  background_voice:       'medium',
  slouching:              'low',
  uneven_shoulders:       'low',
  leaning_sideways:       'low',
  excessive_hand_gesture: 'low',
  arms_out_of_frame:      'low',
  too_far_from_camera:    'low',
  too_close_to_camera:    'low',
};

export const ANOMALY_TIPS = {
  no_person_detected:      'Apna chehra camera ke saamne rakho',
  multiple_people:         'Private room mein baitho, koi aur na dikhay',
  face_turned_away:        'Camera ki taraf seedha dekho',
  eyes_not_on_screen:      'Screen pe focus rakho',
  looking_down:            'Notes upar rakho, neeche mat dekho',
  slouching:               'Seedhe baitho, kamar seedhi rakho',
  uneven_shoulders:        'Dono kandhe barabar level pe rakho',
  leaning_sideways:        'Frame ke center mein raho',
  hand_near_face:          'Haath muh se door rakho',
  excessive_hand_gesture:  'Haath ko shant rakho',
  arms_out_of_frame:       'Haath frame ke andar rakho',
  too_far_from_camera:     'Camera ke thoda paas aao',
  too_close_to_camera:     'Camera se thoda door jao',
  tab_switched:            'Interview window pe wapas aao!',
  background_voice:        'Quiet jagah pe baitho',
  multiple_voices:         'Akele kaho — koi aur bol raha lag raha hai',
  camera_off:              'Camera on karo',
};

function getRating(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 35) return 'Needs Improvement';
  return 'Poor';
}

// ─────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────
export const useAnomalyDetector = ({
  videoRef,
  isActive   = false,
  intervalMs = 3000,
}) => {
  // Hidden canvas for frame capture
  const canvasRef        = useRef(null);
  const poseTimerRef     = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const micStreamRef     = useRef(null);
  const voiceTimerRef    = useRef(null);
  const tabCountRef      = useRef(0);
  const frameCountRef    = useRef(0);
  const voiceAnomsRef    = useRef([]);    // latest voice anomalies (for merge)

  const [currentAnomalies, setCurrentAnomalies] = useState([]);
  const [currentScore,     setCurrentScore]     = useState(100);
  const [sessionLog,       setSessionLog]       = useState([]);
  const [tabSwitchCount,   setTabSwitchCount]   = useState(0);
  const [isCameraOn,       setIsCameraOn]       = useState(true);
  const [isServiceOnline,  setIsServiceOnline]  = useState(true);

  // Create hidden canvas once on mount
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width  = 320;
    c.height = 240;
    c.style.display = 'none';
    document.body.appendChild(c);
    canvasRef.current = c;
    return () => c.remove();
  }, []);

  // ──────────────────────────────────────────────
  // 1. TAB SWITCH DETECTION
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const onVisibility = () => {
      if (document.hidden) {
        tabCountRef.current += 1;
        setTabSwitchCount(tabCountRef.current);

        const entry = {
          timestamp: Date.now(),
          anomalies: ['tab_switched'],
          score: 0,
          details: { count: tabCountRef.current },
          category: 'tab',
        };
        setSessionLog(prev => [...prev, entry]);
        setCurrentAnomalies(prev => [...new Set([...prev, 'tab_switched'])]);
      } else {
        // Wapas aaya — 2 sec baad warning hatao
        setTimeout(() => {
          setCurrentAnomalies(prev => prev.filter(a => a !== 'tab_switched'));
        }, 2500);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isActive]);

  // ──────────────────────────────────────────────
  // 2. BACKGROUND / MULTIPLE VOICE DETECTION
  // ──────────────────────────────────────────────
  const startVoiceMonitor = useCallback(async () => {
    try {
      const stream  = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);

      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;

      const buf = new Uint8Array(analyser.frequencyBinCount);

      voiceTimerRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buf);

        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;

        let va = [];
        if (avg > 55)      va = ['multiple_voices'];
        else if (avg > 22) va = ['background_voice'];

        voiceAnomsRef.current = va;

        if (va.length > 0) {
          const entry = {
            timestamp: Date.now(),
            anomalies: va,
            score: avg > 55 ? 55 : 78,
            details: { audio_avg: Math.round(avg) },
            category: 'voice',
          };
          setSessionLog(prev => [...prev, entry]);
        }
      }, 2000);

    } catch (e) {
      console.warn('[VoiceMonitor] Mic nahi mila:', e.message);
    }
  }, []);

  const stopVoiceMonitor = useCallback(() => {
    clearInterval(voiceTimerRef.current);
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    voiceAnomsRef.current = [];
  }, []);

  // ──────────────────────────────────────────────
  // 3. CAMERA STATUS CHECK
  // ──────────────────────────────────────────────
  const checkCamera = useCallback(() => {
    const video  = videoRef?.current;
    if (!video) return;

    const tracks = video.srcObject?.getVideoTracks?.() || [];
    const on     = tracks.length > 0 && tracks[0].readyState === 'live';
    setIsCameraOn(on);

    if (!on) {
      setSessionLog(prev => {
        const last = prev[prev.length - 1];
        if (last?.anomalies?.includes('camera_off')) return prev;
        return [...prev, {
          timestamp: Date.now(),
          anomalies: ['camera_off'],
          score: 0,
          details: { msg: 'Video track live nahi' },
          category: 'camera',
        }];
      });
      setCurrentAnomalies(prev => [...new Set([...prev, 'camera_off'])]);
    } else {
      setCurrentAnomalies(prev => prev.filter(a => a !== 'camera_off'));
    }
  }, [videoRef]);

  // ──────────────────────────────────────────────
  // 4. POSE FRAME CAPTURE + ANALYSIS
  // ──────────────────────────────────────────────
  const captureAndSend = useCallback(async () => {
    checkCamera();

    const video  = videoRef?.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    // Draw frame on hidden canvas
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
    const b64 = canvas.toDataURL('image/jpeg', 0.65);

    try {
      const { data } = await axios.post('/api/pose/analyze-frame', { image: b64 });

      const poseAnoms = data.anomalies || [];
      const voiceAnoms = voiceAnomsRef.current;
      const all = [...new Set([...poseAnoms, ...voiceAnoms])];

      frameCountRef.current += 1;
      setCurrentAnomalies(prev => {
        // Keep tab_switched / camera_off if they were set — merge with pose result
        const sticky = prev.filter(a => ['tab_switched', 'camera_off'].includes(a));
        return [...new Set([...sticky, ...all])];
      });
      setCurrentScore(data.score ?? 100);
      setIsServiceOnline(!data.service_down);

      if (all.length > 0) {
        setSessionLog(prev => [...prev, {
          timestamp:    Date.now(),
          anomalies:    all,
          score:        data.score ?? 100,
          details:      data.details || {},
          person_count: data.person_count ?? 1,
          category:     'pose',
        }]);
      }
    } catch (err) {
      console.warn('[AnomalyDetector]', err.message);
    }
  }, [videoRef, checkCamera]);

  // ──────────────────────────────────────────────
  // START / STOP
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (isActive) {
      captureAndSend();
      poseTimerRef.current = setInterval(captureAndSend, intervalMs);
      startVoiceMonitor();
    } else {
      clearInterval(poseTimerRef.current);
      stopVoiceMonitor();
      setCurrentAnomalies([]);
    }
    return () => {
      clearInterval(poseTimerRef.current);
      stopVoiceMonitor();
    };
  }, [isActive, intervalMs, captureAndSend, startVoiceMonitor, stopVoiceMonitor]);

  // ──────────────────────────────────────────────
  // SESSION SUMMARY
  // ──────────────────────────────────────────────
  const getSessionSummary = useCallback(() => {
    const fc = frameCountRef.current;
    if (sessionLog.length === 0) return {
      totalFlags: 0, averageScore: 100, topIssues: [],
      flagRate: '0%', overallRating: 'Excellent',
      tabSwitches: tabCountRef.current, rawLog: [],
    };

    const counts = {};
    sessionLog.forEach(e => e.anomalies.forEach(a => { counts[a] = (counts[a] || 0) + 1; }));

    const topIssues = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type, count,
        label:      ANOMALY_LABELS[type] || type,
        severity:   ANOMALY_SEVERITY[type] || 'medium',
        tip:        ANOMALY_TIPS[type] || '',
        percentage: Math.round((count / Math.max(fc, 1)) * 100),
      }));

    const avgScore = Math.round(
      sessionLog.reduce((s, e) => s + (e.score ?? 100), 0) / sessionLog.length
    );

    return {
      totalFlags:    sessionLog.length,
      averageScore:  avgScore,
      topIssues,
      flagRate:      `${Math.round((sessionLog.length / Math.max(fc, 1)) * 100)}%`,
      overallRating: getRating(avgScore),
      tabSwitches:   tabCountRef.current,
      rawLog:        sessionLog,
    };
  }, [sessionLog]);

  const reset = useCallback(() => {
    setSessionLog([]);
    setCurrentAnomalies([]);
    setCurrentScore(100);
    setTabSwitchCount(0);
    tabCountRef.current   = 0;
    frameCountRef.current = 0;
    voiceAnomsRef.current = [];
  }, []);

  return {
    currentAnomalies,
    currentScore,
    sessionLog,
    tabSwitchCount,
    isCameraOn,
    isServiceOnline,
    getSessionSummary,
    reset,
  };
};
