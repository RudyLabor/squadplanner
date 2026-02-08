import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { tokens } from '../tokens';

interface PhoneFrameProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  width = 280,
  height = 480,
}) => {
  const frame = useCurrentFrame();

  // Glow pulse behind phone
  const glowOpacity = interpolate(
    frame % 120,
    [0, 60, 120],
    [0.5, 0.8, 0.5]
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <div style={{ position: 'relative', width }}>
        {/* Glow behind phone */}
        <div
          style={{
            position: 'absolute',
            inset: -32,
            borderRadius: 48,
            background:
              'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
            opacity: glowOpacity,
          }}
        />

        {/* Phone body */}
        <div
          style={{
            position: 'relative',
            background: `linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.04))`,
            borderRadius: 40,
            padding: 1,
            boxShadow: '0 25px 50px -12px rgba(99,102,241,0.2)',
          }}
        >
          <div
            style={{
              backgroundColor: tokens.bgPhoneBody,
              borderRadius: 40,
              padding: 10,
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 112,
                height: 24,
                backgroundColor: tokens.bgPhoneBody,
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                zIndex: 20,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 8,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 4,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {/* Screen */}
            <div
              style={{
                backgroundColor: tokens.bgPhone,
                borderRadius: 32,
                overflow: 'hidden',
                position: 'relative',
                height,
              }}
            >
              {/* Status bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 20px 4px',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: tokens.textSubtle,
                    fontWeight: 500,
                  }}
                >
                  21:00
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {/* Signal bars */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 2,
                          height: 4 + i * 1.5,
                          borderRadius: 1,
                          backgroundColor: i <= 3 ? 'white' : tokens.textMuted,
                        }}
                      />
                    ))}
                  </div>
                  {/* Battery */}
                  <div
                    style={{
                      width: 20,
                      height: 10,
                      borderRadius: 2,
                      border: `1px solid ${tokens.textMuted}`,
                      marginLeft: 4,
                      padding: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 6,
                        backgroundColor: tokens.emerald,
                        borderRadius: 1,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Screen content */}
              <div style={{ height: '100%', paddingTop: 24 }}>
                {children}
              </div>

              {/* Screen reflection */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                  borderRadius: 32,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
