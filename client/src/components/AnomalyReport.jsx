/**
 * FILE: client/src/components/AnomalyReport.jsx
 * ================================================
 * Interview khatam hone ke baad poora proctoring report dikhata hai.
 * Pass karo: summary = getSessionSummary() ka result
 *
 * Usage:
 *   <AnomalyReport summary={anomalySummary} />
 */

import { useState } from 'react';
import { ANOMALY_LABELS, ANOMALY_SEVERITY } from '../hooks/useAnomalyDetector';

const SEV_COLOR = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#6366f1',
};

const SEV_BG = {
  critical: 'rgba(239,68,68,0.1)',
  high:     'rgba(249,115,22,0.1)',
  medium:   'rgba(245,158,11,0.1)',
  low:      'rgba(99,102,241,0.1)',
};

const ICONS = {
  no_person_detected:'👤', multiple_people:'👥', face_turned_away:'↩️',
  eyes_not_on_screen:'👀', looking_down:'⬇️', slouching:'🪑',
  uneven_shoulders:'⚠️', leaning_sideways:'↗️', hand_near_face:'🤚',
  excessive_hand_gesture:'🙌', arms_out_of_frame:'🦾',
  too_far_from_camera:'📷', too_close_to_camera:'🔍',
  tab_switched:'🚨', background_voice:'🔊', multiple_voices:'🗣️',
  camera_off:'📵',
};

function getRatingColor(rating) {
  return {
    'Excellent': '#22c55e',
    'Good':      '#84cc16',
    'Fair':      '#f59e0b',
    'Needs Improvement': '#f97316',
    'Poor':      '#ef4444',
  }[rating] || '#6b7280';
}

export default function AnomalyReport({ summary }) {
  const [showLog, setShowLog] = useState(false);

  if (!summary) return null;

  const { totalFlags, averageScore, topIssues, flagRate, overallRating, tabSwitches, rawLog } = summary;
  const rColor = getRatingColor(overallRating);

  // Group issues by severity
  const critical = topIssues.filter(i => i.severity === 'critical');
  const high     = topIssues.filter(i => i.severity === 'high');
  const others   = topIssues.filter(i => !['critical','high'].includes(i.severity));

  return (
    <div style={{
      background:   '#0a0a14',
      border:       '1px solid rgba(99,102,241,0.25)',
      borderRadius: '18px',
      padding:      '28px',
      color:        'white',
      fontFamily:   'Inter, system-ui, sans-serif',
      maxWidth:     '700px',
      margin:       '0 auto',
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize:   '20px',
          fontWeight: 800,
          margin:     '0 0 4px 0',
          background: 'linear-gradient(135deg, #818cf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor:  'transparent',
        }}>
          🔍 Proctoring Report
        </h2>
        <p style={{ color: '#4b5563', fontSize: '13px', margin: 0 }}>
          Interview ke dauran AI ne behavior analyze kiya
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap:                 '10px',
        marginBottom:        '24px',
      }}>
        {[
          { label: 'Posture Score',   value: `${averageScore}`,  unit: '/100', color: rColor },
          { label: 'Overall Rating',  value: overallRating,       unit: '',     color: rColor },
          { label: 'Flag Rate',       value: flagRate,            unit: '',     color: totalFlags === 0 ? '#22c55e' : '#f59e0b' },
          { label: 'Tab Switches',    value: `${tabSwitches}`,    unit: 'x',    color: tabSwitches === 0 ? '#22c55e' : '#ef4444' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{
            background:   'rgba(255,255,255,0.03)',
            border:       '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            padding:      '14px 12px',
            textAlign:    'center',
          }}>
            <div style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1 }}>
              {value}
              <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 400 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── All Clear ── */}
      {topIssues.length === 0 && tabSwitches === 0 && (
        <div style={{
          textAlign:    'center',
          padding:      '32px',
          background:   'rgba(34,197,94,0.07)',
          border:       '1px solid rgba(34,197,94,0.2)',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
          <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '16px' }}>
            Koi issue nahi mila!
          </div>
          <div style={{ color: '#4b5563', fontSize: '13px', marginTop: '6px' }}>
            Posture aur focus dono excellent tha. Bahut achha!
          </div>
        </div>
      )}

      {/* ── Tab Switch Warning ── */}
      {tabSwitches > 0 && (
        <div style={{
          padding:      '14px 16px',
          background:   'rgba(239,68,68,0.08)',
          border:       '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          marginBottom: '14px',
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
        }}>
          <span style={{ fontSize: '24px' }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '14px' }}>
              Tab {tabSwitches} baar switch kiya gaya
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
              Interview ke dauran dusri windows mein gaye — yeh serious flag hai
            </div>
          </div>
        </div>
      )}

      {/* ── Issues List ── */}
      {topIssues.length > 0 && (
        <div>
          {/* Critical & High first */}
          {[...critical, ...high, ...others].map(({ type, count, label, severity, tip, percentage }) => {
            const sc = SEV_COLOR[severity] || '#6366f1';
            const sb = SEV_BG[severity]   || 'rgba(99,102,241,0.1)';
            return (
              <div key={type} style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
                padding:      '12px 14px',
                background:   'rgba(255,255,255,0.025)',
                border:       `1px solid ${sc}22`,
                borderLeft:   `3px solid ${sc}`,
                borderRadius: '10px',
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '22px', flexShrink: 0 }}>{ICONS[type] || '⚠️'}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {label}
                    <span style={{
                      fontSize: '10px', color: sc,
                      background: sb, borderRadius: '4px',
                      padding: '1px 6px', fontWeight: 700, textTransform: 'uppercase',
                    }}>
                      {severity}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(percentage, 100)}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${sc}88, ${sc})`,
                      borderRadius: '4px',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>

                  {tip && (
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '5px' }}>
                      💡 {tip}
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: sc }}>{count}×</div>
                  <div style={{ fontSize: '10px', color: '#4b5563' }}>{percentage}% frames</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Raw Log toggle ── */}
      {rawLog && rawLog.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowLog(v => !v)}
            style={{
              background:   'rgba(255,255,255,0.05)',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color:        '#6b7280',
              cursor:       'pointer',
              fontSize:     '12px',
              padding:      '8px 14px',
              width:        '100%',
            }}
          >
            {showLog ? '▲ Hide' : '▼ Show'} Raw Timeline ({rawLog.length} events)
          </button>

          {showLog && (
            <div style={{
              marginTop:  '10px',
              maxHeight:  '220px',
              overflowY:  'auto',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding:    '10px',
            }}>
              {rawLog.map((e, i) => (
                <div key={i} style={{
                  fontSize:     '11px',
                  color:        '#4b5563',
                  paddingBottom:'6px',
                  marginBottom: '6px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ color: '#6b7280', marginRight: '8px' }}>
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                  {e.anomalies.map(a => (
                    <span key={a} style={{
                      background:   SEV_BG[ANOMALY_SEVERITY[a]] || 'rgba(99,102,241,0.1)',
                      color:        SEV_COLOR[ANOMALY_SEVERITY[a]] || '#818cf8',
                      borderRadius: '4px',
                      padding:      '1px 6px',
                      marginRight:  '4px',
                      fontSize:     '10px',
                    }}>
                      {ICONS[a]} {a}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
