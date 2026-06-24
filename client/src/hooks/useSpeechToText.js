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

  useEffect(() => {
    // Check if webkitSpeechRecognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentText = browserTranscriptRef.current + finalTranscript + interimTranscript;
        setTranscript(currentText);
      };

      recognition.onerror = (event) => {
        console.warn('Browser SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission blocked.');
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      setAudioUrl('');
      browserTranscriptRef.current = '';
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
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        // Perform Whisper Transcription
        await transcribeAudioWithWhisper(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Start browser recognition for real-time text feedback (if supported)
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
      formData.append('audio', audioBlob, 'response.webm');

      // POST to backend Whisper endpoint
      const response = await api.post('/interview/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.transcript) {
        // Update with Whisper transcript
        setTranscript(response.data.transcript);
      }
    } catch (err) {
      console.warn('Whisper API failed/not configured. Falling back to browser speech recognition.');
      // If Whisper failed, we keep the live browser transcript
      if (!transcript) {
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
