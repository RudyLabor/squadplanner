import React from 'react'

export const StatusBar: React.FC = () => {
  const color = 'rgba(255,255,255,0.9)'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px 0 24px',
        height: 48,
        boxSizing: 'border-box' as const,
        flexShrink: 0,
      }}
    >
      {/* Time */}
      <span
        style={{
          color,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: '-apple-system, system-ui, sans-serif',
          letterSpacing: 0.3,
        }}
      >
        9:41
      </span>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Signal bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 12 }}>
          {[4, 6, 9, 12].map((h, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: h,
                borderRadius: 1,
                backgroundColor: color,
              }}
            />
          ))}
        </div>
        {/* WiFi */}
        <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
          <path
            d="M7.5 11C8.1 11 8.5 10.5 8.5 10C8.5 9.5 8.1 9 7.5 9C6.9 9 6.5 9.5 6.5 10C6.5 10.5 6.9 11 7.5 11Z"
            fill={color}
          />
          <path
            d="M4.5 7.5C5.3 6.7 6.4 6 7.5 6C8.6 6 9.7 6.7 10.5 7.5"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M2 5C3.5 3.5 5.5 2.5 7.5 2.5C9.5 2.5 11.5 3.5 13 5"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 24,
              height: 11,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.35)',
              padding: 1.5,
              display: 'flex',
            }}
          >
            <div
              style={{
                flex: 1,
                borderRadius: 1.5,
                backgroundColor: color,
              }}
            />
          </div>
          <div
            style={{
              width: 2,
              height: 5,
              borderRadius: '0 1px 1px 0',
              backgroundColor: 'rgba(255,255,255,0.35)',
              marginLeft: 0.5,
            }}
          />
        </div>
      </div>
    </div>
  )
}
