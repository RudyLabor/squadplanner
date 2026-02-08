import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens, mockMembers } from '../../tokens';
import { MockNavbar } from '../MockNavbar';

export const HomeScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [3, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const headerY = interpolate(frame, [3, 12], [-10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const badgeScale = spring({ fps, frame: frame - 9, config: { stiffness: 400, damping: 15 } });

  const cardOpacity = interpolate(frame, [6, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const cardY = interpolate(frame, [6, 15], [15, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const statsOpacity = interpolate(frame, [15, 24], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const statsY = interpolate(frame, [15, 24], [10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const weekOpacity = interpolate(frame, [21, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const weekY = interpolate(frame, [21, 30], [10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Blinking "2 en ligne"
  const blinkOpacity = interpolate(frame % 60, [0, 30, 60], [1, 0.5, 1]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: tokens.bgPhone, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '24px 16px 12px', position: 'relative', opacity: headerOpacity, transform: `translateY(${headerY}px)` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
          Salut MaxGamer_94 !
        </div>
        <div style={{ fontSize: 10, color: tokens.textMuted, marginTop: 2 }}>
          T'es carré, toutes tes sessions sont confirmées
        </div>
        {/* Reliability badge */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 9999,
            backgroundColor: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.2)',
            transform: `scale(${badgeScale})`,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: tokens.emerald }}>100%</span>
          <span style={{ fontSize: 8, color: 'rgba(52,211,153,0.7)' }}>fiable</span>
        </div>
      </div>

      {/* Next session card */}
      <div
        style={{
          margin: '0 16px',
          padding: 14,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
          border: `1px solid ${tokens.borderIndigo}`,
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: tokens.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>Ranked du Mardi</div>
            <div style={{ fontSize: 9, color: tokens.textMuted }}>Les Invaincus · Demain 21h</div>
          </div>
          {/* Confirmée badge */}
          <div style={{
            padding: '2px 8px',
            borderRadius: 9999,
            backgroundColor: 'rgba(52,211,153,0.15)',
            fontSize: 8,
            color: tokens.emerald,
            fontWeight: 500,
            transform: `scale(${spring({ fps, frame: frame - 18, config: { stiffness: 400, damping: 15 } })})`,
          }}>
            Confirmée
          </div>
        </div>
        {/* RSVP avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex' }}>
            {mockMembers.slice(0, 4).map((m, i) => (
              <div
                key={m.name}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `1.5px solid ${tokens.bgPhone}`,
                  backgroundColor: m.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700,
                  color: 'white',
                  marginLeft: i > 0 ? -6 : 0,
                  transform: `scale(${spring({ fps, frame: frame - 12 - i * 2, config: { stiffness: 400, damping: 15 } })})`,
                }}
              >
                {m.initial}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 9, color: tokens.textSubtle }}>4/5 présents</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, opacity: interpolate(frame, [24, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }) }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={tokens.emerald} strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span style={{ fontSize: 8, color: tokens.emerald, fontWeight: 500 }}>Présent</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          margin: '12px 16px 0',
          opacity: statsOpacity,
          transform: `translateY(${statsY}px)`,
        }}
      >
        {[
          { label: 'Fiabilité', value: '94%', color: tokens.emerald },
          { label: 'Sessions', value: '12', color: tokens.indigo },
          { label: 'Streak', value: '🔥 5', color: tokens.warning },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: '#0f1012',
              borderRadius: 8,
              padding: 10,
              textAlign: 'center',
              border: `1px solid ${tokens.borderSubtle}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, color: tokens.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly summary */}
      <div
        style={{
          margin: '12px 16px 0',
          padding: 12,
          borderRadius: 12,
          backgroundColor: '#0f1012',
          border: `1px solid ${tokens.borderSubtle}`,
          opacity: weekOpacity,
          transform: `translateY(${weekY}px)`,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 600, color: tokens.textSubtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ta semaine</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={tokens.emerald} strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <span style={{ fontSize: 9, color: 'white' }}>3 sessions jouées</span>
          </div>
          <span style={{ fontSize: 8, color: tokens.emerald, fontWeight: 500 }}>100% présent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={tokens.indigo} strokeWidth={2} strokeLinecap="round"><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>
            </div>
            <span style={{ fontSize: 9, color: 'white' }}>Party vocale active</span>
          </div>
          <span style={{ fontSize: 8, color: tokens.indigo, opacity: blinkOpacity }}>2 en ligne</span>
        </div>
      </div>

      <MockNavbar active="home" />
    </div>
  );
};
