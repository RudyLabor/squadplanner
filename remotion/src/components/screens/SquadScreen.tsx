import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens, mockMembers } from '../../tokens';
import { MockNavbar } from '../MockNavbar';

export const SquadScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const inviteOpacity = interpolate(frame, [4, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const inviteX = interpolate(frame, [4, 12], [-10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const partyOpacity = interpolate(frame, [7, 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const sessionOpacity = interpolate(frame, [10, 18], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const sessionY = interpolate(frame, [10, 18], [10, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  const membersOpacity = interpolate(frame, [21, 28], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Speaking pulse
  const pulseScale = interpolate(frame % 45, [0, 22, 45], [1, 1.4, 1]);
  const pulseOpacity = interpolate(frame % 45, [0, 22, 45], [0.3, 0, 0.3]);

  const blinkOpacity = interpolate(frame % 60, [0, 30, 60], [1, 0.5, 1]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: tokens.bgPhone, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 8px', opacity: headerOpacity }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Les Invaincus</div>
          <span style={{ fontSize: 10 }}>👑</span>
        </div>
        <div style={{ fontSize: 9, color: tokens.textMuted, marginTop: 2 }}>Valorant · 5 membres</div>
      </div>

      {/* Invite code */}
      <div style={{
        margin: '0 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#0f1012',
        border: `1px solid ${tokens.borderIndigo}`,
        opacity: inviteOpacity,
        transform: `translateX(${inviteX}px)`,
      }}>
        <div>
          <div style={{ fontSize: 7, color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Code d'invitation</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: 2 }}>8J9DQR</div>
        </div>
        <div style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: tokens.indigo, fontSize: 8, color: 'white', fontWeight: 500 }}>Copier</div>
      </div>

      {/* Party vocale */}
      <div style={{
        margin: '0 16px 12px',
        padding: 10,
        borderRadius: 8,
        border: `1px solid ${tokens.borderSubtle}`,
        opacity: partyOpacity,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={tokens.emerald} strokeWidth={2} strokeLinecap="round"><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>
          <span style={{ fontSize: 10, fontWeight: 500, color: 'white' }}>Party vocale</span>
          <span style={{ marginLeft: 'auto', fontSize: 8, color: tokens.emerald, opacity: blinkOpacity }}>2 en ligne</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mockMembers.slice(0, 2).map((m, i) => (
            <div key={m.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: interpolate(frame, [12 + i * 4, 18 + i * 4], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }),
            }}>
              <div style={{ position: 'relative' }}>
                {i === 0 && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: tokens.emerald,
                    transform: `scale(${pulseScale})`,
                    opacity: pulseOpacity,
                  }} />
                )}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: 'white',
                  backgroundColor: m.color,
                }}>
                  {m.initial}
                </div>
              </div>
              <span style={{ fontSize: 8, color: tokens.textSubtle }}>{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session RSVP */}
      <div style={{
        margin: '0 16px',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#0f1012',
        border: `1px solid ${tokens.borderSubtle}`,
        opacity: sessionOpacity,
        transform: `translateY(${sessionY}px)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={tokens.indigo} strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'white' }}>Ranked du Mardi</div>
            <div style={{ fontSize: 8, color: tokens.textMuted }}>Demain 21:00 · 4/5 présents</div>
          </div>
        </div>
        {/* RSVP buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Présent', color: tokens.emerald, active: true },
            { label: 'Peut-être', color: tokens.warning, active: false },
            { label: 'Absent', color: tokens.error, active: false },
          ].map((opt, i) => (
            <div
              key={opt.label}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 8,
                textAlign: 'center',
                fontSize: 8,
                fontWeight: 500,
                color: opt.active ? opt.color : tokens.textMuted,
                backgroundColor: opt.active ? `${opt.color}15` : 'transparent',
                border: `1px solid ${opt.active ? `${opt.color}40` : tokens.borderSubtle}`,
                transform: `scale(${spring({ fps, frame: frame - 18 - i * 3, config: { stiffness: 400, damping: 15 } })})`,
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {/* Members preview */}
      <div style={{ margin: '12px 16px 0', opacity: membersOpacity }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: tokens.textSubtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Membres (5)</div>
        {mockMembers.slice(0, 3).map((m) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'white', backgroundColor: m.color }}>
              {m.initial}
            </div>
            <span style={{ fontSize: 9, color: 'white', flex: 1 }}>{m.name}</span>
            <span style={{ fontSize: 7, color: tokens.emerald }}>{m.score}%</span>
          </div>
        ))}
      </div>

      <MockNavbar active="squads" />
    </div>
  );
};
