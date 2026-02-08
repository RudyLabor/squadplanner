import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens, mockMembers } from '../../tokens';
import { MockNavbar } from '../MockNavbar';

export const PartyScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const controlsOpacity = interpolate(frame, [24, 32], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const controlsY = interpolate(frame, [24, 32], [10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const waveOpacity = interpolate(frame, [18, 25], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: tokens.bgPhone, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', position: 'relative' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 40%, rgba(52,211,153,0.08), transparent 70%)',
      }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px 16px 8px', opacity: headerOpacity }}>
        <div style={{ fontSize: 9, color: tokens.emerald, fontWeight: 500 }}>Party vocale en cours</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Les Invaincus</div>
        <div style={{ fontSize: 8, color: tokens.textMuted, marginTop: 2 }}>En ligne depuis 47 min</div>
      </div>

      {/* Participants list */}
      <div style={{ position: 'relative', zIndex: 10, padding: '8px 16px', flex: 1 }}>
        {mockMembers.slice(0, 4).map((m, i) => {
          const isSpeaking = i < 2;
          const slideX = interpolate(frame, [6 + i * 3, 14 + i * 3], [-15, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const slideOpacity = interpolate(frame, [6 + i * 3, 14 + i * 3], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

          // Speaking ring pulse
          const ringScale = interpolate(frame % 60, [0, 30, 60], [1, 1.2, 1]);
          const ringOpacity = interpolate(frame % 60, [0, 30, 60], [0.6, 0.2, 0.6]);

          return (
            <div
              key={m.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 10,
                padding: 8,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${tokens.borderSubtle}`,
                opacity: slideOpacity,
                transform: `translateX(${slideX}px)`,
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                {i === 0 && (
                  <div style={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    border: `1px solid ${tokens.emerald}`,
                    transform: `scale(${ringScale})`,
                    opacity: ringOpacity,
                  }} />
                )}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'white',
                  backgroundColor: m.color,
                  boxShadow: i === 0 ? '0 0 0 1px rgba(52,211,153,0.3)' : 'none',
                }}>
                  {m.initial}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: i === 0 ? tokens.emerald : 'white' }}>{m.name}</div>
                <div style={{ fontSize: 7, color: tokens.textMuted }}>{m.score}% fiable</div>
              </div>
              {/* Audio level bars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginRight: 4 }}>
                {[0, 1, 2, 3].map((j) => {
                  const barHeight = isSpeaking
                    ? interpolate(
                        (frame + j * 5) % 20,
                        [0, 10, 20],
                        [3, 8 + j * 2, 3]
                      )
                    : 3;
                  return (
                    <div
                      key={j}
                      style={{
                        width: 2,
                        height: barHeight,
                        borderRadius: 9999,
                        backgroundColor: isSpeaking ? tokens.emerald : tokens.textMuted,
                      }}
                    />
                  );
                })}
              </div>
              {/* Mic icon */}
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke={isSpeaking ? tokens.emerald : tokens.textMuted}
                strokeWidth={2}
                strokeLinecap="round"
              >
                {isSpeaking ? (
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2" />
                ) : (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                    <path d="M17 16.95A7 7 0 015 12v-2m14 0v2c0 .39-.03.77-.1 1.14" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </>
                )}
              </svg>
            </div>
          );
        })}

        {/* Voice wave center */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          marginTop: 8,
          opacity: waveOpacity,
        }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => {
            const barH = interpolate(
              (frame + j * 4) % 25,
              [0, 12, 25],
              [3, 10 + j % 3 * 3, 3]
            );
            return (
              <div
                key={j}
                style={{
                  width: 2,
                  height: barH,
                  borderRadius: 9999,
                  backgroundColor: tokens.emerald,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '12px 0',
        opacity: controlsOpacity,
        transform: `translateY(${controlsY}px)`,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /></svg>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: tokens.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
        </div>
      </div>

      <MockNavbar active="party" />
    </div>
  );
};
