import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../../tokens';
import { MockNavbar } from '../MockNavbar';

export const ProfileScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const avatarScale = spring({ fps, frame: frame - 2, config: { stiffness: 300, damping: 15 } });

  const xpOpacity = interpolate(frame, [6, 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const xpY = interpolate(frame, [6, 14], [10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const reliabilityOpacity = interpolate(frame, [9, 17], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const reliabilityY = interpolate(frame, [9, 17], [10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const statsOpacity = interpolate(frame, [15, 23], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // XP bar animation
  const xpWidth = interpolate(frame, [15, 36], [0, 68], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Reliability circle
  const circumference = 2 * Math.PI * 20; // r=20
  const reliabilityProgress = interpolate(frame, [18, 45], [circumference, circumference * (1 - 0.94)], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: tokens.bgPhone, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Avatar section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20, paddingBottom: 12 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: tokens.indigo,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          color: 'white',
          marginBottom: 8,
          transform: `scale(${avatarScale})`,
        }}>
          M
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>MaxGamer_94</div>
        <div style={{ fontSize: 8, color: tokens.textMuted }}>Membre depuis janv. 2026</div>
      </div>

      {/* XP Progress */}
      <div style={{
        margin: '0 16px 12px',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#0f1012',
        border: `1px solid ${tokens.borderSubtle}`,
        opacity: xpOpacity,
        transform: `translateY(${xpY}px)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10 }}>⚡</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'white' }}>Niveau 4 — Régulier</span>
          </div>
          <span style={{ fontSize: 8, color: tokens.indigo }}>340 XP</span>
        </div>
        <div style={{ height: 6, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            borderRadius: 9999,
            background: `linear-gradient(to right, ${tokens.indigo}, ${tokens.lavender})`,
            width: `${xpWidth}%`,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 7, color: tokens.textMuted }}>340 XP</span>
          <span style={{ fontSize: 7, color: tokens.textMuted }}>500 XP pour le niveau 5</span>
        </div>
      </div>

      {/* Reliability score */}
      <div style={{
        margin: '0 16px 12px',
        padding: 12,
        borderRadius: 12,
        border: '1px solid rgba(245,166,35,0.2)',
        backgroundColor: 'rgba(245,166,35,0.05)',
        opacity: reliabilityOpacity,
        transform: `translateY(${reliabilityY}px)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* SVG circle */}
          <div style={{ position: 'relative', width: 48, height: 48 }}>
            <svg width={48} height={48} viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(245,166,35,0.15)" strokeWidth={3} />
              <circle
                cx={24} cy={24} r={20}
                fill="none"
                stroke={tokens.warning}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={reliabilityProgress}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: tokens.warning }}>94%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'white' }}>Score de fiabilité</div>
            <div style={{ fontSize: 8, color: tokens.warning }}>🏆 Légende</div>
            <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
              {['✅', '✅', '✅', '❌', '✅', '✅'].map((s, j) => (
                <span
                  key={j}
                  style={{
                    fontSize: 7,
                    transform: `scale(${spring({ fps, frame: frame - 24 - j * 1.5, config: { stiffness: 400, damping: 15 } })})`,
                    display: 'inline-block',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        margin: '0 16px',
        opacity: statsOpacity,
      }}>
        {[
          { label: 'Sessions', value: '12', icon: '📅' },
          { label: 'Check-ins', value: '11', icon: '✅' },
          { label: 'Squads', value: '2', icon: '👥' },
          { label: 'Challenges', value: '3/9', icon: '🏅' },
        ].map((s) => (
          <div key={s.label} style={{ padding: 10, borderRadius: 8, backgroundColor: '#0f1012', border: `1px solid ${tokens.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10 }}>{s.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{s.value}</span>
            </div>
            <span style={{ fontSize: 7, color: tokens.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      <MockNavbar active="profile" />
    </div>
  );
};
