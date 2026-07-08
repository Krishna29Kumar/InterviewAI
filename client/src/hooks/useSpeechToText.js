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

  // Creates a FRESH SpeechRecognition instance each time.
  // Fixes Chrome bug where a recognition instance becomes permanently
  // unusable after a 'network' error.
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
      setTranscript(currentText);
      latestTranscriptRef.current = currentText;
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
    // Stop speaking/listening when component unmounts
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

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        setIsTranscribing(true);
        try {
          // Decode compressed browser audio to PCM AudioBuffer
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Encode AudioBuffer to standard WAV PCM Blob
          const wavBlob = bufferToWav(audioBuffer);
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);

          // Perform Transcription using the WAV blob
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

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Start browser recognition for real-time text feedback (if supported)
      // Fresh instance every time to avoid stale/dead recognition objects.
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

  const transcribeAudioWithWhisper = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'response.wav');

      // POST to backend Whisper endpoint
      const response = await api.post('/interview/transcribe', formData);

      if (response.data.transcript) {
        // Update with Whisper transcript
        setTranscript(response.data.transcript);
        latestTranscriptRef.current = response.data.transcript;
      }
    } catch (err) {
      console.warn('Whisper API failed/not configured. Falling back to browser speech recognition.');
      // If Whisper failed, we keep the live browser transcript
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
    setTranscript // allow manual editing of transcript
  };
};

// ─────────────────────────────────────────────────
// CLIENT SIDE WAV ENCODING UTILITIES (Pure JS)
// ─────────────────────────────────────────────────
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
