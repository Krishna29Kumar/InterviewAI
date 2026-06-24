import { useState, useEffect, useRef } from 'react';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Stop speaking when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) {
      console.warn('Text-to-speech is not supported in this browser.');
      return;
    }

    // Cancel active synthesis
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Use default premium voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US'
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.rate = 1.0; // standard reading speed
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return {
    speak,
    stop,
    isPlaying,
  };
};
