/**
 * FILE: client/src/components/AnomalyOverlay.jsx
 * =================================================
 * Interview ke dauran floating warning card dikhata hai.
 * Flat, professional design — koi glow/neon effect nahi,
 * responsive width taaki chhoti screens pe bhi sahi dikhe.
 */

import { useEffect, useState, useRef } from 'react';
import {
  AlertTriangle, User, Users, RotateCcw, Eye, ArrowDown, Armchair,
  MoveHorizontal, Hand, Waves, Camera, ZoomIn, ZoomOut, X,
  Volume2, Users2, VideoOff,
} from 'lucide-react';
import { ANOMALY_LABELS, ANOMALY_TIPS, ANOMALY_SEVERITY } from '../hooks/useAnomalyDetector';

const ICONS = {
  no_person_detected:      User,
  multiple_people:         Users,
  face_turned_away:        RotateCcw,
  eyes_not_on_screen:      Eye,
  looking_down:            ArrowDown,
  slouching:                Armchair,
  uneven_shoulders:        AlertTriangle,
  leaning_sideways:        MoveHorizontal,
  hand_near_face:          Hand,
  excessive_hand_gesture:  Waves,
  arms_out_of_frame:       Hand,
  too_far_from_camera:     ZoomIn,
  too_close_to_camera:     ZoomOut,
  tab_switched:            AlertTriangle,
  background_voice:        Volume2,
  multiple_voices:         Users2,
  camera_off:              VideoOff,
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

const SEVERITY_META = {
  critical: { accent: '#ef4444', label: 'Critical' },
  high:     { accent: '#f97316', label: 'High' },
  medium:   { accent: '#f59e0b', label: 'Medium' },
  low:      { accent: '#6366f1', label: 'Low' },
};

export default function AnomalyOverlay({ anomalies = [], score = 100, isCameraOn = true, isLight = false }) {
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

  const sev   = ANOMALY_SEVERITY[primary] || 'medium';
  const meta  = SEVERITY_META[sev];
  const Icon  = ICONS[primary] || AlertTriangle;
  const scoreColor = score >= 80 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626';

  const cardBg      = isLight ? '#ffffff' : '#15151f';
  const cardBorder  = isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)';
  const titleColor  = isLight ? '#1e293b' : '#f1f5f9';
  const bodyColor   = isLight ? '#64748b' : '#9ca3af';
  const mutedColor  = isLight ? '#94a3b8' : '#6b7280';
  const trackBg     = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)';
  const dividerColor = isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)';
  const iconBg      = isLight ? '#fef2f2' : 'rgba(239,68,68,0.12)';

  return (
    <>
      <style>{`
        @keyframes anomalySlideIn {
          from { transform: translateX(24px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .anomaly-card { animation: anomalySlideIn 0.2s ease-out; }
      `}</style>

      <div style={{
        position:   'fixed',
        top:        '84px',
        right:      '16px',
        left:       'auto',
        zIndex:     9999,
        width:      'min(320px, calc(100vw - 32px))',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div
          className="anomaly-card"
          style={{
            background:   cardBg,
            border:       `0.5px solid ${cardBorder}`,
            borderLeft:   `3px solid ${meta.accent}`,
            borderRadius: '10px',
            padding:      '14px 16px',
            boxShadow:    isLight ? '0 4px 16px rgba(15,23,42,0.08)' : '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: iconBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={16} color={meta.accent} strokeWidth={2} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: meta.accent,
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                }}>
                  {meta.label}
                </span>
                {extraCount > 0 && (
                  <span style={{ fontSize: '11px', color: mutedColor }}>+{extraCount} more</span>
                )}
              </div>

              <div style={{ fontSize: '14px', fontWeight: 600, color: titleColor, marginBottom: '2px', lineHeight: 1.3 }}>
                {ANOMALY_LABELS[primary] || primary}
              </div>

              <div style={{ fontSize: '12px', color: bodyColor, lineHeight: 1.5 }}>
                {ANOMALY_TIPS[primary] || 'Position theek karo'}
              </div>
            </div>

            <button
              onClick={() => setVisible(false)}
              aria-label="Dismiss"
              style={{
                background: 'transparent', border: 'none', color: mutedColor,
                cursor: 'pointer', width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, borderRadius: '6px', padding: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `0.5px solid ${dividerColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: mutedColor, marginBottom: '4px' }}>
              <span>Posture score</span>
              <span style={{ color: scoreColor, fontWeight: 600 }}>{score}/100</span>
            </div>
            <div style={{ background: trackBg, borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${score}%`, height: '100%', background: scoreColor,
                borderRadius: '3px', transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
