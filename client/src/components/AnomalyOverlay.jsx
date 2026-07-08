/**
 * FILE: client/src/components/AnomalyOverlay.jsx
 * =================================================
 * Interview ke dauran floating warning card dikhata hai.
 * Jab bhi anomaly detect ho — yeh upar right corner mein
 * slide karke aata hai aur tip bhi deta hai.
 */

import { useEffect, useState, useRef } from 'react';
import { ANOMALY_LABELS, ANOMALY_TIPS, ANOMALY_SEVERITY } from '../hooks/useAnomalyDetector';

const ICONS = {
  no_person_detected:      '👤',
  multiple_people:         '👥',
  face_turned_away:        '↩️',
  eyes_not_on_screen:      '👀',
  looking_down:            '⬇️',
  slouching:               '🪑',
  uneven_shoulders:        '⚠️',
  leaning_sideways:        '↗️',
  hand_near_face:          '🤚',
  excessive_hand_gesture:  '🙌',
  arms_out_of_frame:       '🦾',
  too_far_from_camera:     '📷',
  too_close_to_camera:     '🔍',
  tab_switched:            '🚨',
  background_voice:        '🔊',
  multiple_voices:         '🗣️',
  camera_off:              '📵',
};

// Priority order — sabse important pehle dikhao
const PRIORITY = [
  'tab_switched','camera_off','multiple_people','no_person_detected',
  'face_turned_away','eyes_not_on_screen','hand_near_face',
  'multiple_voices','looking_down','background_voice',
  'slouching','uneven_shoulders','leaning_sideways',
  'excessive_hand_gesture','arms_out_of_frame',
  'too_far_from_camera','too_close_to_camera',
];

const SEVERITY_COLORS = {
  critical: { border: '#ef4444', bg: 'rgba(239,68,68,0.12)',  text: '#fca5a5', badge: '#ef4444' },
  high:     { border: '#f97316', bg: 'rgba(249,115,22,0.12)', text: '#fdba74', badge: '#f97316' },
  medium:   { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fcd34d', badge: '#f59e0b' },
  low:      { border: '#6366f1', bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', badge: '#6366f1' },
};

export default function AnomalyOverlay({ anomalies = [], score = 100, isCameraOn = true }) {
  const [visible,       setVisible]      = useState(false);
  const [primary,       setPrimary]      = useState(null);
  const [extraCount,    setExtraCount]   = useState(0);
  const dismissRef = useRef(null);

  useEffect(() => {
    const all = [...anomalies];
    if (!isCameraOn && !all.includes('camera_off')) all.unshift('camera_off');

    if (all.length === 0) {
      const t = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(t);
    }

    // Sort by priority
    const sorted = [...all].sort((a, b) => {
      const ai = PRIORITY.indexOf(a);
      const bi = PRIORITY.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    setPrimary(sorted[0]);
    setExtraCount(sorted.length - 1);
    setVisible(true);

    clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(dismissRef.current);
  }, [anomalies, isCameraOn]);

  if (!visible || !primary) return null;

  const sev    = ANOMALY_SEVERITY[primary] || 'medium';
  const colors = SEVERITY_COLORS[sev];
  const scoreColor = score >= 80 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444';

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes pulseRing {
          0%,100% { box-shadow: 0 0 0 0 ${colors.border}66; }
          50%      { box-shadow: 0 0 0 10px ${colors.border}00; }
        }
        .anomaly-card {
          animation: slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1),
                     pulseRing 2s infinite;
        }
      `}</style>

      <div style={{
        position:  'fixed',
        top: "80px",
        right:     '20px',
        zIndex:    99999,
        width:     '310px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div
          className="anomaly-card"
          style={{
            background:   `linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)`,
            border:       `1.5px solid ${colors.border}`,
            borderRadius: '14px',
            padding:      '16px',
            color:        'white',
          }}
        >
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {/* Icon bubble */}
            <div style={{
              width:        '46px',
              height:       '46px',
              borderRadius: '10px',
              background:   colors.bg,
              border:       `1px solid ${colors.border}44`,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '22px',
              flexShrink:   0,
            }}>
              {ICONS[primary] || '⚠️'}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '6px',
                marginBottom:   '3px',
              }}>
                <span style={{
                  fontSize:      '10px',
                  fontWeight:    700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color:         colors.badge,
                  background:    colors.bg,
                  border:        `1px solid ${colors.border}55`,
                  borderRadius:  '4px',
                  padding:       '1px 6px',
                }}>
                  {sev === 'critical' ? '🚨 Critical' :
                   sev === 'high'     ? '⚠️ High' :
                   sev === 'medium'   ? '📢 Medium' : 'ℹ️ Low'}
                </span>
                {extraCount > 0 && (
                  <span style={{
                    fontSize:     '10px',
                    color:        '#6b7280',
                    background:   'rgba(255,255,255,0.06)',
                    borderRadius: '4px',
                    padding:      '1px 6px',
                  }}>
                    +{extraCount} more
                  </span>
                )}
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', lineHeight: 1.3 }}>
                {ANOMALY_LABELS[primary] || primary}
              </div>

              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                {ANOMALY_TIPS[primary] || 'Position theek karo'}
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => setVisible(false)}
              style={{
                background:   'rgba(255,255,255,0.07)',
                border:       '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color:        '#6b7280',
                cursor:       'pointer',
                fontSize:     '16px',
                width:        '26px',
                height:       '26px',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                flexShrink:   0,
                lineHeight:   1,
              }}
            >×</button>
          </div>

          {/* Score bar */}
          <div style={{ marginTop: '14px' }}>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              fontSize:       '11px',
              color:          '#6b7280',
              marginBottom:   '5px',
            }}>
              <span>Posture Score</span>
              <span style={{ color: scoreColor, fontWeight: 700 }}>{score}/100</span>
            </div>
            <div style={{
              background:   'rgba(255,255,255,0.08)',
              borderRadius: '6px',
              height:       '5px',
              overflow:     'hidden',
            }}>
              <div style={{
                width:        `${score}%`,
                height:       '100%',
                background:   `linear-gradient(90deg, ${scoreColor}99, ${scoreColor})`,
                borderRadius: '6px',
                transition:   'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
