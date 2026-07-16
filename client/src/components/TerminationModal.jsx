/**
 * FILE: client/src/components/TerminationModal.jsx
 * ==================================================
 * Jab DSA question pe copy-paste detect ho — yeh modal dikhao
 * Interview terminate ho jaata hai aur 0 score milta hai
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, XCircle } from 'lucide-react';

export default function TerminationModal({ violation, onConfirm }) {
    const [secondsLeft, setSecondsLeft] = useState(5);
    // Auto confirm after 5 seconds
    useEffect(() => {
        if (!violation) return;
        const t = setTimeout(() => onConfirm?.(), 5000);
        return () => clearTimeout(t);
    }, [violation, onConfirm]);

    useEffect(() => {
        if (!violation) return;
        setSecondsLeft(5);
        const interval = setInterval(() => {
            setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [violation]);



    if (!violation) return null;

    const violationMessages = {
        keyboard_paste: 'Copy-paste detected on a DSA/Coding question.',
        right_click: 'Right-click detected on a DSA/Coding question.',
        tab_switch: 'Tab switch detected during the interview.',
        fullscreen_exit: 'You exited fullscreen mode and did not return within the time limit.',
        camera_off: 'Camera was turned off during the interview.',
    };
    const violationMessage = violationMessages[violation.type] || 'Copy-Paste attempt detected on a DSA/Coding question.';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.3 }}
                style={{
                    background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)',
                    border: '2px solid #ef4444',
                    borderRadius: '20px',
                    padding: '40px',
                    maxWidth: '480px',
                    width: '100%',
                    textAlign: 'center',
                    color: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    boxShadow: '0 0 60px rgba(239,68,68,0.3)',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(239,68,68,0.15)',
                    border: '2px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <AlertOctagon style={{ width: '40px', height: '40px', color: '#ef4444' }} />
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#ef4444',
                    marginBottom: '12px',
                }}>
                    Interview Terminated
                </h2>

                {/* Message */}
                <p style={{
                    fontSize: '15px',
                    color: '#fca5a5',
                    marginBottom: '8px',
                    lineHeight: 1.6,
                }}>
                    {violation.type === 'proctoring_warnings'
                        ? 'Interview terminated: 5 sustained proctoring warnings (eye tracking / posture / tab / camera) were recorded.'
                        : violation.type === 'fullscreen_exit'
                            ? 'You exited fullscreen mode and did not return within the time limit.'
                            : violation.type === 'camera_off'
                                ? 'Camera was turned off during the interview.'
                                : violation.type === 'tab_switch'
                                    ? 'Tab switch detected during the interview.'
                                    : violation.type === 'right_click'
                                        ? 'Right-click detected on a DSA/Coding question.'
                                        : 'Copy-paste detected on a DSA/Coding question.'}
                </p>
                <p style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '28px',
                    lineHeight: 1.6,
                }}>
                    This is a violation of interview integrity rules.
                    Your score has been set to <strong style={{ color: '#ef4444' }}>0%</strong>.
                </p>

                {/* Violation details */}
                <div style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '24px',
                    textAlign: 'left',
                }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        VIOLATION DETECTED
                    </div>
                    <div style={{ fontSize: '13px', color: '#fca5a5' }}>
                        {violation.type === 'keyboard_paste' ? '⌨️ Keyboard Paste (Ctrl/Cmd+V)' :
                            violation.type === 'right_click' ? '🖱️ Right Click on Answer Field' :
                                violation.type === 'tab_switch' ? '🚨 Tab Switch Detected' :
                                    violation.type === 'fullscreen_exit' ? '🖥️ Fullscreen Mode Exited' :
                                        violation.type === 'camera_off' ? '📷 Camera Turned Off' :
                                            violation.type === 'proctoring_warnings' ? '⚠️ 5 Sustained Proctoring Warnings' :
                                                '📋 Copy-Paste Attempt'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>
                        {new Date(violation.timestamp).toLocaleTimeString()}
                    </div>
                </div>

                {/* Score badge */}
                <div style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: '#ef4444',
                    marginBottom: '8px',
                }}>
                    0%
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '28px' }}>
                    Final Score
                </div>

                {/* Button */}
                <button
                    onClick={onConfirm}
                    style={{
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 700,
                        padding: '14px 32px',
                        width: '100%',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={e => e.target.style.transform = 'scale(1.02)'}
                    onMouseOut={e => e.target.style.transform = 'scale(1)'}
                >
                    Return to Dashboard
                </button>

                <p style={{ fontSize: '11px', color: '#374151', marginTop: '12px' }}>
                    Auto-redirecting in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}...
                </p>
            </motion.div>
        </motion.div>
    );
}