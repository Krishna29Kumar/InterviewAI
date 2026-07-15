/**
 * FILE: client/src/hooks/useSpeechToText.js
 * ================================================================
 * YE FILE KYA HAI: Voice-se-answer-dena feature ka poora logic —
 * microphone record karna, live text dikhana, aur audio ko backend
 * bhejna.
 *
 * DO-LAYER TRANSCRIPTION STRATEGY (important design decision):
 *   Layer 1 (LIVE, instant): Browser ka built-in `SpeechRecognition`
 *      API real-time mein bolte-bolte text dikhata hai — koi network
 *      call nahi, turant response.
 *   Layer 2 (BACKEND, jab recording ruke): Recorded audio backend
 *      `/interview/transcribe` ko bheja jaata hai (Whisper ke liye
 *      design kiya gaya tha).
 *
 *   VARTAMAN STATUS: Backend ka Whisper service abhi jaan-boojh kar
 *   DISABLED hai (dekho server/services/aiService.js — transcribeAudio()
 *   hamesha error throw karta hai). Isliye har baar backend call FAIL
 *   hoti hai, aur catch block automatically Layer 1 (jo already live
 *   record ho chuka tha) ko final answer maan leta hai. Matlab feature
 *   poori tarah kaam karta hai, sirf "backend AI transcription" ki
 *   jagah "browser's own speech recognition" use ho raha hai — bina
 *   kisi paid API ke.
 *
 * WAV ENCODING: Browser audio ko WebM format mein record karta hai,
 * lekin standard tarike se sunne/save karne ke liye ise WAV (raw PCM)
 * mein convert karte hain (neeche diye gaye helper functions se) —
 * ye pure JavaScript mein manual WAV file banate hain, kisi library
 * ki zaroorat nahi.
 *
 * CHROME BUG WORKAROUND: Chrome mein ek known issue hai jahan ek
 * SpeechRecognition instance 'network' error ke baad hamesha ke liye
 * kharab ho jaata hai. Isliye `createRecognitionInstance()` HAR BAAR
 * recording start hone par ek FRESH instance banata hai.
 *
 * PROJECT MEIN ROLE: InterviewSession.jsx "Answer by Voice" button
 * is hook ko use karta hai.
 */

import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

export const useSpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const browserTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');

  // Har recording session ke liye NAYI SpeechRecognition instance banao.
  // Chrome ke us bug se bachne ke liye jisme purani instance 'network'
  // error ke baad permanently unusable ho jaati hai.
  const createRecognitionInstance = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = (finalTranscript + interimTranscript).trim();
      setTranscript(currentText); // Live UI update — bolte hi text dikhta hai
      latestTranscriptRef.current = currentText; // Ref mein bhi rakho (fallback ke liye baad mein chahiye)
    };

    recognition.onerror = (event) => {
      console.warn('Browser SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission blocked.');
      } else if (event.error === 'network') {
        setError('Speech recognition network error. Try disabling browser extensions or use Incognito mode.');
      }
    };

    return recognition;
  };

  useEffect(() => {
    // Component unmount hone pe recognition band kar do (memory leak se bachne ke liye)
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Recognition cleanup error:', e);
        }
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setAudioUrl('');
      browserTranscriptRef.current = '';
      latestTranscriptRef.current = '';
      audioChunksRef.current = [];

      // Microphone permission maango
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio recording ke liye MediaRecorder setup
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop()); // Mic release karo

        setIsTranscribing(true);
        try {
          // Compressed WebM ko raw PCM AudioBuffer mein decode karo
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Standard WAV format mein convert karo (playback/compatibility ke liye)
          const wavBlob = bufferToWav(audioBuffer);
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);

          await transcribeAudioWithWhisper(wavBlob);
        } catch (convErr) {
          console.warn('WAV conversion failed, using WebM fallback:', convErr);
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          await transcribeAudioWithWhisper(audioBlob);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Real-time text feedback ke liye browser recognition bhi saath mein chalao
      recognitionRef.current = createRecognitionInstance();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Recognition start error:', e);
        }
      }
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Recognition stop error:', e);
        }
      }
    }
  };

  // Backend ko audio bhejo (Whisper ke liye tha) — abhi ye HAMESHA FAIL
  // hoga (Whisper disabled hai), jisse catch block mein browser ka
  // already-live transcript final answer ban jaata hai
  const transcribeAudioWithWhisper = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'response.wav');

      const response = await api.post('/interview/transcribe', formData);

      if (response.data.transcript) {
        setTranscript(response.data.transcript);
        latestTranscriptRef.current = response.data.transcript;
      }
    } catch (err) {
      console.warn('Whisper API failed/not configured. Falling back to browser speech recognition.');
      // Whisper fail hua — jo bhi browser ne live sun ke transcribe kiya tha, wahi use karo
      if (latestTranscriptRef.current) {
        setTranscript(latestTranscriptRef.current);
      } else {
        setTranscript('Browser speech recognition failed. Please type your answer or verify your mic settings.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setAudioUrl('');
    setError(null);
  };

  return {
    isRecording,
    transcript,
    audioUrl,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    setTranscript // Manual editing allow karo (user apna transcript type karke fix kar sake)
  };
};

// ═══════════════════════════════════════════════════════════════
// WAV ENCODING HELPERS — Pure JavaScript mein audio ko WAV format
// mein convert karne ke liye (koi external library use nahi ki)
// ═══════════════════════════════════════════════════════════════

const bufferToWav = (buffer) => {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = raw PCM
  const bitDepth = 16;

  let result;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  return writeWavFile(result, numOfChan, sampleRate, format, bitDepth);
};

// Stereo audio ke do channels ko ek stream mein mix karo
const interleave = (inputL, inputR) => {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
};

// WAV file ka binary header + data manually likhta hai (RIFF/WAVE format spec ke hisaab se)
const writeWavFile = (samples, numOfChan, sampleRate, format, bitDepth) => {
  const blockAlign = numOfChan * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: 'audio/wav' });
};

// Float32 audio samples ko 16-bit PCM integers mein convert karo
const floatTo16BitPCM = (output, offset, input) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
