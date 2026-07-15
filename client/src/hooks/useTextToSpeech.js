/**
 * FILE: client/src/hooks/useTextToSpeech.js
 * ================================================================
 * YE FILE KYA HAI: "Read Question Aloud" feature ka logic — browser
 * ke built-in Text-to-Speech (Web Speech Synthesis API) ko wrap karta
 * hai. Koi backend/paid API use nahi hoti, poora free hai.
 *
 * FUNCTIONS:
 *   speak(text) → Diya gaya text bolna shuru karta hai. Agar koi
 *      Google/Natural-sounding voice available ho browser mein, use
 *      priority se select karta hai (default robotic voice se better
 *      lagta hai).
 *   stop()      → Turant bolna band kar deta hai
 *
 * PROJECT MEIN ROLE: InterviewSession.jsx mein "Read Out Loud (TTS)"
 * button is hook ko use karta hai taaki candidate question sun sake,
 * padhna zaroori na ho.
 */

import { useState, useEffect, useRef } from 'react';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // Component unmount hone pe agar kuch bol raha ho toh band kar do
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

    window.speechSynthesis.cancel(); // Pehle se koi bol raha ho toh rok do

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Achhi quality wali voice dhoondo (Google/Natural), default robotic se better
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US'
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.rate = 1.0;  // Normal reading speed
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
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
